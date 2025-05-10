import {User} from "../models/User.model.js"
import { generateToken, setAuthCookie, clearAuthCookie } from "../middleware/auth.js"
import {PublicClientApplication} from "@azure/msal-browser"
import { Department } from "../models/Department.model.js"

// Microsoft Teams SSO Configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  },
}

// Create MSAL application
const msalClient = new PublicClientApplication(msalConfig)

// Login with email and password
export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // If user has no password (SSO only), reject login
    if (!user.password) {
      return res.status(401).json({ message: "Please use Microsoft Teams to login" })
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = generateToken(user)

    // Set auth cookie
    setAuthCookie(res, token)

    return res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: await Department.findById(user.department),
        role: user.role,
        surveyedDepartmentIds : user.surveyedDepartmentIds
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ message: "An error occurred during login" })
  }
}

// Logout
export async function logout(req, res) {
  try {
    // Clear auth cookie
    clearAuthCookie(res)

    return res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return res.status(500).json({ message: "An error occurred during logout" })
  }
}

// Get current user
export async function getCurrentUser(req, res) {
  try {
    return res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      department: await Department.findById(req.user.department),
      role: req.user.role,
      surveyedDepartmentIds : req.user.surveyedDepartmentIds
    })
  } catch (error) {
    console.error("Get current user error:", error)
    return res.status(500).json({ message: "An error occurred while fetching user data" })
  }
}

// Get Microsoft Teams login URL
export async function getMicrosoftLoginUrl(req, res) {
  try {
    const redirectUri = req.query.redirectUri || `${req.protocol}://${req.get("host")}/api/auth/microsoft/callback`

    const authCodeUrlParameters = {
      scopes: ["user.read"],
      redirectUri,
    }

    const loginUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters)

    return res.json({ loginUrl })
  } catch (error) {
    console.error("Microsoft login error:", error)
    return res.status(500).json({ message: "Failed to generate Microsoft login URL" })
  }
}

// Handle Microsoft Teams authentication callback
export async function handleMicrosoftCallback(req, res) {
  try {
    const code = req.query.code
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/microsoft/callback`

    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`)
    }

    // Exchange code for token
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: ["user.read"],
      redirectUri,
    })

    // Get user info from Microsoft Graph
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user from Microsoft Graph")
    }

    const msUser = await response.json()

    // Find or create user in our database
    let user = await User.findOne({ email: msUser.mail || msUser.userPrincipalName })

    if (!user) {
      // Create new user
      user = new User({
        name: msUser.displayName,
        email: msUser.mail || msUser.userPrincipalName,
        department: "", // This would need to be set later
        role: "user", // Default role
      })

      await user.save()
    }

    // Generate JWT token
    const token = generateToken(user)

    // Set auth cookie
    setAuthCookie(res, token)

    // Redirect to dashboard
    return res.redirect(`${process.env.CLIENT_URL}/dashboard`)
  } catch (error) {
    console.error("Microsoft callback error:", error)
    return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`)
  }
}

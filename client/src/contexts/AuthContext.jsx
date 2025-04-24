import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/api/auth/me", { withCredentials: true })
        setCurrentUser(response.data)
      } catch (error) {
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    const response = await axios.post("/api/auth/login", { email, password }, { withCredentials: true })
    setCurrentUser(response.data.user)
    return response.data
  }

  // Logout function
  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true })
    setCurrentUser(null)
  }

  // Get Microsoft login URL
  const getMicrosoftLoginUrl = async () => {
    const response = await axios.get(
      `/api/auth/microsoft?redirectUri=${window.location.origin}/api/auth/microsoft/callback`,
    )
    return response.data.loginUrl
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
    getMicrosoftLoginUrl,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { User } from "../models/User.model.js"
import { Department } from "../models/Department.model.js"
import mongoose from "mongoose"
import { generateToken, setAuthCookie } from "../middleware/auth.js"

// Get all users
export async function getUsers(req, res) {
  try {
    const users = await User.find().select("-password")

    return res.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return res.status(500).json({ message: "Failed to fetch users" })
  }
}

// Get user by ID
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.json(user)
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to fetch user" })
  }
}

export async function addUser(req, res) {
  try {
    const { name, email, password, department, role = "user" } = req.body

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    const departmentData = await Department.findById(department);
    if (!departmentData){
      return res.status(404).json({message : "Invalid Department Id"})
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      department : new mongoose.Types.ObjectId(department),
      role, 
    })

    await user.save()
    const resUser = await User.findById(user._id).select("-password")

    return res.status(201).json({ 
      message: "Registration successful",
      user : resUser
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({ message: "An error occurred during registration" })
  }
}

// Update a user
export async function updateUser(req, res) {
  try {
    const { name, email, departmentId, role, password } = req.body

    const user = await User.findById(req.params?.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (name) user.name = name
    if (email) user.email = email
    if (departmentId) user.department = new mongoose.Types.ObjectId(departmentId)
    if (role) user.role = role
    if (password) user.password = password
    
    await user.save({validateBeforeSave : false})
    
    return res.json(user)
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to update user" })
  }
}

//Delete a user
export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await user.deleteOne()

    return res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to delete user" })
  }
}
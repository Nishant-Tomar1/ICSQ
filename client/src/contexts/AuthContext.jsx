import { createContext, useContext, useState, useEffect } from "react"
import {Server} from "../Constants"
import axios from "axios"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const checkAuth = async () => {
    try {
      const response = await axios.get(`${Server}/auth/me`, { withCredentials: true })
      setCurrentUser(response.data)
    } catch (error) {
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    const response = await axios.post(`${Server}/auth/login`, { email, password }, { withCredentials: true })
    setCurrentUser(response.data.user)
    return response.data
  }

  // Logout function
  const logout = async () => {
    await axios.post(`${Server}/auth/logout`, {}, { withCredentials: true })
    setCurrentUser(null)
  }

  // Get Microsoft login URL
  const getMicrosoftLoginUrl = async () => {
    const response = await axios.get(
      `${Server}/auth/microsoft`,
    )    
    return response.data.loginUrl;
  }

  // Check if user is admin
  const isAdmin = () => {
    return currentUser?.role === "admin"
  }

  // Check if user has access to a specific department
  const hasAccessToDepartment = (departmentId) => {
    if (isAdmin()) return true
    return currentUser?.department === departmentId
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
    checkAuth,
    getMicrosoftLoginUrl,
    isAdmin,
    hasAccessToDepartment,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

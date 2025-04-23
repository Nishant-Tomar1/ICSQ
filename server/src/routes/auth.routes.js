import { Router } from "express"
const router = Router()
import { register, login, logout, getCurrentUser, getMicrosoftLoginUrl, handleMicrosoftCallback } from "../controllers/auth.controller"
import { requireAuth } from "../middleware/auth"

// Register a new user
router.post("/register", register)

// Login with email and password
router.post("/login", login)

// Logout
router.post("/logout", logout)

// Get current user
router.get("/me", requireAuth, getCurrentUser)

// Microsoft Teams SSO routes
router.get("/microsoft", getMicrosoftLoginUrl)
router.get("/microsoft/callback", handleMicrosoftCallback)

export default router

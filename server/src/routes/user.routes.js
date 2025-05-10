import { Router } from "express";
const router = Router()
import { requireAdmin, requireAuth } from "../middleware/auth.js"
import { addUser, deleteUser, getUserById, getUsers, updateUser } from "../controllers/user.controller.js";

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all users 
router.get("/", getUsers)

// Get user by ID
router.get("/:id", getUserById)

// Register a new user 
router.post("/",requireAdmin, addUser)

// Update a user
router.put("/:id", updateUser)

// Delete user
router.delete("/:id", requireAdmin, deleteUser)

export default router
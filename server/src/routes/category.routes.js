import { Router } from "express"
const router = Router()
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "../controllers/category.controller.js"
import { requireAuth } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all categories
router.get("/", getCategories)

// Get category by ID
router.get("/:id", getCategoryById)

// Create a new category
router.post("/", createCategory)

// Update a category
router.put("/:id", updateCategory)

// Delete a category
router.delete("/:id", deleteCategory)

export default router

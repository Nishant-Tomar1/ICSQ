import { Router } from "express"
const router = Router()
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from "../controllers/department.controller"
import { requireAuth } from "../middleware/auth"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all departments
router.get("/", getDepartments)

// Get department by ID
router.get("/:id", getDepartmentById)

// Create a new department
router.post("/", createDepartment)

// Update a department
router.put("/:id", updateDepartment)

// Delete a department
router.delete("/:id", deleteDepartment)

export default router

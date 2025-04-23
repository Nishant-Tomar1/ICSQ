import { Router } from "express"
const router = Router()
import { getSIPOCByDepartment, createOrUpdateSIPOC, deleteSIPOC } from "../controllers/sipoc.controller.js"
import { requireAuth } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get SIPOC by department
router.get("/", getSIPOCByDepartment)

// Create or update SIPOC
router.put("/", createOrUpdateSIPOC)

// Delete SIPOC
router.delete("/", deleteSIPOC)

export default router

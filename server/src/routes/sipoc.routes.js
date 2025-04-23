import { Router } from "express"
const router = Router()
import { getSIPOCByDepartment, createOrUpdateSIPOC, deleteSIPOC } from "../controllers/sipoc.controller"
import { requireAuth } from "../middleware/auth"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get SIPOC by department
router.get("/", getSIPOCByDepartment)

// Create or update SIPOC
router.put("/", createOrUpdateSIPOC)

// Delete SIPOC
router.delete("/", deleteSIPOC)

export default router

import { Router } from "express"
const router = Router()
import { getSIPOCByDepartment, createOrUpdateSIPOC, deleteSIPOC } from "../controllers/sipoc.controller.js"
import { requireAdmin, requireAuth, requireManager } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get SIPOC by department
router.get("/", getSIPOCByDepartment)

// Create or update SIPOC
router.put("/",requireManager, createOrUpdateSIPOC)

// Delete SIPOC
router.delete("/",requireAdmin, deleteSIPOC)

export default router

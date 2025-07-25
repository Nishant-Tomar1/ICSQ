import { Router } from "express"
const router = Router()
import {
  getActionPlansForAdmin,
  getActionPlansForHOD,
  getActionPlansForUser,
  createActionPlan,
  updateActionPlan,
  updateActionPlanStatus,
  deleteActionPlan,
} from "../controllers/actionPlan.controller.js"
import { requireAdmin, requireAuth, requireHOD } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Admin: get all action plans
router.get("/admin", requireAdmin, getActionPlansForAdmin)
// HOD: get all action plans for their department
router.get("/hod", requireHOD, getActionPlansForHOD)
// User: get all action plans assigned to them
router.get("/user", getActionPlansForUser)

// Create a new action plan (HOD or admin)
router.post("/", requireHOD, createActionPlan)
// Update an action plan (HOD or admin)
router.put("/:id", updateActionPlan)
// User updates status of their assigned action plan
router.patch("/:id/status", updateActionPlanStatus)
// Delete an action plan (admin only)
router.delete("/:id", requireAdmin, deleteActionPlan)

export default router

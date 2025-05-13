import { Router } from "express"
const router = Router()
import { getActionPlans, getActionPlanById, createActionPlan, updateActionPlan, updateActionPlans, deleteActionPlan } from "../controllers/actionPlan.controller.js"
import { requireAdmin, requireAuth, requireManager } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all action plans with optional filters
router.get("/", getActionPlans)

// Get action plan by ID
router.get("/:id", getActionPlanById)

// Create a new action plan
router.post("/", requireManager, createActionPlan)

// Update an action plan
router.put("/:id",requireManager, updateActionPlan)

// Update multiple action plans
router.put("/",requireManager, updateActionPlans)

// Delete an action plan
router.delete("/:id", requireAdmin, deleteActionPlan)

export default router

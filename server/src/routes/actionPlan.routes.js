import { Router } from "express"
const router = Router()
import { getActionPlans, getActionPlanById, createActionPlan, updateActionPlan, updateActionPlans, deleteActionPlan} from "../controllers/actionPlan.controller.js"
import { requireAdmin, requireAuth, requireHOD } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all action plans with optional filters
router.get("/", getActionPlans)

// Get action plan by ID
router.get("/:id", getActionPlanById)

// Create a new action plan
router.post("/", requireHOD, createActionPlan)

// Update an action plan
router.put("/:id",requireHOD, updateActionPlan)

// Update multiple action plans
router.put("/",requireHOD, updateActionPlans)

// Delete an action plan
router.delete("/:id", requireAdmin, deleteActionPlan)


export default router

import { Router } from "express"
const router = Router()
import { getDepartmentScores, getCategoryScores, getActionPlanStats } from "../controllers/analytics.controller.js"
import { requireAuth } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get department scores
router.get("/department-scores", getDepartmentScores)

// Get category scores
router.get("/category-scores", getCategoryScores)

// Get action plan stats
router.get("/action-plan-stats", getActionPlanStats)

export default router

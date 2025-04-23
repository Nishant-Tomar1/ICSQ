import { Router } from "express"
const router = Router()
import { getDepartmentScores, getCategoryScores, getActionPlanStats } from "../controllers/analytics.controller"
import { requireAuth } from "../middleware/auth"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get department scores
router.get("/department-scores", getDepartmentScores)

// Get category scores
router.get("/category-scores", getCategoryScores)

// Get action plan stats
router.get("/action-plan-stats", getActionPlanStats)

export default router

import { Router } from "express"
const router = Router()
import { getDepartmentScores, getCategoryScores, getActionPlanStats, getPlatformStats, getDepartmentScoresforParticular, getExpectationData } from "../controllers/analytics.controller.js"
import { requireAuth } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

router.get("/stats", getPlatformStats)

// Get department scores
router.get("/department-scores", getDepartmentScores)

//Get scores given to a particular department by other departmnets
router.get("/department-scores/:id", getDepartmentScoresforParticular)

// Get category scores
router.get("/category-scores", getCategoryScores)

// Get action plan stats
router.get("/action-plan-stats", getActionPlanStats)

// Get Expectaions data
router.get("/expectation-data/:id", getExpectationData)

export default router

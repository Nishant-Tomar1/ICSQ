import { Router } from "express"
const router = Router()
import { getDepartmentScores, getCategoryScores, getActionPlanStats, getPlatformStats, getDepartmentScoresforParticular, getExpectationData, getSentimentResponses, getSentimentCounts, getClusteredResponses, getAssignedPatterns } from "../controllers/analytics.controller.js"
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

// Get sentiment responses for a category and sentiment
router.get("/sentiment-responses", getSentimentResponses)

// Get sentiment counts for a category
router.get("/sentiment-counts", getSentimentCounts)

// Get clustered responses for a category and sentiment
router.get("/clustered-responses", getClusteredResponses)

// Get assigned patterns for a department
router.get("/assigned-patterns", getAssignedPatterns)

export default router

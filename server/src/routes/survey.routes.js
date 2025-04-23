import { Router } from "express"
const router = Router()
import { getSurveys, getSurveyById, createSurvey, updateSurvey, deleteSurvey } from "../controllers/survey.controller.js"
import { requireAuth } from "../middleware/auth.js"

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all surveys with optional filters
router.get("/", getSurveys)

// Get survey by ID
router.get("/:id", getSurveyById)

// Create a new survey
router.post("/", createSurvey)

// Update a survey
router.put("/:id", updateSurvey)

// Delete a survey
router.delete("/:id", deleteSurvey)

export default router

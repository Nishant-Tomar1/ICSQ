import mongoose from "mongoose"
import {Survey} from "../models/Survey.model.js"

// Get all surveys with optional filters
export async function getSurveys(req, res) {
  try {
    const { fromDepartmentId, toDepartmentId } = req.query

    const filters = {}
    if (fromDepartmentId) filters.fromDepartment = new mongoose.Types.ObjectId(fromDepartmentId)
    if (toDepartmentId) filters.toDepartment = new mongoose.Types.ObjectId(toDepartmentId)

    const surveys = await Survey.find(filters)
    return res.json(surveys)
  } catch (error) {
    console.error("Error fetching surveys:", error)
    return res.status(500).json({ message: "Failed to fetch surveys" })
  }
}

// Get survey by ID
export async function getSurveyById(req, res) {
  try {
    const survey = await Survey.findById(req.params.id)

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" })
    }

    return res.json(survey)
  } catch (error) {
    console.error(`Error fetching survey ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to fetch survey" })
  }
}

// Create a new survey
export async function createSurvey(req, res) {
  try {
    const { fromDepartmentId, toDepartmentId, responses, date } = req.body

    if (!fromDepartmentId || !toDepartmentId || !responses) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const survey = new Survey({
      fromDepartment :fromDepartmentId,
      toDepartment :toDepartmentId,
      responses,
      date: date ? new Date(date) : new Date(),
    })

    await survey.save()

    return res.status(201).json(survey)
  } catch (error) {
    console.error("Error creating survey:", error)
    return res.status(500).json({ message: "Failed to create survey" })
  }
}

// Update a survey
export async function updateSurvey(req, res) {
  try {
    const { fromDepartmentId, toDepartmentId, responses, date } = req.body

    const survey = await Survey.findById(req.params.id)

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" })
    }

    if (fromDepartmentId) survey.fromDepartment = new mongoose.Types.ObjectId(fromDepartmentId)
    if (toDepartmentId) survey.toDepartment = new mongoose.Types.ObjectId(toDepartmentId)
    if (responses) survey.responses = responses
    if (date) survey.date = new Date(date)

    await survey.save()

    return res.json(survey)
  } catch (error) {
    console.error(`Error updating survey ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to update survey" })
  }
}

// Delete a survey
export async function deleteSurvey(req, res) {
  try {
    const survey = await Survey.findById(req.params.id)

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" })
    }

    await survey.deleteOne()

    return res.json({ message: "Survey deleted successfully" })
  } catch (error) {
    console.error(`Error deleting survey ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to delete survey" })
  }
}

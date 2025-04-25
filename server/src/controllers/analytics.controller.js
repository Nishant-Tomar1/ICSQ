import {Survey} from "../models/Survey.model.js"
import {ActionPlan} from "../models/ActionPlan.model.js"

// Get department scores
export async function getDepartmentScores(req, res) {
  try {
    const surveys = await Survey.find()

    // Group surveys by department and calculate average scores
    const departmentScores = {}

    surveys.forEach((survey) => {
      if (!departmentScores[survey.toDepartment]) {
        departmentScores[survey.toDepartment] = {
          totalScore: 0,
          count: 0,
        }
      }

      let departmentTotal = 0
      let categoryCount = 0

      // Calculate average score for this survey
      for (const [,data] of survey.responses.toObject()) {
        
        if (data.rating) {
          departmentTotal += data.rating
          categoryCount++
        }
      }

      if (categoryCount > 0) {
        const surveyAverage = departmentTotal / categoryCount
        departmentScores[survey.toDepartment].totalScore += surveyAverage
        departmentScores[survey.toDepartment].count++
      }
    })

    // Calculate final averages
    const result = Object.entries(departmentScores).map(([department, data]) => ({
      department,
      score: Math.round(data.count > 0 ? data.totalScore / data.count : 0),
    }))

    return res.json(result)
  } catch (error) {
    console.error("Error calculating department scores:", error)
    return res.status(500).json({ message: "Failed to calculate department scores" })
  }
}

// Get category scores
export async function getCategoryScores(req, res) {
  try {
    const surveys = await Survey.find()

    // Group surveys by category and calculate average scores
    const categoryScores = {}

    surveys.forEach((survey) => {
      for (const [category, data] of survey.responses.toObject()) {
        if (!categoryScores[category]) {
          categoryScores[category] = {
            totalScore: 0,
            count: 0,
          }
        }

        if (data.rating) {
          categoryScores[category].totalScore += data.rating
          categoryScores[category].count++
        }
      }
    })

    // Calculate final averages
    const result = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      score: Math.round(data.count > 0 ? data.totalScore / data.count : 0),
    }))

    return res.json(result)
  } catch (error) {
    console.error("Error calculating category scores:", error)
    return res.status(500).json({ message: "Failed to calculate category scores" })
  }
}

// Get action plan stats
export async function getActionPlanStats(req, res) {
  try {
    const actionPlans = await ActionPlan.find()

    // Group action plans by status
    const statusCounts = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
    }

    actionPlans.forEach((plan) => {
      if (statusCounts[plan.status] !== undefined) {
        statusCounts[plan.status]++
      }
    })

    // Format result
    const result = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }))

    return res.json(result)
  } catch (error) {
    console.error("Error calculating action plan stats:", error)
    return res.status(500).json({ message: "Failed to calculate action plan stats" })
  }
}

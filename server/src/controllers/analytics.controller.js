import {Survey} from "../models/Survey.model.js"
import {User} from "../models/User.model.js"
import {ActionPlan} from "../models/ActionPlan.model.js"
import {Department} from "../models/Department.model.js"
import mongoose from "mongoose"

export async function getPlatformStats(req, res) {
  try {
    const userCount = await User.estimatedDocumentCount() 

    const deptCount = await Department.estimatedDocumentCount()

    const surveyCount = await Survey.estimatedDocumentCount()

    const actionPlanCount = await ActionPlan.estimatedDocumentCount()

    return res.status(200).json({ "users":userCount, "departments" : deptCount, "actionPlans" : actionPlanCount, "surveys": surveyCount})
  } catch (error) {
    console.log("Error calculating stats : ", error);
    return res.status(500).json({message : "Failed to get statistics"})
  }
}

// Get department scores
export async function getDepartmentScores(req, res) {
  try {
    const surveys = await Survey.find()
    const departments = await Department.find()
    
    // Create a map of department ID to department name
    const departmentNames = {}
    departments.forEach((dept) => {
      departmentNames[dept._id.toString()] = dept.name
    })

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

      for (const [, data] of survey.responses.toObject()) {
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

    // Final result with department name
    const result = Object.entries(departmentScores).map(([_id, data]) => ({
      _id,
      name: departmentNames[_id] || "Unknown Department",
      score: (data.count > 0 ? data.totalScore / data.count : 0),
    }))

    return res.json(result)
  } catch (error) {
    console.error("Error calculating department scores:", error)
    return res.status(500).json({ message: "Failed to calculate department scores" })
  }
}

// Get department scores for a particular department by other departments
export async function getDepartmentScoresforParticular(req, res) {
  try {
    const {id : departmentId} = req.params
    
    const surveys = await Survey.aggregate([
      {
        $match: {
          toDepartment: new mongoose.Types.ObjectId(departmentId)
        }
      },
      {
        $project: {
          fromDepartment: 1,
          ratings: {
            $map: {
              input: { $objectToArray: "$responses" },
              as: "resp",
              in: "$$resp.v.rating"
            }
          }
        }
      },
      {
        $unwind: "$ratings"
      },
      {
        $group: {
          _id: "$fromDepartment",
          averageScore: { $avg: "$ratings" },
          totalSurveys: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          averageScore: 1,
          surveyCount: { $size: "$totalSurveys" }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $unwind: "$department"
      },
      {
        $project: {
          _id: 0,
          fromDepartmentId: "$_id",
          fromDepartmentName: "$department.name",
          averageScore: 1,
          surveyCount: 1
        }
      }
    ]);

    return res.status(200).json(surveys)
    
  } catch (error) {
    console.error("Error calculating scores for given department:", error)
    return res.status(500).json({ message: "Failed to calculate department scores for given department" })
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

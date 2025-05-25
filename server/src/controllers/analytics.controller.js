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
    const surveys = await Survey.find().lean();  // << plain objects
    const departments = await Department.find();

    const departmentNames = {};
    departments.forEach((dept) => {
      departmentNames[dept._id.toString()] = dept.name;
    });

    const departmentScores = {};

    surveys.forEach((survey) => {
      const deptId = survey.toDepartment?.toString();
      const responses = survey.responses || {};

      if (!deptId || typeof responses !== 'object') return;

      if (!departmentScores[deptId]) {
        departmentScores[deptId] = {
          totalScore: 0,
          count: 0,
          detailedScores: {},
        };
      }

      let surveyTotal = 0;
      let categoryCount = 0;

      for (const [category, value] of Object.entries(responses)) {
        const rating = parseInt(value.rating);
        if (!rating || isNaN(rating)) continue;

        surveyTotal += rating;
        categoryCount++;

        if (!departmentScores[deptId].detailedScores[category]) {
          departmentScores[deptId].detailedScores[category] = {
            total: 0,
            count: 0,
          };
        }

        departmentScores[deptId].detailedScores[category].total += rating;
        departmentScores[deptId].detailedScores[category].count += 1;
      }

      if (categoryCount > 0) {
        departmentScores[deptId].totalScore += surveyTotal / categoryCount;
        departmentScores[deptId].count += 1;
      }
    });

    const result = Object.entries(departmentScores).map(([deptId, data]) => {
      const detailed = {};
      for (const [cat, info] of Object.entries(data.detailedScores)) {
        detailed[cat] = info.count > 0 ? info.total / info.count : 0;
      }

      return {
        _id: deptId,
        name: departmentNames[deptId] || "Unknown Department",
        score: data.count > 0 ? data.totalScore / data.count : 0,
        detailedScores: detailed,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error("Error calculating department scores:", error);
    return res.status(500).json({ message: "Failed to calculate department scores" });
  }
}

// Get department scores for a particular department by other departments
export async function getDepartmentScoresforParticular(req, res) {
  try {
    const { id: departmentId } = req.params;

    const surveys = await Survey.aggregate([
      {
        $match: {
          toDepartment: new mongoose.Types.ObjectId(departmentId),
        },
      },
      {
        $project: {
          fromDepartment: 1,
          responseArray: { $objectToArray: "$responses" },
        },
      },
      { $unwind: "$responseArray" },
      {
        $project: {
          fromDepartment: 1,
          category: "$responseArray.k",
          rating: "$responseArray.v.rating",
        },
      },
      {
        $group: {
          _id: {
            fromDepartment: "$fromDepartment",
            category: "$category",
          },
          avgRating: { $avg: "$rating" },
          surveyIds: { $addToSet: "$_id" },
        },
      },
      {
        $group: {
          _id: "$_id.fromDepartment",
          detailedScores: {
            $push: {
              category: "$_id.category",
              average: "$avgRating",
            },
          },
          surveyCount: { $sum: { $size: "$surveyIds" } },
          overallScore: { $avg: "$avgRating" },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 0,
          fromDepartmentId: "$_id",
          fromDepartmentName: "$department.name",
          averageScore: "$overallScore",
          surveyCount: 1,
          detailedScores: {
            $arrayToObject: {
              $map: {
                input: "$detailedScores",
                as: "item",
                in: {
                  k: "$$item.category",
                  v: "$$item.average",
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json(surveys);
  } catch (error) {
    console.error("Error calculating scores for given department:", error);
    return res
      .status(500)
      .json({ message: "Failed to calculate department scores for given department" });
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

// Get Expectaion data grouped by category->department->user
export async function getExpectationData(req, res) {
  const toDepartment  = req.params
  try {
    const data = await Survey.aggregate([
                  {
                    $match: {
                      toDepartment: new mongoose.Types.ObjectId(toDepartment)
                    }
                  },
                  {
                    $project: {
                      userId: 1,
                      fromDepartment: 1,
                      responses: { $objectToArray: "$responses" }
                    }
                  },

                  { $unwind: "$responses" },

                  {
                    $project: {
                      userId: 1,
                      fromDepartment: 1,
                      category: "$responses.k",
                      expectations: "$responses.v.expectations"
                    }
                  },

                  { $unwind: "$expectations" },

                  {
                    $group: {
                      _id: {
                        category: "$category",
                        fromDepartment: "$fromDepartment",
                        userId: "$userId"
                      },
                      expectations: { $push: "$expectations" }
                    }
                  },

                  {
                    $lookup: {
                      from: "users",
                      localField: "_id.userId",
                      foreignField: "_id",
                      as: "user"
                    }
                  },

                  {
                    $lookup: {
                      from: "departments",
                      localField: "_id.fromDepartment",
                      foreignField: "_id",
                      as: "dept"
                    }
                  },

                  {
                    $addFields: {
                      user: { $arrayElemAt: ["$user", 0] },
                      dept: { $arrayElemAt: ["$dept", 0] }
                    }
                  },

                  {
                    $group: {
                      _id: {
                        category: "$_id.category",
                        fromDepartment: "$dept.name"
                      },
                      users: {
                        $push: {
                          name: "$user.name",
                          expectations: "$expectations"
                        }
                      }
                    }
                  },

                  {
                    $group: {
                      _id: "$_id.category",
                      departments: {
                        $push: {
                          name: "$_id.fromDepartment",
                          users: "$users"
                        }
                      }
                    }
                  },

                  {
                    $project: {
                      _id: 0,
                      category: "$_id",
                      departments: 1
                    }
                  }
                ])

    return res.status(200).json(data)

  } catch (error) {
    console.error("Error fetching expectations data :", error)
    return res.status(500).json({ message: "Failed to fetch Expectations data" })
  }
}
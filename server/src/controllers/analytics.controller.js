import {Survey} from "../models/Survey.model.js"
import {User} from "../models/User.model.js"
import {ActionPlan} from "../models/ActionPlan.model.js"
import {Department} from "../models/Department.model.js"
import mongoose from "mongoose"
import natural from "natural";

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

  // Filter out empty expectations
  {
    $match: {
      expectations: { $ne: "" }
    }
  },

  {
    $group: {
      _id: {
        category: "$category",
        fromDepartment: "$fromDepartment",
        userId: "$userId"
      },
      expectations: { $push: "$expectations" },
      expectationCount: { $sum: 1 }  // Count non-empty expectations
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
          expectations: "$expectations",
          expectationCount: "$expectationCount"
        }
      },
      departmentExpectationCount: { $sum: "$expectationCount" }
    }
  },
  {
    $group: {
      _id: "$_id.category",
      departments: {
        $push: {
          name: "$_id.fromDepartment",
          users: "$users",
          expectationCount: "$departmentExpectationCount"
        }
      },
      categoryExpectationCount: { $sum: "$departmentExpectationCount" }
    }
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      departments: 1,
      totalExpectationCount: "$categoryExpectationCount"
    }
  }
]);


    return res.status(200).json(data)

  } catch (error) {
    console.error("Error fetching expectations data :", error)
    return res.status(500).json({ message: "Failed to fetch Expectations data" })
  }
}

// Get all responses for a given category and sentiment
export async function getSentimentResponses(req, res) {
  try {
    const { category, sentiment } = req.query;
    if (!category || !sentiment) {
      return res.status(400).json({ message: "Category and sentiment are required" });
    }

    // Map sentiment to ratings
    let ratings = [];
    if (sentiment === "promoter") ratings = [80, 100];
    else if (sentiment === "passive") ratings = [40, 60];
    else if (sentiment === "detractor") ratings = [0, 20];
    else return res.status(400).json({ message: "Invalid sentiment" });

    // Find all surveys where responses[category].rating is in ratings
    const surveys = await Survey.aggregate([
      {
        $project: {
          userId: 1,
          fromDepartment: 1,
          toDepartment: 1,
          date: 1,
          response: { $ifNull: [ { $objectToArray: "$responses" }, [] ] }
        }
      },
      { $unwind: "$response" },
      { $match: { 
          "response.k": { $regex: new RegExp(`^${category}$`, 'i') }, // case-insensitive match
          "response.v.rating": { $in: ratings } 
        } 
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "fromDepartment",
          foreignField: "_id",
          as: "fromDepartmentInfo"
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "toDepartment",
          foreignField: "_id",
          as: "toDepartmentInfo"
        }
      },
      {
        $addFields: {
          userName: { $arrayElemAt: ["$user.name", 0] },
          fromDepartmentName: { $arrayElemAt: ["$fromDepartmentInfo.name", 0] },
          toDepartmentName: { $arrayElemAt: ["$toDepartmentInfo.name", 0] },
          rating: "$response.v.rating",
          expectations: "$response.v.expectations"
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: 1,
          fromDepartmentName: 1,
          toDepartmentName: 1,
          rating: 1,
          expectations: 1,
          date: 1
        }
      },
      { $sort: { date: -1 } }
    ]);

    return res.json(surveys);
  } catch (error) {
    console.error("Error fetching sentiment responses:", error);
    return res.status(500).json({ message: "Failed to fetch sentiment responses" });
  }
}

// Get sentiment counts for a given category
export async function getSentimentCounts(req, res) {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Define sentiment rating groups
    const sentimentGroups = {
      promoter: [80, 100],
      passive: [40, 60],
      detractor: [0, 20],
    };

    // Aggregate counts for each sentiment
    const counts = await Survey.aggregate([
      {
        $project: {
          response: { $ifNull: [ { $objectToArray: "$responses" }, [] ] }
        }
      },
      { $unwind: "$response" },
      { $match: { "response.k": { $regex: new RegExp(`^${category}$`, 'i') } } },
      {
        $group: {
          _id: "$response.v.rating",
          count: { $sum: 1 }
        }
      }
    ]);

    // Map counts to sentiment
    const result = { promoter: 0, passive: 0, detractor: 0 };
    counts.forEach(({ _id, count }) => {
      if (sentimentGroups.promoter.includes(_id)) result.promoter += count;
      else if (sentimentGroups.passive.includes(_id)) result.passive += count;
      else if (sentimentGroups.detractor.includes(_id)) result.detractor += count;
    });

    return res.json(result);
  } catch (error) {
    console.error("Error fetching sentiment counts:", error);
    return res.status(500).json({ message: "Failed to fetch sentiment counts" });
  }
}

// Cluster similar responses for a given category and sentiment
export async function getClusteredResponses(req, res) {
  try {
    const { category, sentiment } = req.query;
    if (!sentiment) {
      return res.status(400).json({ message: "Sentiment is required" });
    }

    // Map sentiment to ratings
    let ratings = [];
    if (sentiment === "promoter") ratings = [80, 100];
    else if (sentiment === "passive") ratings = [40, 60];
    else if (sentiment === "detractor") ratings = [0, 20];
    else return res.status(400).json({ message: "Invalid sentiment" });

    // Build match condition - REMOVED category filter to allow cross-category clustering
    let matchCondition = {
      "response.v.rating": { $in: ratings },
      "response.v.expectations": { $exists: true, $ne: "" }
    };

    // Fetch all responses for the sentiment across ALL categories
    const surveys = await Survey.aggregate([
      {
        $project: {
          userId: 1,
          fromDepartment: 1,
          toDepartment: 1,
          date: 1,
          response: { $ifNull: [ { $objectToArray: "$responses" }, [] ] }
        }
      },
      { $unwind: "$response" },
      { $match: matchCondition },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $addFields: {
          userName: { $arrayElemAt: ["$user.name", 0] },
          expectation: "$response.v.expectations",
          category: "$response.k"
        }
      },
      {
        $project: {
          _id: 1,
          userName: 1,
          expectation: 1,
          category: 1
        }
      }
    ]);

    console.log(`Found ${surveys.length} surveys for clustering across all categories`);

    // If no real data, return mock clustered data to demonstrate cross-category clustering
    if (surveys.length === 0) {
      console.log('No survey data found, returning mock cross-category clustered data');
      
      const mockClusters = [
        {
          id: `cluster-1-${sentiment}`,
          representative: "This is the test 1.This is the first point",
          category: "collaboration & support", // Primary category
          sentiment: sentiment,
          responses: [
            { text: "This is the test 1.This is the first point", user: "User2", category: "collaboration & support" },
            { text: "This is the test 1.This is the first point", user: "User3", category: "meeting deadlines and commitments" },
            { text: "This is the test 1.This is the first point", user: "User4", category: "quality of work" }
          ]
        },
        {
          id: `cluster-2-${sentiment}`,
          representative: "Bla Bla Bla ble ble bloooooo blooom",
          category: "collaboration & support",
          sentiment: sentiment,
          responses: [
            { text: "Bla Bla Bla ble ble bloooooo blooom", user: "Shivanshu", category: "collaboration & support" },
            { text: "bla ble bla", user: "Shivanshu", category: "quality of work" }
          ]
        },
        {
          id: `cluster-3-${sentiment}`,
          representative: "Need to improve in this area",
          category: "quality of work",
          sentiment: sentiment,
          responses: [
            { text: "Need to improve in this area and increase the Quality", user: "User4", category: "quality of work" },
            { text: "Need to improve in this area of communication", user: "User5", category: "communication & responsiveness" }
          ]
        }
      ];
      
      console.log('Returning mock clusters:', mockClusters);
      return res.json(mockClusters);
    }

    // Improved clustering with cross-category similarity detection
    const clusters = [];
    const used = new Array(surveys.length).fill(false);

    // Helper function to normalize text for comparison
    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Helper function to calculate similarity
    const calculateSimilarity = (text1, text2) => {
      const normalized1 = normalizeText(text1);
      const normalized2 = normalizeText(text2);
      
      // Check for exact match after normalization
      if (normalized1 === normalized2) return 1.0;
      
      // Check if one contains the other (for partial matches)
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.8;
      }
      
      // Use Levenshtein distance for fuzzy matching
      const maxLength = Math.max(normalized1.length, normalized2.length);
      const distance = natural.LevenshteinDistance(normalized1, normalized2);
      const similarity = 1 - (distance / maxLength);
      
      return similarity;
    };

    for (let i = 0; i < surveys.length; i++) {
      if (used[i]) continue;
      
      const cluster = [surveys[i]];
      used[i] = true;
      
      // Ensure expectation is a string
      const expectation1 = Array.isArray(surveys[i].expectation) 
        ? surveys[i].expectation.join(' ') 
        : (surveys[i].expectation || "");
      
      for (let j = i + 1; j < surveys.length; j++) {
        if (used[j]) continue;
        
        // Ensure expectation is a string
        const expectation2 = Array.isArray(surveys[j].expectation) 
          ? surveys[j].expectation.join(' ') 
          : (surveys[j].expectation || "");
        
        // Calculate similarity - NOW ACROSS ALL CATEGORIES
        const similarity = calculateSimilarity(expectation1, expectation2);
        
        // Group if similarity is high enough (cross-category clustering)
        if (similarity >= 0.6) {
          cluster.push(surveys[j]);
          used[j] = true;
        }
      }
      
      // Create cluster with improved representative text
      const representative = Array.isArray(cluster[0].expectation) 
        ? cluster[0].expectation.join(' ') 
        : (cluster[0].expectation || "");
      
      // Determine primary category (most common in cluster)
      const categoryCounts = {};
      cluster.forEach(item => {
        const cat = item.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      const primaryCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b
      );
      
      clusters.push({
        id: `cluster-${clusters.length + 1}-${sentiment}`,
        representative: representative,
        category: primaryCategory, // Primary category for the cluster
        sentiment: sentiment,
        responses: cluster.map(r => ({ 
          text: Array.isArray(r.expectation) 
            ? r.expectation.join(' ') 
            : (r.expectation || ""), 
          user: r.userName,
          category: r.category 
        }))
      });
    }

    console.log(`Created ${clusters.length} cross-category clusters from ${surveys.length} surveys`);
    return res.json(clusters);
  } catch (error) {
    console.error("Error clustering responses:", error);
    return res.status(500).json({ message: "Failed to cluster responses" });
  }
}

// Get assigned patterns for a department
export async function getAssignedPatterns(req, res) {
  try {
    const { departmentId } = req.query;
    
    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }
    
    // For now, return mock assigned patterns
    // In a real implementation, you would query a PatternAssignment model
    const mockAssignedPatterns = [
      {
        patternId: "cluster-1-detractor",
        assignedTo: "John Doe",
        assignedAt: new Date(),
        departmentId: departmentId
      }
      // Removed cluster-2 assignment so "bla bla" text shows up
    ];
    
    return res.json(mockAssignedPatterns);
  } catch (error) {
    console.error("Error getting assigned patterns:", error);
    return res.status(500).json({ message: "Failed to get assigned patterns" });
  }
}
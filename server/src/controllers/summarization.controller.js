import { Survey } from "../models/Survey.model.js";
import mongoose from "mongoose";
import axios from "axios";

// Rule-based: Top 10 most common expectations for a department/category
export async function summarizeExpectationsRuleBased(req, res) {
  try {
    const { departmentId, category } = req.query;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }
    // Fetch all surveys for the department
    const surveys = await Survey.find({ toDepartment: departmentId }).lean();
    let expectations = [];
    if (category) {
      // Only for a specific category
      for (const survey of surveys) {
        const resp = survey.responses?.[category];
        if (resp && resp.expectations && typeof resp.expectations === 'string') {
          expectations.push(resp.expectations.trim());
        }
      }
    } else {
      // For all categories
      for (const survey of surveys) {
        for (const catKey in survey.responses) {
          const resp = survey.responses[catKey];
          if (resp && resp.expectations && typeof resp.expectations === 'string') {
            expectations.push(resp.expectations.trim());
          }
        }
      }
    }
    // Count frequency
    const freq = {};
    for (const exp of expectations) {
      if (!exp) continue;
      freq[exp] = (freq[exp] || 0) + 1;
    }
    // Sort and take top 20
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([text, count]) => ({ text, count }));
    return res.json({ summary: sorted });
  } catch (error) {
    console.error("Rule-based summarization error:", error);
    return res.status(500).json({ message: "Failed to summarize expectations" });
  }
}

// AI-based: Use Gemini API to generate smart action plans and insights
export async function summarizeExpectationsAI(req, res) {
  try {
    const { departmentId, category, priority } = req.query;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }
    
    // Fetch all surveys for the department
    const surveys = await Survey.find({ toDepartment: departmentId }).lean();
    let expectations = [];
    let ratings = [];
    
    if (category) {
      for (const survey of surveys) {
        const resp = survey.responses?.[category];
        if (resp && resp.expectations && typeof resp.expectations === 'string') {
          expectations.push(resp.expectations.trim());
          if (resp.rating) ratings.push(resp.rating);
        }
      }
    } else {
      for (const survey of surveys) {
        for (const catKey in survey.responses) {
          const resp = survey.responses[catKey];
          if (resp && resp.expectations && typeof resp.expectations === 'string') {
            expectations.push(resp.expectations.trim());
            if (resp.rating) ratings.push(resp.rating);
          }
        }
      }
    }
    
    if (expectations.length === 0) {
      return res.json({ summary: "" });
    }

    // Calculate average rating if available
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    
    // Get eligible categories for this department
    const { Category } = await import("../models/Category.model.js");
    const eligibleCategories = await Category.find({
      $or: [
        { department: null }, // Global categories
        { department: departmentId } // Department-specific categories
      ]
    }).lean();
    
    // Enhanced prompt for structured AI response
    const prompt = `Analyze these department expectations and provide structured responses with category assignments and priority analysis.

EXPECTATIONS DATA:
${expectations.join("\n")}

AVERAGE RATING: ${avgRating ? avgRating.toFixed(1) + '/5' : 'Not available'}

ELIGIBLE CATEGORIES (use these exact names and IDs):
${eligibleCategories.map(cat => `${cat.name} (ID: ${cat._id})`).join('\n')}

PRIORITY FOCUS: ${priority || 'all'}

CRITICAL REQUIREMENT: You MUST generate exactly 1 response for each of the ${eligibleCategories.length} eligible categories listed above. Do not skip any category.

INSTRUCTIONS:
- Analyze the survey responses and identify the most important expectations
- ${priority === 'high' ? 'Focus on URGENT issues that need immediate attention (low ratings, critical problems)' : 
    priority === 'medium' ? 'Focus on MODERATE issues that need attention but are not critical' :
    priority === 'low' ? 'Focus on areas of GOOD performance that could be improved further' :
    'Focus on areas that need improvement (low ratings) and common themes'}
- For each of the ${eligibleCategories.length} eligible categories, generate exactly 1 expectation
- Assign each expectation to its corresponding category from the eligible categories list
- Determine priority level (High/Medium/Low) based on rating analysis
- Reference the original data that led to each summary
- If a category has no specific survey data, create a general expectation based on the category's purpose

FORMAT: Return exactly ${eligibleCategories.length} expectations, one for each category:

SUMMARY: [Clear, actionable expectation for Category 1]
CATEGORY: [Category 1 Name] (ID: [Category 1 ID])
PRIORITY: [High/Medium/Low]
ORIGINAL_DATA: [Brief reference to survey data - e.g., "Based on 15 responses with avg rating 2.8/5"]

---

SUMMARY: [Clear, actionable expectation for Category 2]
CATEGORY: [Category 2 Name] (ID: [Category 2 ID])
PRIORITY: [High/Medium/Low]
ORIGINAL_DATA: [Brief reference to survey data]

---

[Continue for all ${eligibleCategories.length} categories...]

IMPORTANT: You must return exactly ${eligibleCategories.length} expectations, one for each eligible category. Do not skip any category.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    const response = await axios.post(geminiUrl, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1200
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey
      }
    });
    
    let summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // If no summary generated, return original expectations
    if (!summary) {
      return res.json({ summary: expectations.join("\n") });
    }
    
    // Parse the structured AI response
    const parsedResponse = parseStructuredAIResponse(summary, eligibleCategories);
    
    return res.json({ 
      summary: parsedResponse,
      eligibleCategories: eligibleCategories.map(cat => ({ id: cat._id, name: cat.name }))
    });
  } catch (error) {
    console.error("AI summarization error:", error?.response?.data || error);
    return res.status(500).json({ message: "Failed to summarize expectations with AI" });
  }
}
// Generate detailed action plans from AI insights
export async function generateActionPlansFromAI(req, res) {
  try {
    const { departmentId, category, selectedInsights } = req.body;
    if (!departmentId || !selectedInsights || selectedInsights.length === 0) {
      return res.status(400).json({ message: "departmentId and selectedInsights are required" });
    }

    const prompt = `Based on these insights, summarize into clear expectations:

${selectedInsights.join("\n")}

${selectedInsights.length > 10 ? `ACTION PLAN 1:
[Expectation]

ACTION PLAN 2:
[Expectation]

ACTION PLAN 3:
[Expectation]

ACTION PLAN 4:
[Expectation]

ACTION PLAN 5:
[Expectation]

ACTION PLAN 6:
[Expectation]

ACTION PLAN 7:
[Expectation]

ACTION PLAN 8:
[Expectation]

ACTION PLAN 9:
[Expectation]

ACTION PLAN 10:
[Expectation]

ACTION PLAN 11:
[Expectation]` : `ACTION PLAN 1:
[Expectation]

ACTION PLAN 2:
[Expectation]

ACTION PLAN 3:
[Expectation]

ACTION PLAN 4:
[Expectation]

ACTION PLAN 5:
[Expectation]`}`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    const response = await axios.post(geminiUrl, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1200
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey
      }
    });
    
    let actionPlans = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (actionPlans) {
      // Extract everything starting from "ACTION PLAN 1"
      const planStartIndex = actionPlans.indexOf("ACTION PLAN 1");
      if (planStartIndex !== -1) {
        actionPlans = actionPlans.substring(planStartIndex);
        
        // Find end index based on length
        let endIndex;
        const plan11Index = actionPlans.indexOf("ACTION PLAN 11");
        const plan6Index = actionPlans.indexOf("ACTION PLAN 5"); 
        
        if (actionPlans.length > 2000) { // Large input - get 10 plans
          endIndex = plan11Index;
        } else { // Small input - get 5 plans
          endIndex = plan6Index;
        }
        
        if (endIndex !== -1) {
          actionPlans = actionPlans.substring(0, endIndex);
        }
      }
    }
    
    
    if (!actionPlans) {
      return res.status(500).json({ message: "Failed to generate action plans" });
    }
    
    return res.json({ actionPlans });
  } catch (error) {
    console.error("Action plan generation error:", error?.response?.data || error);
    return res.status(500).json({ message: "Failed to generate action plans" });
  }
}

// AI-powered trend analysis and predictions
export async function analyzeTrendsAndPredictions(req, res) {
  try {
    const { departmentId } = req.query;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    // Fetch historical data
    const surveys = await Survey.find({ toDepartment: departmentId }).lean();
    
    // Analyze trends over time
    const monthlyData = {};
    surveys.forEach(survey => {
      const month = new Date(survey.createdAt).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { ratings: [], expectations: [] };
      }
      
      Object.values(survey.responses || {}).forEach(resp => {
        if (resp.rating) monthlyData[month].ratings.push(resp.rating);
        if (resp.expectations) monthlyData[month].expectations.push(resp.expectations);
      });
    });

    const prompt = `Analyze this department's performance trends and provide predictions:

MONTHLY DATA:
${Object.entries(monthlyData).map(([month, data]) => 
  `${month}: Avg Rating: ${data.ratings.length > 0 ? (data.ratings.reduce((a,b) => a+b, 0) / data.ratings.length).toFixed(1) : 'N/A'}, Expectations: ${data.expectations.length}`
).join('\n')}

Please provide:

TREND ANALYSIS:
• [Identify key trends in performance and expectations]

PREDICTIONS:
• [Predict future performance based on current trends]

RECOMMENDATIONS:
• [Suggest proactive measures to improve future performance]

RISK FACTORS:
• [Identify potential issues that could affect performance]

Focus on actionable insights and specific recommendations.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    const response = await axios.post(geminiUrl, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 1,
        topP: 1,
        maxOutputTokens: 600
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey
      }
    });
    
    let analysis = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return res.json({ analysis: analysis || "No trend analysis available" });
  } catch (error) {
    console.error("Trend analysis error:", error?.response?.data || error);
    return res.status(500).json({ message: "Failed to analyze trends" });
  }
}

// Helper function to parse structured AI response
function parseStructuredAIResponse(aiResponse, eligibleCategories) {
  try {
    const lines = aiResponse.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const expectations = [];
    let currentExpectation = {};
    
    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        // Save previous expectation if exists
        if (currentExpectation.summary) {
          expectations.push(currentExpectation);
        }
        // Start new expectation
        currentExpectation = {
          summary: line.replace('SUMMARY:', '').trim(),
          category: '',
          categoryId: '',
          priority: '',
          originalData: ''
        };
      } else if (line.startsWith('CATEGORY:')) {
        const categoryText = line.replace('CATEGORY:', '').trim();
        // Extract category name and ID
        const match = categoryText.match(/^(.+?)\s*\(ID:\s*([a-f0-9]{24})\)$/);
        if (match) {
          currentExpectation.category = match[1].trim();
          currentExpectation.categoryId = match[2].trim();
        } else {
          currentExpectation.category = categoryText;
          // Try to find category ID by name
          const foundCategory = eligibleCategories.find(cat => cat.name === categoryText);
          if (foundCategory) {
            currentExpectation.categoryId = foundCategory._id;
          }
        }
      } else if (line.startsWith('PRIORITY:')) {
        currentExpectation.priority = line.replace('PRIORITY:', '').trim();
      } else if (line.startsWith('ORIGINAL_DATA:')) {
        currentExpectation.originalData = line.replace('ORIGINAL_DATA:', '').trim();
      } else if (line === '---') {
        // Separator - save current expectation
        if (currentExpectation.summary) {
          expectations.push(currentExpectation);
          currentExpectation = {};
        }
      }
    }
    
    // Add the last expectation if exists
    if (currentExpectation.summary) {
      expectations.push(currentExpectation);
    }
    
    // Validate that we have exactly one response per category
    const expectedCount = eligibleCategories.length;
    const actualCount = expectations.length;
    
    if (actualCount < expectedCount) {
      console.warn(`AI generated only ${actualCount} responses, expected ${expectedCount}. Adding fallback responses for missing categories.`);
      
      // Find categories that don't have responses
      const categoriesWithResponses = new Set(expectations.map(exp => exp.categoryId));
      const missingCategories = eligibleCategories.filter(cat => !categoriesWithResponses.has(cat._id.toString()));
      
      // Add fallback responses for missing categories
      missingCategories.forEach(cat => {
        expectations.push({
          summary: `General improvement needed in ${cat.name.toLowerCase()} area`,
          category: cat.name,
          categoryId: cat._id,
          priority: 'Medium',
          originalData: 'Generated fallback expectation for category with no specific survey data'
        });
      });
    }
    
    // Ensure we don't have duplicates and have exactly the right number
    const uniqueExpectations = [];
    const seenCategories = new Set();
    
    expectations.forEach(exp => {
      if (exp.categoryId && !seenCategories.has(exp.categoryId)) {
        seenCategories.add(exp.categoryId);
        uniqueExpectations.push(exp);
      }
    });
    
    // If we still don't have enough, add more fallbacks
    while (uniqueExpectations.length < expectedCount) {
      const missingCat = eligibleCategories.find(cat => !seenCategories.has(cat._id.toString()));
      if (missingCat) {
        uniqueExpectations.push({
          summary: `Focus on improving ${missingCat.name.toLowerCase()} processes and outcomes`,
          category: missingCat.name,
          categoryId: missingCat._id,
          priority: 'Medium',
          originalData: 'Generated fallback expectation to ensure category coverage'
        });
        seenCategories.add(missingCat._id.toString());
      } else {
        break;
      }
    }
    
    return uniqueExpectations;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Fallback: return one expectation per category
    return eligibleCategories.map(cat => ({
      summary: `General improvement needed in ${cat.name.toLowerCase()} area`,
      category: cat.name,
      categoryId: cat._id,
      priority: 'Medium',
      originalData: 'Based on survey responses (fallback parsing)'
    }));
  }
}

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
    
    // Create category-specific expectations for better analysis
    const categoryExpectations = {};
    const categoryRatings = {};
    
    // Group expectations by category
    if (category) {
      // Single category mode
      categoryExpectations[category] = expectations;
      categoryRatings[category] = ratings;
    } else {
      // Multi-category mode - group by category
      for (const survey of surveys) {
        for (const catKey in survey.responses) {
          const resp = survey.responses[catKey];
          if (resp && resp.expectations && typeof resp.expectations === 'string') {
            if (!categoryExpectations[catKey]) {
              categoryExpectations[catKey] = [];
              categoryRatings[catKey] = [];
            }
            categoryExpectations[catKey].push(resp.expectations.trim());
            if (resp.rating) categoryRatings[catKey].push(resp.rating);
          }
        }
      }
    }

    // Enhanced prompt for structured AI response with category-specific data
    const prompt = `Analyze these department expectations and provide structured responses with category assignments and priority analysis.

CATEGORY-SPECIFIC EXPECTATIONS DATA:
${Object.entries(categoryExpectations).map(([catKey, catExpectations]) => {
  const catRatings = categoryRatings[catKey] || [];
  const avgCatRating = catRatings.length > 0 ? (catRatings.reduce((a, b) => a + b, 0) / catRatings.length).toFixed(1) : 'N/A';
  // Limit to max 8 responses per category and truncate long responses to reduce token usage
  const limitedResponses = catExpectations.slice(0, 8).map(exp => 
    exp.length > 150 ? exp.substring(0, 150) + '...' : exp
  );
  return `\n=== ${catKey.toUpperCase()} ===\nAvg Rating: ${avgCatRating}/5 (${catRatings.length} total)\nResponses:\n${limitedResponses.map((exp, idx) => `${idx + 1}. "${exp}"`).join('\n')}`;
}).join('\n\n')}

OVERALL AVERAGE RATING: ${avgRating ? avgRating.toFixed(1) + '/5' : 'Not available'}

ELIGIBLE CATEGORIES (use these exact names and IDs):
${eligibleCategories.map(cat => `${cat.name} (ID: ${cat._id})`).join('\n')}

PRIORITY FOCUS: ${priority || 'all'}

CRITICAL REQUIREMENT: You MUST generate exactly 1 response for each of the ${eligibleCategories.length} eligible categories listed above. Do not skip any category.

CRITICAL INSTRUCTIONS FOR SOURCE_RESPONSES:
- SOURCE_RESPONSES must contain ONLY the actual survey quotes listed above under each category
- NEVER use generic text like "Need to improve in this area" 
- COPY the exact survey responses verbatim from the category-specific data provided
- Use JSON array format: ["quote1", "quote2", "quote3"]
- If a category has no survey data, use an empty array: []

INSTRUCTIONS:
- Analyze the survey responses and identify the most important expectations for each category
- ${priority === 'high' ? 'Focus on URGENT issues that need immediate attention (low ratings, critical problems)' : 
    priority === 'medium' ? 'Focus on MODERATE issues that need attention but are not critical' :
    priority === 'low' ? 'Focus on areas of GOOD performance that could be improved further' :
    'Focus on areas that need improvement (low ratings) and common themes'}
- For each of the ${eligibleCategories.length} eligible categories, generate exactly 1 expectation
- Assign each expectation to its corresponding category from the eligible categories list
- Determine priority level (High/Medium/Low) based on rating analysis
- Generate 3-5 specific, actionable recommendations in RECOMMENDED_ACTIONS for each category
- If a category has no specific survey data, create a general expectation based on the category's purpose

FORMAT: Return exactly ${eligibleCategories.length} expectations, one for each category:

SUMMARY: [Clear, actionable expectation for Category 1]
CATEGORY: [Category 1 Name] (ID: [Category 1 ID])
PRIORITY: [High/Medium/Low]
ORIGINAL_DATA: [Brief reference to survey data - e.g., "Based on 15 responses with avg rating 2.8/5"]
SOURCE_RESPONSES: ["exact survey quote 1", "exact survey quote 2", "exact survey quote 3"]
RECOMMENDED_ACTIONS: ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"]

---

SUMMARY: [Clear, actionable expectation for Category 2]
CATEGORY: [Category 2 Name] (ID: [Category 2 ID])
PRIORITY: [High/Medium/Low]
ORIGINAL_DATA: [Brief reference to survey data]
SOURCE_RESPONSES: ["exact survey quote 1", "exact survey quote 2", "exact survey quote 3"]
RECOMMENDED_ACTIONS: ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"]

---

[Continue for all ${eligibleCategories.length} categories...]

IMPORTANT: You must return exactly ${eligibleCategories.length} expectations, one for each eligible category. Do not skip any category.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    let response;
    let summary;
    let maxRetries = 2;
    let currentRetry = 0;
    
    // Try with different token limits if first attempt fails
    const tokenLimits = [2500, 3500, 4000];
    
    while (currentRetry < maxRetries && !summary) {
      try {
        response = await axios.post(geminiUrl, {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 1,
            topP: 1,
            maxOutputTokens: tokenLimits[currentRetry] || 2500
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': geminiApiKey
          }
        });
        
        summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (summary) break;
        
      } catch (error) {
        console.error(`AI attempt ${currentRetry + 1} failed:`, error.message);
      }
      
      currentRetry++;
    }
    
    // If no summary generated after retries, return original expectations
    if (!summary) {
      console.warn('AI failed to generate summary after retries. Using fallback.');
      return res.json({ summary: expectations.join("\n") });
    }
    
    // Parse the structured AI response
    const parsedResponse = parseStructuredAIResponse(summary, eligibleCategories, categoryExpectations);
    
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
function parseStructuredAIResponse(aiResponse, eligibleCategories, categoryExpectations = {}) {
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
          originalData: '',
          sourceResponses: [],
          recommendedActions: []
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
      } else if (line.startsWith('SOURCE_RESPONSES:')) {
        const responseText = line.replace('SOURCE_RESPONSES:', '').trim();
        // Parse the array format ["quote1", "quote2"]
        try {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            currentExpectation.sourceResponses = parsed;
          }
        } catch (e) {
          // Fallback: if not valid JSON, treat as single response
          currentExpectation.sourceResponses = [responseText];
        }
      } else if (line.startsWith('RECOMMENDED_ACTIONS:')) {
        const actionsText = line.replace('RECOMMENDED_ACTIONS:', '').trim();
        // Parse the array format ["action1", "action2", "action3"]
        try {
          const parsed = JSON.parse(actionsText);
          if (Array.isArray(parsed)) {
            currentExpectation.recommendedActions = parsed;
          }
        } catch (e) {
          // Fallback: if not valid JSON, treat as single action
          currentExpectation.recommendedActions = [actionsText];
        }
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
      // Only log once per minute to reduce log spam
      const now = Date.now();
      const lastLogTime = global.lastAIWarningTime || 0;
      if (now - lastLogTime > 60000) { // 60 seconds
        console.warn(`AI incomplete response: ${actualCount}/${expectedCount} categories. Adding fallback for missing categories.`);
        global.lastAIWarningTime = now;
      }
      
      // Find categories that don't have responses
      const categoriesWithResponses = new Set(expectations.map(exp => exp.categoryId));
      const missingCategories = eligibleCategories.filter(cat => !categoriesWithResponses.has(cat._id.toString()));
      
      // Add fallback responses for missing categories using actual survey data
      missingCategories.forEach(cat => {
        // Try to find survey responses for this category
        const categoryResponses = categoryExpectations[cat.name.toLowerCase()] || 
                                 categoryExpectations[cat.name] || [];
        
        expectations.push({
          summary: `General improvement needed in ${cat.name.toLowerCase()} area`,
          category: cat.name,
          categoryId: cat._id,
          priority: 'Medium',
          originalData: categoryResponses.length > 0 ? 
            `Based on ${categoryResponses.length} survey responses` : 
            'Generated fallback expectation for category with no specific survey data',
          sourceResponses: categoryResponses.length > 0 ? categoryResponses : [],
          recommendedActions: [`Conduct regular team meetings to address ${cat.name.toLowerCase()} concerns`, `Implement feedback mechanisms for continuous improvement`, `Provide training and development opportunities`, `Create clear communication channels`]
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
        // Try to find survey responses for this category
        const categoryResponses = categoryExpectations[missingCat.name.toLowerCase()] || 
                                 categoryExpectations[missingCat.name] || [];
        
        uniqueExpectations.push({
          summary: `Focus on improving ${missingCat.name.toLowerCase()} processes and outcomes`,
          category: missingCat.name,
          categoryId: missingCat._id,
          priority: 'Medium',
          originalData: categoryResponses.length > 0 ? 
            `Based on ${categoryResponses.length} survey responses` : 
            'Generated fallback expectation to ensure category coverage',
          sourceResponses: categoryResponses.length > 0 ? categoryResponses : [],
          recommendedActions: [`Conduct regular team meetings to address ${missingCat.name.toLowerCase()} concerns`, `Implement feedback mechanisms for continuous improvement`, `Provide training and development opportunities`, `Create clear communication channels`]
        });
        seenCategories.add(missingCat._id.toString());
      } else {
        break;
      }
    }
    
    return uniqueExpectations;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Fallback: return one expectation per category using actual survey data
    return eligibleCategories.map(cat => {
      const categoryResponses = categoryExpectations[cat.name.toLowerCase()] || 
                               categoryExpectations[cat.name] || [];
      
      return {
        summary: `General improvement needed in ${cat.name.toLowerCase()} area`,
        category: cat.name,
        categoryId: cat._id,
        priority: 'Medium',
        originalData: categoryResponses.length > 0 ? 
          `Based on ${categoryResponses.length} survey responses (fallback parsing)` : 
          'Based on survey responses (fallback parsing)',
        sourceResponses: categoryResponses.length > 0 ? categoryResponses : [],
        recommendedActions: [`Conduct regular team meetings to address ${cat.name.toLowerCase()} concerns`, `Implement feedback mechanisms for continuous improvement`, `Provide training and development opportunities`, `Create clear communication channels`]
      };
    });
  }
}

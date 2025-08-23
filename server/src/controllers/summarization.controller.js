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
    const { departmentId, category } = req.query;
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
    
    // Enhanced prompt for grouped analysis by emotions and types
    const prompt = `Analyze these department expectations and group them by emotions and types of responses. 

EXPECTATIONS DATA:
${expectations.join("\n")}

AVERAGE RATING: ${avgRating ? avgRating.toFixed(1) + '/5' : 'Not available'}

Please analyze and group the responses into the following categories based on common themes, emotions, and types of issues mentioned:

1. TIME-RELATED ISSUES (e.g., delays, response time, waiting, slow service)
2. SUPPORT & COMMUNICATION ISSUES (e.g., lack of support, poor communication, unhelpful staff)
3. QUALITY & STANDARDS ISSUES (e.g., poor quality, low standards, subpar work)
4. RESOURCE & PROCESS ISSUES (e.g., insufficient resources, broken processes, lack of tools)
5. POSITIVE FEEDBACK (e.g., appreciation, good service, helpful staff)
6. OTHER ISSUES (e.g., miscellaneous concerns not fitting above categories)

For each group, provide:
- A clear heading (e.g., "TIME-RELATED ISSUES")
- A brief summary of the common theme
- The specific responses that belong to that group

Format your response exactly like this:

=== TIME-RELATED ISSUES ===
Summary: [Brief description of the time-related issues found]
Responses:
• [Specific response 1]
• [Specific response 2]
• [Specific response 3]

=== SUPPORT & COMMUNICATION ISSUES ===
Summary: [Brief description of support/communication issues found]
Responses:
• [Specific response 1]
• [Specific response 2]

[Continue for other groups...]

Keep each point concise and focus on practical, implementable solutions. Group similar responses together to make it easier for managers to review and take action.`;

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
    
    // Clean up and format the response - keep the grouped structure
    summary = summary.split('\n')
      .filter(line => line.trim().length > 0) // Keep all non-empty lines to preserve grouping
      .join('\n');
    
    return res.json({ summary: summary || expectations.join("\n") });
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

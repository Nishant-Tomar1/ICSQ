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
        if (resp && resp.expectations) {
          expectations.push(resp.expectations.trim());
        }
      }
    } else {
      // For all categories
      for (const survey of surveys) {
        for (const catKey in survey.responses) {
          const resp = survey.responses[catKey];
          if (resp && resp.expectations) {
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

// AI-based: Use Gemini API to summarize expectations
export async function summarizeExpectationsAI(req, res) {
  try {
    const { departmentId, category } = req.query;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }
    // Fetch all surveys for the department
    const surveys = await Survey.find({ toDepartment: departmentId }).lean();
    let expectations = [];
    if (category) {
      for (const survey of surveys) {
        const resp = survey.responses?.[category];
        if (resp && resp.expectations) {
          expectations.push(resp.expectations.trim());
        }
      }
    } else {
      for (const survey of surveys) {
        for (const catKey in survey.responses) {
          const resp = survey.responses[catKey];
          if (resp && resp.expectations) {
            expectations.push(resp.expectations.trim());
          }
        }
      }
    }
    if (expectations.length === 0) {
      return res.json({ summary: "" });
    }
    // Call Gemini API
    const prompt = `Provide maximum 20 bullet points summarizing these expectations. Each point should be under 15 words, no other text:\n\n${expectations.join("\n")}. If you found the expectations are not enough to generate a summary, return the original expectations with the first line saying \"AI summary:\".`;
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
        maxOutputTokens: 400
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
    // Clean up any extra text, keeping only bullet points
    summary = summary.split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .join('\n');
    return res.json({ summary: summary || expectations.join("\n") });
  } catch (error) {
    console.error("AI summarization error:", error?.response?.data || error);
    return res.status(500).json({ message: "Failed to summarize expectations with AI" });
  }
}
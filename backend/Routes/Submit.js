const express = require("express");
const axios = require("axios");
const isAuth = require("../middlewares/verification");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");

const router = express.Router();

const COMPILER_URL = process.env.COMPILER_URL || "http://localhost:8000/run";
const AI_REVIEW_URL = process.env.AI_REVIEW_URL || "http://localhost:8000/ai-review";

// Helper function to normalize output for better comparison
const normalize = str => str.replace(/\s+/g, ' ').replace(/[\[\],]/g, '').trim();

router.post("/", isAuth, async (req, res) => {
  try {
    const { problemId, language, code } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    let verdict = "Accepted";
    const testResults = [];
    let failedTest = null;

    for (const testCase of problem.testCases) {
      const { input, expectedOutput } = testCase;

      try {
        const response = await axios.post(COMPILER_URL, {
          code,
          language,
          input,
        }, {
          timeout: 2000 // ✅ 2 seconds timeout
        });

        const output = response.data.output;
        const normalizedOutput = normalize(output);
        const normalizedExpected = normalize(expectedOutput);

        const passed = normalizedOutput === normalizedExpected;

        testResults.push({
          input,
          expectedOutput,
          output,
          passed,
        });

        if (!passed && verdict === "Accepted") {
          verdict = "Wrong Answer";
          failedTest = {
            input,
            expectedOutput,
            output,
          };
        }

      } catch (err) {
        console.error("🔥 Compiler Error:", err?.response?.data || err?.message || err.toString());
        verdict = "Error";
        return res.status(500).json({
          message: "Error running code",
          error: err?.response?.data || err?.message || err.toString(),
        });
      }
    }

    let aiFeedback = "";
    if (verdict === "Accepted") {
      try {
        const aiResponse = await axios.post(AI_REVIEW_URL, {
          code,
          language,
          problemDescription: problem.description,
        });
        aiFeedback = aiResponse.data.feedback || "";
      } catch (err) {
        console.error("🔥 AI Review Error:", err?.response?.data || err?.message || err.toString());
        aiFeedback = "AI review unavailable due to error.";
      }
    }

    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language,
      verdict,
      difficulty: problem.difficulty,
      testResults,     // ✅ Saved for history/debugging (optional)
      failedTest,      // ✅ Shows failing case on frontend
    });

    return res.status(200).json({
      verdict,
      aiFeedback,
      submission,
      failedTest,
      testResults,
    });

  } catch (err) {
    console.error("🔥 Internal Server Error:", err?.message || err.toString());
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;


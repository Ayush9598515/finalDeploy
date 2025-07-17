const express = require("express");
const axios = require("axios");
const router = express.Router();

const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { authenticateUser } = require("../middleware/verification"); // ✅ Auth middleware

router.post("/submit", authenticateUser, async (req, res) => {
  const { problemId, code, language } = req.body;

  if (!problemId || !code || !language) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // ✅ Get problem from DB
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found." });
    }

    const testCases = problem.testCases || [];
    const compilerURL = process.env.VITE_COMPILER_URL || "http://localhost:8000/run";
    const aiReviewURL = process.env.VITE_AI_REVIEW_URL || "http://localhost:2000/api/ai-review";

    let allPassed = true;
    let failedCase = null;

    // ✅ Run all test cases
    for (let i = 0; i < testCases.length; i++) {
      const { input, expectedOutput } = testCases[i];

      const { data } = await axios.post(compilerURL, {
        code,
        language,
        input,
        timeout: 2000,
      });

      const actualOutput = (data.output || "").trim();
      const expected = (expectedOutput || "").trim();

      if (actualOutput !== expected) {
        allPassed = false;
        failedCase = {
          input,
          expectedOutput: expected,
          actualOutput,
          error: data.error || null,
        };
        break;
      }
    }

    // ✅ Save submission
    const verdict = allPassed ? "Accepted" : "Wrong Answer";
    const submission = await Submission.create({
      user: req.user._id,
      problem: problemId,
      code,
      language,
      verdict,
      difficulty: problem.difficulty,
    });

    // ✅ AI Review request
    let aiFeedback = null;
    try {
      const aiRes = await axios.post(aiReviewURL, {
        code,
        language,
        problemTitle: problem.title,
        verdict,
      });
      aiFeedback = aiRes.data?.feedback || null;
    } catch (aiErr) {
      console.warn("⚠️ AI Review failed:", aiErr.message);
    }

    return res.json({
      verdict,
      failedCase: allPassed ? null : failedCase,
      aiFeedback,
    });

  } catch (err) {
    console.error("❌ Submission Error:", err.message);
    return res.status(500).json({ verdict: "Internal Error", error: err.message });
  }
});

module.exports = router;

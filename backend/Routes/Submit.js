const express = require("express");
const router = express.Router();
const axios = require("axios");
const { aiCodeReview } = require("./aiCodeReview"); // ✅ Local Gemini logic
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { authenticateUser } = require("../middleware/verification");

router.post("/", authenticateUser, async (req, res) => {
  const { problemId, code, language } = req.body;

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found." });
    }

    const testCases = problem.testCases;
    const timeout = 2000; // ✅ 2 second timeout

    const response = await axios.post(
      process.env.VITE_COMPILER_URL || "http://localhost:8000/run",
      {
        code,
        language,
        testCases,
        timeout,
      }
    );

    const { verdict, error, output, expectedOutput } = response.data;

    // ✅ Save submission in DB
    await Submission.create({
      user: req.user._id,
      problem: problemId,
      code,
      language,
      verdict,
      difficulty: problem.difficulty,
    });

    // ✅ Only run AI review if Accepted
    if (verdict === "Accepted") {
      const review = await aiCodeReview(code);
      return res.json({ verdict, review });
    }

    // ❌ If wrong or failed, return detailed info
    return res.json({
      verdict,
      error,
      output,
      expectedOutput,
    });
  } catch (err) {
    console.error("❌ Submission error:", err.message);
    return res.status(500).json({ verdict: "Internal Error", error: err.message });
  }
});

module.exports = router;



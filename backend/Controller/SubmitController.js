const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { aiCodeReview } = require("../utils/aiReview");
const axios = require("axios");

exports.handleSubmission = async (req, res) => {
  try {
    const userId = req.user.id; // 👤 Extract user ID from JWT
    const { problemId, language, code } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const testCases = problem.testCases;
    let allPassed = true;
    let failedCase = null;

    // 🔁 Run on all test cases
    for (let i = 0; i < testCases.length; i++) {
      const { input, expectedOutput } = testCases[i];

      const response = await axios.post(`${process.env.COMPILER_URL}`, {
        code,
        language,
        input,
      }, { timeout: 2000 }); // 🕒 2 second timeout

      const actualOutput = response.data.output.trim();
      if (actualOutput !== expectedOutput.trim()) {
        allPassed = false;
        failedCase = { input, expectedOutput, actualOutput };
        break;
      }
    }

    const verdict = allPassed ? "Accepted" : "Wrong Answer";

    // 🤖 AI review only if JS/Python/C++/Java
    const aiReview = await aiCodeReview(code);

    // 💾 Save submission
    const submission = await Submission.create({
      user: userId,
      problem: problemId,
      language,
      code,
      verdict,
      aiReview,
    });

    // 📤 Send response
    res.json({
      success: true,
      verdict,
      failedCase: failedCase || null,
      aiReview,
    });

  } catch (err) {
    console.error("❌ Submission Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

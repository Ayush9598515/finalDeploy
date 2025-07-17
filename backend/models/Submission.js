const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  verdict: {
    type: String,
    enum: ["Accepted", "Wrong Answer", "Compilation Error", "Runtime Error", "Internal Error"],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },

  // 🆕 For showing wrong test case details
  failedTestCase: {
    input: { type: String },
    expectedOutput: { type: String },
    userOutput: { type: String },
  },

  // 🆕 For Compilation/Runtime error message
  errorMessage: {
    type: String,
  },

}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);


const express = require("express");
const router = express.Router();

// Import dashboard controllers
const { getDashboardData, getHeatmapData } = require("../Controller/dashboardController.js");

// ✅ Corrected middleware import
const { authenticateUser } = require("../middleware/verification.js");

// Dashboard API: /api/dashboard
router.get("/dashboard", authenticateUser, getDashboardData);

// Heatmap API: /api/submissions/heatmap
router.get("/submissions/heatmap", authenticateUser, getHeatmapData);

module.exports = router;

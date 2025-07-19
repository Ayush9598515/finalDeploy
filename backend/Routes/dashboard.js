const express = require("express");
const router = express.Router();

// Import dashboard controllers
const { getDashboardData, getHeatmapData } = require("../Controller/dashboardController.js");

// ✅ Corrected middleware import
const  verifyUser  = require("../middleware/verification.js");

// Dashboard API: /api/dashboard
router.get("/dashboard", verifyUser, getDashboardData);

// Heatmap API: /api/submissions/heatmap
router.get("/submissions/heatmap", verifyUser, getHeatmapData);

module.exports = router;

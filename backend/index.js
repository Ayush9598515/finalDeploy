require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { DBConnection } = require("./database/db");
const { aiCodeReview } = require('./Routes/aiCodeReview');

const app = express();

// ✅ Updated CORS: include localhost + custom domain + Vercel frontend
app.use(cors({
  origin: [
    "http://localhost:5173", // Dev
    "https://www.namescheap.xyz", // Custom domain
    "https://ay-code-3mxbre6fe-ayush-pandeys-projects-cf754a30.vercel.app" // Vercel frontend
  ],
  credentials: true // Required for cookies
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔌 MongoDB connection
DBConnection();

// ✅ All main routes under /api
const apiRoutes = require("./Routes/index");
app.use("/api", apiRoutes);

// ✅ Optional AI Review route
app.post("/api/ai-review", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "Code is required!" });
  }
  try {
    const review = await aiCodeReview(code);
    res.json({ review });
  } catch (error) {
    res.status(500).json({ error: "Error in AI review: " + error.message });
  }
});

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🚀 AY-Code Backend is running!");
});

// 🚀 Start server
const PORT = process.env.PORT || 2000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

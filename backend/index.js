require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const open = require("open").default;
const { DBConnection } = require("./database/db");
const { aiCodeReview } = require('./Routes/aiCodeReview');

const app = express();


// 🛡️ Middleware
app.use(cors({
origin: [
 
  "https://www.namescheap.xyz"
],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔌 Connect to MongoDB
DBConnection();

// 🛣️ Combined Routers (auth, problems, submissions, dashboard, user)
const apiRoutes = require("./Routes/index");
app.use("/api", apiRoutes);

// 🏁 Default route
app.get("/", (req, res) => {
  res.send("🚀 AY-Code Backend is running!");
  
});
app.post("/api/ai-review", async (req, res) => {
    const { code } = req.body;
    if (code === undefined) {
        return res.status(404).json({ success: false, error: "Empty code!" });
    }
    try {
        const review = await aiCodeReview(code);
        res.json({ "review": review });
    } catch (error) {
        res.status(500).json({ error: "Error in AI review, error: " + error.message });
    }
});





// 🚀 Start Server
const PORT = process.env.PORT || 2000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});


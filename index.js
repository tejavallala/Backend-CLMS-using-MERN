const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const express = require("express");
const userController = require("./controller/userController");
const courseController = require("./controller/courseController");
const cartController = require("./controller/cartController");
const adminController = require("./controller/adminController");
const PaymentController = require("./controller/paymentController");
const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 15;

const myEmitter = new EventEmitter();
myEmitter.setMaxListeners(15);

const cors = require("cors");
const bodyParser = require("body-parser");
const { cleanupInvalidCourseReferences } = require("./utils/cleanupUtils");
const app = express();
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var db = mongoose.connection;
db.on("open", () => console.log("Connected to DB"));
db.on("error", () => console.log("Error occurred"));

// Create uploads directory if it doesn't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads", "course-content");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: 'https://frontend-clms-using-mern.vercel.app', 
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use("/userRoute", userController);
app.use("/courseRoute", courseController);
app.use("/cartRoute", cartController);
app.use("/adminRoute", adminController);

app.use("/payment", PaymentController);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/admin/cleanup-courses", async (req, res) => {
  try {
    await cleanupInvalidCourseReferences();
    res.json({ success: true, message: "Cleanup completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(4000, () => {
  console.log("Server connected at 4000");
});

const express = require("express");
const userModel = require("../model/userModel");

const userRoute = new express.Router();

userRoute.post("/create-user", async (req, res) => {
  try {
    // Check if email already exists
    const existingUser = await userModel.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(req.body.phoneNumber)) {
      return res.status(400).json({ message: "Phone number must be 10 digits" });
    }

    // Create new user
    const newUser = await userModel.create(req.body);
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

userRoute.get("/", (req, res) => {
  userModel.find((err, data) => {
    if (err) return err;
    else res.json(data);
  });
});

userRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    const user = await userModel.findOne({ email, password });
    if (user) {
      res.status(200).json({ 
        success: true,
        message: "Login successful", 
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});

userRoute.get("/get-user/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id)
      .select('name email phoneNumber gender');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender:user.gender
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data"
    });
  }
});
// In your backend userRoute.js
userRoute.get('/user-courses/:userId', async (req, res) => {
  try {
    const courses = await Course.find({ 
      enrolledStudents: req.params.userId 
    });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user courses' 
    });
  }
});

module.exports = userRoute;

const express = require("express");
const adminModel = require("../model/adminModel");
const Courses = require("../model/courseModel");
const adminRoute = new express.Router();

// Update the login route to include role
adminRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminModel.findOne({ email, password });

    if (admin) {
      // Update last login time
      admin.lastLogin = new Date();
      await admin.save();

      res.status(200).json({
        success: true,
        message: "Login successful",
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role || "instructor", // Include role in response
          lastLogin: admin.lastLogin,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error occurred while logging in",
    });
  }
});

adminRoute.post("/create-instructor", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      qualifications,
      experience,
    } = req.body;

    // Check if instructor already exists
    const existingInstructor = await adminModel.findOne({ email });
    if (existingInstructor) {
      return res.status(400).json({
        success: false,
        message: "Instructor with this email already exists",
      });
    }

    // Create new instructor
    const instructor = new adminModel({
      name,
      email,
      password, // In production, remember to hash the password
      specialization,
      qualifications,
      experience,
    });

    await instructor.save();

    res.status(201).json({
      success: true,
      message: "Instructor created successfully",
      instructor: {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email,
      },
    });
  } catch (error) {
    console.error("Error creating instructor:", error);
    res.status(500).json({
      success: false,
      message: "Error creating instructor",
    });
  }
});

adminRoute.get("/profile/:id", async (req, res) => {
  try {
    const admin = await adminModel.findById(req.params.id).select("-password"); // Exclude password from the response

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        lastLogin: admin.lastLogin || new Date(),
        role: admin.role || "System Administrator",
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin profile",
    });
  }
});

// Get all instructors
adminRoute.get("/get-instructors", async (req, res) => {
  try {
    const instructors = await adminModel
      .find({ role: "instructor" })
      .select("name email bio specialization qualifications experience")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      instructors,
      count: instructors.length,
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructors",
    });
  }
});

// Get instructor details by ID
adminRoute.get("/get-instructor/:id", async (req, res) => {
  try {
    const instructor = await adminModel
      .findOne({
        _id: req.params.id,
        role: "instructor",
      })
      .select("-password");

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    res.status(200).json({
      success: true,
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        bio: instructor.bio,
        specialization: instructor.specialization,
        qualifications: instructor.qualifications,
        experience: instructor.experience,
      },
    });
  } catch (error) {
    console.error("Error fetching instructor details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructor details",
    });
  }
});

// Add a new route to get instructor's own courses
adminRoute.get("/instructor-courses/:id", async (req, res) => {
  try {
    const instructor = await adminModel.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Get courses where instructor ID matches
    const courses = await Courses.find({ instructor: req.params.id })
      .select("-__v")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses,
      count: courses.length,
    });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructor courses",
    });
  }
});

// Other admin routes can be added here

module.exports = adminRoute;

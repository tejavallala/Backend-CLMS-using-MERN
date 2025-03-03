const express = require("express");
const Course = require("../model/courseModel");
const Admin = require("../model/adminModel"); // For instructor details
const CourseContent = require("../model/courseContentModel");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const courseRoute = express.Router();
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'course-content');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Create Course
courseRoute.post("/create-course", async (req, res) => {
  try {
    const { instructor } = req.body;

    // Verify if instructor exists and has permission
    const instructorExists = await Admin.findOne({ 
      _id: instructor,
      role: 'instructor'
    });

    if (!instructorExists) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Invalid instructor"
      });
    }

    const newCourse = new Course({
      ...req.body,
      instructor: instructorExists._id
    });

    const savedCourse = await newCourse.save();
    
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: savedCourse
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      message: "Error creating course"
    });
  }
});

// Get all courses with instructor details
courseRoute.get("/", async (req, res) => {
  try {
    const { instructor } = req.query;
    
    // If instructor ID is provided, filter courses by instructor
    const query = instructor ? { instructor: instructor } : {};

    const courses = await Course.find(query)
      .populate({
        path: 'instructor',
        select: 'name email',
        model: 'Admin'
      })
      .sort({ createdAt: -1 });

    const formattedCourses = courses.map(course => ({
      ...course.toObject(),
      instructor: course.instructor || {
        name: 'Unknown Instructor',
        email: 'Email not available',
        _id: null
      }
    }));

    res.status(200).json({
      success: true,
      courses: formattedCourses
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message
    });
  }
});

// Get course by ID
courseRoute.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'instructor',
        select: 'name email bio specialization',
        model: Admin
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course details",
      error: error.message
    });
  }
});

// Update Course
courseRoute.put("/update-course/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const updates = req.body;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating course"
    });
  }
});

// Delete Course
courseRoute.delete("/delete-course/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting course"
    });
  }
});

// Get courses by category
courseRoute.get("/category/:category", async (req, res) => {
  try {
    const courses = await Course.find({ category: req.params.category })
      .populate({
        path: 'instructor',
        select: 'name email bio specialization',
        model: Admin
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error("Error fetching courses by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message
    });
  }
});

// Get courses by instructor
courseRoute.get("/instructor/:instructorId", async (req, res) => {
  try {
    const courses = await Course.find({ 'instructor': req.params.instructorId })
      .populate({
        path: 'instructor',
        select: 'name email bio specialization',
        model: Admin
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message
    });
  }
});

// Add course content with file upload
courseRoute.post("/add-content/:courseId", upload.single('file'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type, title, description, url, duration, instructorId, questions } = req.body;

    // Verify course exists and instructor owns it
    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized"
      });
    }

    let contentData = {
      course: courseId,
      type,
      title,
      description
    };

    // Handle different content types
    switch (type) {
      case 'video':
        contentData.url = url;
        contentData.duration = duration;
        break;

      case 'document':
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No file uploaded"
          });
        }
        contentData.fileUrl = `/uploads/course-content/${req.file.filename}`;
        contentData.fileName = req.file.originalname;
        break;

      case 'quiz':
        contentData.questions = JSON.parse(questions);
        break;
    }

    const newContent = new CourseContent(contentData);
    await newContent.save();

    res.status(201).json({
      success: true,
      message: "Content added successfully",
      content: newContent
    });
  } catch (error) {
    console.error("Error adding course content:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get course content
courseRoute.get("/content/:courseId", async (req, res) => {
  try {
    const content = await CourseContent.find({ course: req.params.courseId })
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      content
    });
  } catch (error) {
    console.error("Error fetching course content:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course content",
      error: error.message
    });
  }
});

// Update course content
courseRoute.put("/update-content/:contentId", upload.single('file'), async (req, res) => {
  try {
    const { type, title, description, url, duration, questions } = req.body;
    const updateData = { type, title, description };

    switch (type) {
      case 'video':
        updateData.url = url;
        updateData.duration = duration;
        break;

      case 'document':
        if (req.file) {
          updateData.fileUrl = `/uploads/course-content/${req.file.filename}`;
          updateData.fileType = req.file.mimetype;
          updateData.fileName = req.file.originalname;
        }
        break;

      case 'quiz':
        if (questions) {
          updateData.questions = JSON.parse(questions);
        }
        break;
    }

    const content = await CourseContent.findByIdAndUpdate(
      req.params.contentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Content updated successfully",
      content
    });
  } catch (error) {
    console.error("Error updating course content:", error);
    res.status(500).json({
      success: false,
      message: "Error updating course content",
      error: error.message
    });
  }
});

// Delete course content
courseRoute.delete("/delete-content/:contentId", async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found"
      });
    }

    // If it's a document, delete the file from storage
    if (content.type === 'document' && content.fileUrl) {
      const filePath = path.join(__dirname, '..', content.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await CourseContent.findByIdAndDelete(contentId);

    res.status(200).json({
      success: true,
      message: "Content deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting content",
      error: error.message
    });
  }
});

// Add this route to get courses by instructor
courseRoute.get("/instructor-courses/:instructorId", async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: "Instructor ID is required"
      });
    }

    const courses = await Course.find({ instructor: instructorId })
      .populate({
        path: 'instructor',
        select: 'name email',
        model: 'Admin'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses
    });

  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message
    });
  }
});
// Update the get course by ID route
courseRoute.get("/course/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the course ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    const course = await Course.findById(id)
      .populate({
        path: 'instructor',
        select: 'name email bio specialization',
        model: 'Admin'
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course details",
      error: error.message
    });
  }
});
module.exports = courseRoute;

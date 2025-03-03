const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  CourseName: { 
    type: String, 
    required: true
  },
  CourseDescription: { 
    type: String,
    required: true
  },
  Price: { 
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  category: {
    type: String,
    required: true
  },
  topics: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  language: {
    type: String,
    default: 'English'
  },
  startDate: Date,
  endDate: Date,
  content: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseContent'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);

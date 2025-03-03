const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true
  }
});

const courseContentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'document', 'quiz'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  url: String,
  duration: Number,
  order: {
    type: Number,
    default: 1
  },
  // For documents
  fileUrl: String,
  fileType: String,
  fileName: String,
  // For quizzes
  questions: [quizQuestionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model("CourseContent", courseContentSchema);
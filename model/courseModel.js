const mongoose = require("mongoose");
const Courses = require("../model/courseModel");
const courseSchema = new mongoose.Schema({
  CourseName: { type: String, required:true},
  CourseDescription: { type: String },
  Price: { type: String },
  imageUrl:{type:String}
  
}, {
  collection: "course"
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;

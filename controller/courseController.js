const express = require("express");
const Course = require("../model/courseModel");
const courseRoute = express.Router();
courseRoute.post("/create-course", async (req, res) => {
  try {
    const { CourseName, CourseDescription, Price,imageUrl } = req.body;

    const newCourse = new Course({
      CourseName,
      CourseDescription,
      Price,
      imageUrl,
      
    });

    await newCourse.save();

    res.status(200).json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

courseRoute.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

courseRoute.route("/update-course/:id")
  .get((req, res) => {
    Course.findById(req.params.id, (err, data) => {
      if (err)
        return err;
      else
        res.json(data);
    });
  })
  .put((req, res) => {
    Course.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }, (err, data) => {
      if (err)
        return err;
      else
        res.json(data);
    });
  });
courseRoute.delete("/delete-course/:id", (req, res) => {
  Course.findByIdAndRemove(req.params.id, (err, data) => {
    if (err)
      return err;
    else
      res.json(data);
  });
});
module.exports = courseRoute;

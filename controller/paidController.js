const express = require("express");
const Paid = require("../model/paidModel");
const paidRoute = express.Router();

paidRoute.post("/add-paid-course", (req, res) => {
    const { CourseName, CourseDescription,imageUrl } = req.body;


    const paidCourse = new Paid({
        CourseName: CourseName,
        CourseDescription: CourseDescription,
        imageUrl:imageUrl,
    });


    paidCourse.save()
        .then(() => {
            res.status(200).json({ message: "Paid course added successfully!" });
        })
        .catch((error) => {
            console.error("Error adding paid course to the database:", error);
            res.status(500).json({ message: "Internal server error" });
        });
});

paidRoute.get("/", async (req, res) => {
    try {

        const paidCourses = await Paid.find();
        res.status(200).json(paidCourses);
    } catch (error) {
        console.error("Error fetching paid courses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = paidRoute;

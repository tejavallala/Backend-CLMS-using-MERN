const express=require("express");
const adminModel=require("../model/adminModel");
const adminRoute=new express.Router();

adminRoute.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await adminModel.findOne({ email, password });
        if (admin) {
            res.status(200).json({ message: "Admin login successful", admin });
        } else {
            const user = await userModel.findOne({ email, password });
            if (user) {
                res.status(200).json({ message: "User login successful", user });
            } else {
                res.status(401).json({ message: "Invalid email or password" });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Other admin routes can be added here

module.exports = adminRoute;
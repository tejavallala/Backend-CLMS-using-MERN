const express = require("express");
const userModel = require("../model/userModel"); 

const userRoute = new express.Router();

userRoute.post("/create-user", (req, res) => {
    userModel.create(req.body, (err, data) => {
        if (err)
            return err;
        else
            res.json(data);
    });
});

userRoute.get("/", (req, res) => {
    userModel.find((err, data) => {
        if (err)
            return err;
        else
            res.json(data);
    });
});

userRoute.route("/update-user/:id")
    .get((req, res) => {
        userModel.findById(req.params.id, (err, data) => {
            if (err)
                return err;
            else
                res.json(data);
        });
    })
    .put((req, res) => {
        userModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }, (err, data) => {
            if (err)
                return err;
            else
                res.json(data);
        });
    });

userRoute.delete("/delete-user/:id", (req, res) => {
    userModel.findByIdAndRemove(req.params.id, (err, data) => {
        if (err)
            return err;
        else
            res.json(data);
    });
});



userRoute.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email, password });
        if (user) {
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
userRoute.get("/getUserDetails", async (req, res) => {
   
    try {
        const user = req.user; 
        if (user) {
            res.status(200).json({ message: "User details retrieved successfully", user });
        } else {
            res.status(401).json({ message: "User not authenticated" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = userRoute;


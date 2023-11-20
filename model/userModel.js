const mongoose = require("mongoose");
const User = require("../model/userModel");


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phonenumber: { type:String },
    gender: { type: String } 
}, {
    collection: "userRegistrations" 
});

module.exports = mongoose.model("studentSchema",userSchema);




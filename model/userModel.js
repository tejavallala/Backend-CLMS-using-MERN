const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^[0-9]{10}$/, "Phone number must be 10 digits"]
  },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: {
      values: ['male', 'female'],
      message: '{VALUE} is not a valid gender'
    }
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);




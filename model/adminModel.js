const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'instructor'],
    default: 'instructor'
  },
  specialization: {
    type: String,
    required: function() { return this.role === 'instructor'; }
  },
  qualifications: {
    type: String,
    required: function() { return this.role === 'instructor'; }
  },
  experience: {
    type: String,
    required: function() { return this.role === 'instructor'; }
  },
  bio: {
    type: String,
    default: ''
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
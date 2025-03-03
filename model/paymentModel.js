const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  userDetails: {
    name: String,
    email: String
  },
  paymentDetails: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentMethod: String,
    transactionId: String,
    stripeSessionId: {
      type: String,
      unique: true
    },
    invoiceNumber: {
      type: String,
      default: () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: "payments"
});

// Add a compound index for additional safety
paymentSchema.index({ 
  'paymentDetails.stripeSessionId': 1, 
  'paymentDetails.transactionId': 1 
}, { 
  unique: true 
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
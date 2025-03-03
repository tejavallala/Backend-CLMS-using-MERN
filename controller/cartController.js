const express = require('express');
const Cart = require('../model/cartModel');
const Course = require('../model/courseModel');
const Payment = require('../model/paymentModel'); // Added Payment model
const cartRoute = express.Router();
const mongoose=require('mongoose');

cartRoute.post('/add-to-cart', async (req, res) => {
  try {
    const { courseId, userId, price, instructorId } = req.body;

    // Validate required fields
    if (!courseId || !userId || !price || !instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if course already exists in cart
    const existingCartItem = await Cart.findOne({
      user: userId,
      course: courseId
    });

    if (existingCartItem) {
      return res.status(400).json({
        success: false,
        message: 'Course already in cart'
      });
    }

    // Create new cart item
    const newCartItem = new Cart({
      course: courseId,
      user: userId,
      instructor: instructorId,
      price: price
    });

    await newCartItem.save();

    // Get updated cart count
    const cartCount = await Cart.countDocuments({ user: userId });

    res.status(201).json({
      success: true,
      message: 'Course added to cart successfully',
      cartCount
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding course to cart',
      error: error.message
    });
  }
});

// Get user's cart items
cartRoute.get('/user-cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get purchased courses
    const purchasedCourses = await Payment.find(
      { 
        user: userObjectId,
        'paymentDetails.status': 'completed'
      },
      { 'courses.course': 1 }
    );

    const purchasedCourseIds = purchasedCourses.flatMap(payment => 
      payment.courses.map(course => course.course)
    );

    // Get cart items excluding purchased courses
    const cartItems = await Cart.find({
      user: userObjectId,
      course: { $nin: purchasedCourseIds }
    })
    .populate('course')
    .populate('instructor', 'name email');

    res.status(200).json({
      success: true,
      cartItems
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart items',
      error: error.message
    });
  }
});

// Remove item from cart
cartRoute.delete('/remove-from-cart/:cartItemId', async (req, res) => {
  try {
    const { cartItemId } = req.params;

    // Find and delete the cart item
    const deletedItem = await Cart.findByIdAndDelete(cartItemId);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Get updated cart count for the user
    const updatedCartCount = await Cart.countDocuments({ user: deletedItem.user });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      cartCount: updatedCartCount
    });

  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
});

module.exports = cartRoute;
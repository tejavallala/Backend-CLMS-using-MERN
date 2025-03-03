const express = require("express");
const stripe = require("../config/stripe");
const Payment = require("../model/paymentModel");
const Cart = require("../model/cartModel");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const paymentRoute = express.Router();

// Create Stripe checkout session
paymentRoute.post("/create-checkout-session", async (req, res) => {
  try {
    const { cartItems, userId } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cartItems.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.course.CourseName,
            description: `Instructor: ${item.instructor.name}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        userId: userId,
        courses: JSON.stringify(
          cartItems.map((item) => ({
            courseId: item.course._id,
            instructorId: item.instructor._id,
            price: item.price,
            name: item.course.CourseName,
            instructorName: item.instructor.name,
            instructorEmail: item.instructor.email,
          }))
        ),
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment status
paymentRoute.get("/verify-payment/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: true,
      status: session.payment_status,
      customer_email: session.customer_details?.email,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for asynchronous events
paymentRoute.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );

      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          // Handle successful payment
          // Update order status, clear cart, etc.
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

// Add verification endpoint
paymentRoute.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Replace the existing payment-success route with this updated version
paymentRoute.post("/payment-success", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata.userId) {
      throw new Error("User ID not found in session metadata");
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      "paymentDetails.stripeSessionId": sessionId,
    });

    if (existingPayment) {
      return res.json({
        success: true,
        message: "Payment already processed",
        purchasedCourses: existingPayment.courses.map(
          (course) => course.course
        ),
      });
    }

    // Parse the courses data from metadata
    const coursesData = JSON.parse(session.metadata.courses);

    // Create payment record
    const payment = new Payment({
      user: new mongoose.Types.ObjectId(session.metadata.userId),
      userDetails: {
        name: session.customer_details?.name || "",
        email: session.customer_details?.email || "",
      },
      courses: coursesData.map((course) => ({
        course: new mongoose.Types.ObjectId(course.courseId),
        instructor: new mongoose.Types.ObjectId(course.instructorId),
        price: course.price,
        courseName: course.name || "",
        instructorDetails: {
          name: course.instructorName || "",
          email: course.instructorEmail || "",
        },
      })),
      paymentDetails: {
        transactionId: session.payment_intent,
        stripeSessionId: sessionId,
        amount: session.amount_total / 100,
        currency: "inr",
        status: "completed",
        paymentMethod: "stripe",
      },
      purchaseDate: new Date(),
    });

    await payment.save();

    // Clear user's cart
    await Cart.deleteMany({
      user: new mongoose.Types.ObjectId(session.metadata.userId),
    });

    const purchasedCourseIds = coursesData.map(
      (course) => new mongoose.Types.ObjectId(course.courseId)
    );

    res.json({
      success: true,
      message: "Payment processed successfully",
      purchasedCourses: purchasedCourseIds,
    });
  } catch (error) {
    console.error("Payment success handling error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add this new route to your existing paymentController
paymentRoute.get("/purchased-courses/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find all completed payments for the user
    const payments = await Payment.find({
      user: userId,
      "paymentDetails.status": "completed",
    }).populate({
      path: "courses.course",
      populate: {
        path: "instructor",
        select: "name email",
      },
    });

    // Extract and filter out null courses
    const purchasedCourses = payments.flatMap((payment) =>
      payment.courses
        .filter((course) => course.course) // Filter out null courses
        .map((course) => ({
          ...course.course.toObject(),
          purchaseDate: payment.purchaseDate,
          paymentId: payment._id,
        }))
    );

    // Remove duplicates based on course ID
    const uniqueCourses = Array.from(
      new Map(
        purchasedCourses.map((course) => [course._id.toString(), course])
      ).values()
    );

    res.json({
      success: true,
      courses: uniqueCourses,
    });
  } catch (error) {
    console.error("Error fetching purchased courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching purchased courses",
      error: error.message,
    });
  }
});

paymentRoute.get('/instructor-purchases/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor ID format'
      });
    }

    const purchases = await Payment.find()
      .populate({
        path: 'courses.course',
        select: 'courseName instructor', // Get course name and instructor
        populate: {
          path: 'instructor', // Populate the instructor details
          select: '_id'
        }
      })
      .populate('user', 'name email') // Get student details
      .sort({ purchaseDate: -1 })
      .lean();

    // Transform and filter the data
    const transformedPurchases = purchases
      .map(purchase => {
        const filteredCourses = purchase.courses.filter(course =>
          course?.course?.instructor?._id?.toString() === instructorId
        );

        if (filteredCourses.length === 0) return null; // Remove purchases with no relevant courses

        return {
          _id: purchase._id,
          user: purchase.user, // Student details
          paymentDetails: purchase.paymentDetails || {}, // Payment details
          purchaseDate: purchase.purchaseDate || new Date(),
          courses: filteredCourses.map(course => ({
            courseName: course.course?.courseName || 'Unknown Course',
            price: course.price || 0
          }))
        };
      })
      .filter(purchase => purchase !== null);

    res.json({
      success: true,
      purchases: transformedPurchases,
      total: transformedPurchases.length
    });
  } catch (error) {
    console.error('Error fetching instructor purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase data',
      error: error.message
    });
  }
});


// Add this new route for payment history
paymentRoute.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({
      user: userId,
      "paymentDetails.status": "completed",
    })
      .populate({
        path: "courses.course",
        select: "CourseName instructor price",
      })
      .sort({ purchaseDate: -1 });

    const formattedPayments = payments.map((payment) => ({
      _id: payment._id,
      courses: payment.courses
        .filter((course) => course.course) // Filter out null courses
        .map((course) => ({
          _id: course.course._id,
          courseName: course.course.CourseName,
          price: course.price || 0, // Provide default value for price
        })),
      paymentDetails: {
        amount: payment.paymentDetails?.amount || 0,
        paymentMethod: payment.paymentDetails?.paymentMethod || "unknown",
        transactionId: payment.paymentDetails?.transactionId || "",
      },
      purchaseDate: payment.purchaseDate || new Date(),
    }));

    // Filter out payments with empty courses
    const validPayments = formattedPayments.filter(
      (payment) => payment.courses.length > 0
    );

    res.json({
      success: true,
      payments: validPayments,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment history",
      error: error.message,
    });
  }
});

// Add this new route for invoice download
paymentRoute.get("/invoice/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate({
        path: "courses.course",
        select: "CourseName",
      })
      .populate({
        path: "user",
        select: "name email",
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Create PDF document
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${paymentId}.pdf`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add content to PDF
    doc
      .fontSize(20)
      .text("Course Purchase Invoice", { align: "center" })
      .moveDown();

    // Add invoice details
    doc
      .fontSize(12)
      .text(
        `Invoice Date: ${new Date(payment.purchaseDate).toLocaleDateString()}`
      )
      .text(`Transaction ID: ${payment.paymentDetails.transactionId}`)
      .text(`Payment Method: ${payment.paymentDetails.paymentMethod}`)
      .moveDown();

    // Add customer details
    doc
      .text("Customer Details:")
      .text(`Name: ${payment.userDetails.name}`)
      .text(`Email: ${payment.userDetails.email}`)
      .moveDown();

    // Add purchased courses
    doc.text("Purchased Courses:", { underline: true }).moveDown();

    payment.courses.forEach((course, index) => {
      doc
        .text(`${index + 1}. ${course.course.CourseName}`)
        .text(`   Price: ₹${course.price}`)
        .moveDown(0.5);
    });

    // Add total amount
    doc
      .moveDown()
      .text("─".repeat(50))
      .fontSize(14)
      .text(`Total Amount: ₹${payment.paymentDetails.amount}`, {
        align: "right",
      })
      .moveDown();

    // Add footer
    doc
      .fontSize(10)
      .text("Thank you for your purchase!", { align: "center" })
      .text(
        "This is a computer-generated invoice and does not require a signature.",
        {
          align: "center",
          color: "grey",
        }
      );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error generating invoice",
      error: error.message,
    });
  }
});

module.exports = paymentRoute;

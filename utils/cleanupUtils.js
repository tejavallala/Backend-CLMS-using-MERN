const Payment = require('../model/paymentModel');
const Course = require('../model/courseModel');

const cleanupInvalidCourseReferences = async () => {
  try {
    // Find all payments
    const payments = await Payment.find();
    
    for (const payment of payments) {
      // Filter out courses that don't exist
      const validCourses = await Promise.all(
        payment.courses.map(async (courseRef) => {
          const exists = await Course.exists({ _id: courseRef.course });
          return exists ? courseRef : null;
        })
      );

      // Update payment with only valid courses
      payment.courses = validCourses.filter(course => course !== null);
      await payment.save();
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

module.exports = { cleanupInvalidCourseReferences };
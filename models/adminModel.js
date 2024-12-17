const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  gst: {
    type: Number,
    required: true,
  },
  deliveryCharges: {
    type: Number,
    required: true,
  },
  tdsCharges: {
    type: Number,
    required: true,
  },
  adminCharges: {
    type: Number,
    required: true,
  },
  productPrice: { type: Number, required: true },
  directIncomeTiers: [
    {
      maxDirectSponsors: { type: Number, required: true }, // Maximum sponsors in this tier
      percentage: { type: Number, required: true }        // Percentage for this tier
    }
  ],
  levelIncomePercentages: { type: [Number], required: true }   // Array for level income
});


const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true }, // e.g., Happy User
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Admin', adminSchema);;
module.exports = mongoose.model("Testimonial", TestimonialSchema);
const mongoose = require('mongoose');


const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true }, // e.g., Happy User
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Testimonial", TestimonialSchema);
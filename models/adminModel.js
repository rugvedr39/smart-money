const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  productPrice: {
    type: Number,
    required: true,
  },
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
  commissionLevels: {
    type: [Number], // An array of numbers for commission levels
    default: [15, 8, 6, 4, 2, 1, 1, 1, 1, 1], // Default levels if not provided
  },
  directIncomePercentage: {
    type: [Number], // Array to store percentages based on the number of sponsors
    default: [0, 10, 12, 12, 14, 14, 16, 16, 18, 18, 20], // Example values based on the sponsor count
  },
});
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
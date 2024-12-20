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
  levelIncomePercentages: { type: [Number], required: true },   // Array for level income
  teamRewards: [
    {
      teamCount: { type: Number, required: true }, // Number of team members
      magicIncome: { type: Number, required: true }, // Magic Income reward
      magicTopup: { type: Number, required: true }, // Magic Topup reward
    },
  ],
});

const Admin = mongoose.model('Admin', adminSchema);;

module.exports = Admin

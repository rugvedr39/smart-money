// models/user.model.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  upi: { type: String, unique: true },
  bankDetails: [{
    bankName: { type: String,},
    accountNumber: { type: String, },
    ifscCode: { type: String,}
  }],
  pan: { type: String, required: true, unique: true },
  mobileNumber: { type: Number, required: true, unique: true }, // Removed unique constraint
  email: { type: String, required: true, unique: true },
  sponsorId: { type: String },
  password: { type: String, required: true },
  username: { type: String, unique: true },
  wallet: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  isApproved: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
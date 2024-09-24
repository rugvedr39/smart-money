const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  upi: { type: String, required: true },
  bankDetails: { type: String },
  pan: { type: String, required: true, unique: true },
  mobileNumber: { type: Number, required: true },  // Removed unique constraint
  email: { type: String, required: true, unique: true },
  sponsorId: { type: String, required: true },
  password: { type: String, required: true },
  username: { type: String, unique: true },
  wallet: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  isApproved: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
module.exports = User;

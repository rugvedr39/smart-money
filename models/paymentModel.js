const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  utrNumber: { type: String, required: true,},
  amount: { type: Number, default: 3000 }, // Payment amount
  status: { type: String, default: 'pending' } // Payment status: pending, approved, rejected
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

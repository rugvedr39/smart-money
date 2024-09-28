const { status } = require('express/lib/response');
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Withdrawal', 'Product Price', 'Level Income','Direct Income'], 
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status:{
    type: Boolean,
    default: false,
    required: function() {
      return this.type === 'Withdrawal';
    }
  },
  tax: {
    type: Number,
    required: function() {
      return this.type === 'Withdrawal';
    }
  },
  upi_id:{
    type: String,
    required: function() {
      return this.type === 'Withdrawal';
    }
  },
  netPayable: {
    type: Number,
    required: function() {
      return this.type === 'Withdrawal';
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
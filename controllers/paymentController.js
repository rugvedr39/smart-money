const { default: mongoose } = require('mongoose');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const TeamHierarchy = require('../models/teamHierarchyModel'); // Import the TeamHierarchy model

exports.submitUTR = async (req, res) => {
    try {
      const { utrNumber, userId } = req.body;
      const objectId = new mongoose.Types.ObjectId(userId);
      const payment = new Payment({
        userId: objectId,
        utrNumber: utrNumber,
      });

      await payment.save();
      res.status(201).json({ message: 'UTR submitted successfully. Awaiting admin approval.' });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({ message: 'Invalid user ID format.' });
      } else {
        res.status(500).json({ message: 'Error submitting UTR.', error });
      }
    }
  };

exports.getPendingPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;
    const totalPayments = await Payment.countDocuments({ status: 'pending' });
    const payments = await Payment.find({ status: 'pending' })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'name mobileNumber',
      });
    const paymentsWithUserDetails = payments.map(payment => ({
      ...payment.toObject(),
      userName: payment.userId.name, 
      userMobileNumber: payment.userId.mobileNumber
    }));

    res.status(200).json({
      payments: paymentsWithUserDetails,
      total: totalPayments,
      page: page,
      totalPages: Math.ceil(totalPayments / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending payments.', error });
  }
};



 exports.approvePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const date = req.params.date;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.log('Payment not found');
      return res.status(404).json({ message: 'Payment not found.' });
    }
    payment.status = 'approved';
    await payment.save();
    const user = await User.findById(payment.userId);
    user.isApproved = true;
    user.save();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    let currentUser = user;
    const commissionLevels = [15, 8, 6, 4, 2, 1, 1, 1, 1, 1];
    const totalAmount = 3000;
    for (let level = 0; level < commissionLevels.length; level++) {
      const sponsorId = currentUser.sponsorId;
      if (!sponsorId) {
        break;
      }
      const sponsor = await User.findOne({ username: sponsorId });
      if (!sponsor) {
        break;
      }
      const commission = (totalAmount * commissionLevels[level]) / 100;
      sponsor.wallet += commission;
      await sponsor.save();
      const transaction = new Transaction({
        userId: sponsor._id,
        type: 'Level Income',
        amount: commission,
      });
      await transaction.save();
      currentUser = sponsor;
    }

    res.status(200).json({ message: 'Payment approved and income distributed.' });
  } catch (error) {
    console.error("Error approving payment and distributing income:", error);
    res.status(500).json({ message: 'Error approving payment and distributing income.', error });
  }
};

exports.getTransactions = async (req, res) => {  
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of items per page
    const userId = req.query.userId; // Optionally filter by userId

    // Build the query
    const query = userId ? { userId } : {};

    // Fetch transactions with pagination and sorting
    const transactions = await Transaction.find({ userId: userId})
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(limit)
      .skip((page - 1) * limit); // Skip the previous pages

    const totalItems = await Transaction.countDocuments(query); // Count total transactions

    // Send the response
    res.status(200).json({
      transactions,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transactions.', error: error.message });
  }
};

exports.withdrawRequest = async (req, res) => {
  const { userId, amount,tax,netPayable,upi_id } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    const newTransaction = new Transaction({
      userId,
      type: 'Withdrawal',
      amount,
      tax,
      netPayable,
      status: false,
      upi_id
    });
    await newTransaction.save();
    user.wallet -= amount;
    await user.save();
    res.status(201).json({ message: 'Withdrawal request submitted', transaction: newTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
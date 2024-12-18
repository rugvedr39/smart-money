const { default: mongoose } = require('mongoose');
const Payment = require('../models/paymentModel');
const User = require('../models/user');
const Transaction = require('../models/transactionModel');
const TeamHierarchy = require('../models/teamHierarchyModel'); // Import the TeamHierarchy model
const Admin = require('../models/adminModel');
const Product = require('../models/product');
const AutoPool = require('../models/autopoolModal');

exports.submitUTR = async (req, res) => {
    try {
      const { utrNumber, userId } = req.body;
      const objectId = new mongoose.Types.ObjectId(userId);

      const amount = await Admin.find()
      const gstAmount = (amount[0].productPrice * amount[0].gst) / 100;
      const paymonut = amount[0].productPrice + amount[0].deliveryCharges + gstAmount;
      const roundedPaymonut = Math.round(paymonut);

      const payment = new Payment({
        userId: objectId,
        utrNumber: utrNumber,
        amount:roundedPaymonut
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
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Approve the payment
    payment.status = 'approved';
    await payment.save();

    const user = await User.findById(payment.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const sponsorDirectReferrals = await User.countDocuments({ sponsorId: user.sponsorId });
    if (sponsorDirectReferrals === 3) {
      const sponsorObjectId = new mongoose.Types.ObjectId(user.sponsorId); // Convert to ObjectId
    
      const existingPoolUser = await AutoPool.findOne({ userId: sponsorObjectId });
      if (existingPoolUser) {
        console.log("User already in Auto Pool");
        return;
      }
    
      // Add user to auto pool
      const newAutoPoolEntry = new AutoPool({ userId: sponsorObjectId, teamCount: 0 });
      await newAutoPoolEntry.save();
      await propagateTeamCount(sponsorObjectId);
    }


    user.isApproved = true;
    await user.save();

    const product = await Product.find();
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }


    const totalAmount = product[0].price;

    const adminDetails = await Admin.findOne({});
    if (!adminDetails) {
      return res.status(500).json({ message: 'Admin details not found.' });
    }

    const directIncomeTiers = adminDetails.directIncomeTiers;
    const levelIncomePercentages = adminDetails.levelIncomePercentages;

    // Handle Direct Income
    const directSponsorId = user.sponsorId;
    if (directSponsorId) {
      const directSponsor = await User.findOne({ username: directSponsorId });
      if (directSponsor) {
        const sponsorsCount = await User.countDocuments({ sponsorId: directSponsorId });

        // Determine direct income percentage based on tiers
        let directIncomePercentage = 0;
        for (const tier of directIncomeTiers) {
          if (sponsorsCount <= tier.maxDirectSponsors) {
            directIncomePercentage = tier.percentage;
            break;
          }
        }
        // If no tier matches, use the highest percentage
        if (directIncomePercentage === 0 && directIncomeTiers.length > 0) {
          directIncomePercentage = directIncomeTiers[directIncomeTiers.length - 1].percentage;
        }

        const directIncome = (totalAmount * directIncomePercentage) / 100;
        directSponsor.wallet += directIncome;

        const directIncomeTransaction = new Transaction({
          userId: directSponsor._id,
          type: 'Direct Income',
          amount: directIncome
        });

        await directIncomeTransaction.save();
        await directSponsor.save();
      }
    }

    // Handle Level Income (as before, skipping Level 1)
    let currentUser = user;
let directIncomeRecipientId = null;

// Identify Direct Income recipient (Level 1 sponsor)
if (user.sponsorId) {
  const directSponsor = await User.findOne({ username: user.sponsorId });
  if (directSponsor) {
    directIncomeRecipientId = directSponsor._id;
  }
}

for (let level = 1; level <= 10; level++) {
  const sponsorId = currentUser.sponsorId;
  if (!sponsorId) break; // Exit if no sponsor exists

  const sponsor = await User.findOne({ username: sponsorId });
  if (!sponsor) break;

  // Skip Level 1 income for the Direct Income recipient
  if (level === 1 && sponsor._id.equals(directIncomeRecipientId)) {
    currentUser = sponsor; // Move to the next level in hierarchy
    continue; // Skip this level income
  }

  // Fetch the level income percentage for the current level
  const levelIncomePercentage = levelIncomePercentages[level - 2] || 1; // Use default 1% if not defined
  const levelIncome = (totalAmount * levelIncomePercentage) / 100;

  // Add level income to the sponsor's wallet
  sponsor.wallet += levelIncome;

  // Record the transaction for level income
  const levelIncomeTransaction = new Transaction({
    userId: sponsor._id,
    type: `Level Income`,
    amount: levelIncome,
  });

  await levelIncomeTransaction.save();
  await sponsor.save();

  // Move to the next sponsor in the hierarchy
  currentUser = sponsor;
}




    res.status(200).json({ message: 'Payment approved and income distributed.' });
  } catch (error) {
    console.error('Error approving payment and distributing income:', error);
    res.status(500).json({ message: 'Error approving payment and distributing income.', error });
  }
};






exports.getTransactions = async (req, res) => {  
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of items per page
    const userId = req.query.userId; // Optionally filter by userId
    const query = userId ? { userId } : {};
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


// Controller for getting all withdrawal transactions with pagination
exports.getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Get pagination parameters from the query string
    const skip = (page - 1) * limit;
    const totalWithdrawals = await Transaction.countDocuments({ type: 'Withdrawal' });
    const withdrawals = await Transaction.find({ type: 'Withdrawal' })
      .populate('userId', 'name username mobileNumber') // Populate the userId field with name, username, and phone
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(Number(limit));
    res.status(200).json({
      totalWithdrawals,
      totalPages: Math.ceil(totalWithdrawals / limit),
      currentPage: Number(page),
      withdrawals,
    });
  } catch (error) {
    console.error("Error fetching withdrawal transactions:", error);
    res.status(500).json({ message: 'Error fetching withdrawal transactions.', error });
  }
};


exports.markAsPaid = async (req, res) => {
  const { transactionId } = req.body;
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }
    transaction.status = true;
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    user.isApproved = true;
    await user.save();
    await transaction.save();
    res.status(200).json({ status: 200, message: 'Transaction marked as paid successfully.', transaction });
  } catch (error) {
    console.error('Error marking transaction as paid:', error);
    res.status(500).json({ message: 'Error marking transaction as paid.', error });
  }
};

exports.getTeamHierarchy = async (req, res) => {
  try {
    const { userId, level = 1, page = 1, limit = 10 } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is missing in query parameters' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const levelNum = parseInt(level, 10);

    if (isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ error: 'Invalid limit value' });
    }

    if (isNaN(levelNum) || levelNum <= 0 || levelNum > 10) {
      return res.status(400).json({ error: 'Level must be between 1 and 10.' });
    }

    const skip = (pageNum - 1) * limitNum;
    const objectId = new mongoose.Types.ObjectId(userId);
    // Fetch team data
    const team = await TeamHierarchy.find({ sponsorId: objectId, level: levelNum })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email mobileNumber username isApproved') // Populate user details
      .exec();

    const totalCount = await TeamHierarchy.countDocuments({ sponsorId: objectId, level: levelNum });

    res.status(200).json({
      data: team,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

async function propagateTeamCount(userId) {
  try {
    // Fetch the user's sponsorId from the User model
    const user = await User.findById(userId);
    if (!user || !user.sponsorId) return; // Stop if no sponsorId

    const sponsorId = user.sponsorId;

    // Check if the sponsor is in the auto pool
    const sponsorPoolEntry = await AutoPool.findOne({ userId: sponsorId });
    if (!sponsorPoolEntry) return; // Stop if sponsor is not in auto pool

    // Increment sponsor's team count
    sponsorPoolEntry.teamCount += 1;
    await sponsorPoolEntry.save();
    console.log(`Sponsor ${sponsorId} team count incremented to ${sponsorPoolEntry.teamCount}`);

    // Determine rewards based on team count
    const rewards = {
      3: { magicIncome: 2100, magicTopup: 2100 },
      6: { magicIncome: 12600, magicTopup: 10800 },
      9: { magicIncome: 97200, magicTopup: 83315 },
      12: { magicIncome: 999780, magicTopup: 0 } // No Magic Topup on 12
    };

    const reward = rewards[sponsorPoolEntry.teamCount];

    if (reward) {
      // Fetch sponsor details
      const sponsor = await User.findById(sponsorId);

      if (!sponsor) return;

      // Handle Magic Income transaction
      if (reward.magicIncome > 0) {
        const magicIncomeTransaction = new Transaction({
          userId: sponsorId,
          type: 'Magic Income',
          amount: reward.magicIncome,
        });
        await magicIncomeTransaction.save();

        sponsor.wallet += reward.magicIncome;
        console.log(`Magic Income of ${reward.magicIncome} added to sponsor ${sponsorId}`);
      }

      // Handle Magic Topup transaction
      if (reward.magicTopup > 0) {
        const magicTopupTransaction = new Transaction({
          userId: sponsorId,
          type: 'Magic Topup',
          amount: reward.magicTopup,
        });
        await magicTopupTransaction.save();

        sponsor.wallet -= reward.magicTopup;
        console.log(`Magic Topup of ${reward.magicTopup} added to sponsor ${sponsorId}`);
      }

      await sponsor.save();
    }


    // Recursively propagate to the sponsor's sponsor
    await propagateTeamCount(sponsorId);

  } catch (error) {
    console.error("Error propagating team count:", error);
  }
}
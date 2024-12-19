const Transaction = require('../models/transactionModel');
const User = require('../models/user');
const Product = require('../models/product');
const Payment = require('../models/paymentModel');
const Admin = require('../models/adminModel');
const TeamHierarchy = require('../models/teamHierarchyModel');
const Autopool = require('../models/autopoolModal');
const { default: mongoose } = require('mongoose');



// Get all users (optional, for admin purposes)
exports.getUsers = async (req, res) => {
  try {
    // Destructure query params for pagination, sorting, and filtering
    const {
      page = 1, // Default page is 1
      limit = 10, // Default limit is 10 users per page
      sortBy = 'createdAt', // Default sorting column
      order = 'desc', // Default order is descending
      search = '', // Optional search query (e.g., username or email)
    } = req.query;

    // Parse page and limit to integers
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Create a filter for search (e.g., search by name or email)
    const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } }, // Case-insensitive name search
          { email: { $regex: search, $options: 'i' } }, // Case-insensitive email search
          { username: { $regex: search, $options: 'i' } }, // Case-insensitive username search
          isNaN(Number(search))
            ? null
            : { mobileNumber: Number(search) }, // Exact match for mobile number
        ].filter(Boolean), // Remove null if search is not a number
      }
    : {};

    // Get total count of users for pagination metadata
    const totalUsers = await User.countDocuments(searchQuery);

    // Fetch users with pagination, sorting, and filtering
    const users = await User.find(searchQuery)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 }) // Sorting
      .skip((pageNumber - 1) * pageSize) // Skip users for previous pages
      .limit(pageSize); // Limit the number of users returned

    // Send paginated response
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
      pagination: {
        totalUsers,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalUsers / pageSize),
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};






const generateUniqueUsername = async () => {
    let username;
    let isUnique = false;
    while (!isUnique) {
      // Generate a 6-digit username
      username = Math.floor(100000 + Math.random() * 900000).toString();
      // Check if the username already exists
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        isUnique = true;
      }
    }
    return username;
  };

// Create a new user
exports.createUser = async (req, res) => {
  const { name, address, upi, bankDetails, pan, mobileNumber, email, sponsorId, password } = req.body;

  const existingUser = await User.findOne({ $or: [ 
    { email },
    { pan },
    { mobileNumber },
    { upi }
  ] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username or mobile Number or upi already exists' });
    }

    const sponsorUser = await User.findOne({ username: sponsorId });
    if (!sponsorUser) {
      return res.status(400).json({ message: 'Invalid sponsorId. Sponsor not found.' });
    }
    // Generate unique username for new user
    const username = await generateUniqueUsername(); 

  try {
    const newUser = new User({
      name,
      address,
      upi,
      bankDetails,
      pan,
      mobileNumber,
      email,
      sponsorId,
      password,
      username
    });
    await newUser.save();

    let currentSponsor = sponsorUser;
    let currentLevel = 1;

    while (currentSponsor && currentLevel <= 10) {
      await TeamHierarchy.create({
        userId: newUser._id,
        sponsorId: currentSponsor._id,
        level: currentLevel
      });
      currentSponsor = await User.findOne({ username: currentSponsor.sponsorId });
      currentLevel++;
    }

    const product = await Product.find();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const amount = await Admin.find()
    const gstAmount = (amount[0].productPrice * amount[0].gst) / 100;
    const paymonut = amount[0].productPrice + amount[0].deliveryCharges + gstAmount;
    const roundedPaymonut = Math.round(paymonut);


    const date = new Date();
    const transaction = new Transaction({
        userId: newUser._id,
        type: 'Product Price',
        amount:roundedPaymonut,
        createdAt:date
      });
      transaction.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error });
    console.log(error);
  }
};

// Update user data
exports.updateUser = async (req, res) => {
  const { userId, name, address, upi, bankDetails, pan, mobileNumber, email, sponsorId, password, username } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, {
      name,
      address,
      upi,
      bankDetails,
      pan,
      mobileNumber,
      email,
      sponsorId,
      password,
      username
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error });
  }
};

// Get a specific user (optional)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }

}



exports.login = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ $or: [{ username }, { email: username }] });
      if (!user) {
        return res.status(400).json({ message: 'Invalid username or email' });
      }
      if (password!=user.password) {
        return res.status(400).json({ message: 'Invalid password' });
      }
      res.status(200).json({ userId: user });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };


  exports.getUserbyIdforIsApproved = async (req, res) =>  {
    try {
      const id = req.params.id
      const user = await User.findOne({_id: new Object(id)})
      const payments = await Payment.findOne({userId:new Object(id)})

      const amount = await Admin.find()
      const gstAmount = (amount[0].productPrice * amount[0].gst) / 100;
      const paymonut = amount[0].productPrice + amount[0].deliveryCharges + gstAmount;
      const roundedPaymonut = Math.round(paymonut);

      if (user) {
        return res.status(200).json({status:200,data:user.isApproved,payments:payments,amount:roundedPaymonut});
      }else{
        return res.status(200).json({status:400,message:"user not found"})
      }
    }
    catch (error) {
      res.status(500).json({ message: 'Error fetching user', error });
    }
  }




  // dashboard

  exports.getDashboardData = async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const walletBalance = user.wallet;
      const incomeData = await Transaction.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId), 
            type: { $in: ['Level Income', 'Direct Income'] } 
          } 
        },
        { 
          $group: { 
            _id: '$type', 
            total: { $sum: '$amount' } 
          } 
        }
      ]);
      const incomeMap = incomeData.reduce((acc, cur) => {
        acc[cur._id] = cur.total;
        return acc;
      }, {});
      const directSponsorCount = await TeamHierarchy.countDocuments({ sponsorId: userId,level: 1 });
      let magicteamcount = undefined
      const magicteam = await Autopool.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (magicteam) {
        magicteamcount = magicteam.teamCount;
      }else{
        magicteamcount  = undefined 
      }
      const teamSize = await TeamHierarchy.countDocuments({ sponsorId: userId });
      const directIncome = incomeMap['Direct Income'] || 0;
      const levelIncome = incomeMap['Level Income'] || 0;
      const magicIncome = incomeMap['Magic Income'] || 0;
      const totalIncome = directIncome + levelIncome;
      const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type amount status createdAt'); // Fetch only specific fields
      const pendingWithdrawals = await Transaction.countDocuments({ userId, type: 'Withdrawal', status: false });
      res.status(200).json({
        walletBalance,
        totalIncome,
        directIncome,
        magicteamcount,
        levelIncome,
        pendingWithdrawals,
        user,
        magicIncome,
        directSponsors: directSponsorCount,
        teamSize,
        recentTransactions
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data.', error: error.message });
    }
  };


  exports.getTransactions = async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query; // Default values for pagination
      const skip = (page - 1) * limit;
  
      // Fetch transactions with pagination
      const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 }) // Sort by latest first
        .skip(skip)
        .limit(Number(limit));
  
      // Total transaction count
      const totalTransactions = await Transaction.countDocuments({ userId });
  
      res.status(200).json({
        transactions,
        totalTransactions,
        currentPage: Number(page),
        totalPages: Math.ceil(totalTransactions / limit),
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Error fetching transactions.', error: error.message });
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
      .populate('userId', 'name email mobileNumber wallet isApproved') // Populate user details
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
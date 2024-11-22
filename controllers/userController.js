const { default: mongoose } = require('mongoose');
const User = require('../models/userModel');
const TeamHierarchy = require('../models/teamHierarchyModel'); // Import the TeamHierarchy model
const Transaction = require('../models/transactionModel');
const Payment = require('../models/paymentModel');


// Register User

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


exports.registerUser = async (req, res) => {
  try {
    const { name, address, upi, bankDetails, pan, mobileNumber, email, sponsorId, password ,date } = req.body;
    // Validate and get sponsor user
    // const sponsorUser = await User.findOne({ username: sponsorId });
    // if (!sponsorUser) {
    //   return res.status(400).json({ message: 'Invalid sponsorId. Sponsor not found.' });
    // }
    const panUser = await User.findOne({ pan: pan });
    if (panUser) {
      return res.status(404).json({ message: 'This Pan is allready registred' });
    }
    const emailUser = await User.findOne({ email: email });
    if (emailUser) {
      return res.status(404).json({ message: 'This Email is allready registred' });
    }
    // Generate unique username for new user
    const username = await generateUniqueUsername(); 

    // Create and save new user
    const newUser = new User({ name, address, upi, bankDetails, pan, mobileNumber, email, sponsorId, password, username });
    await newUser.save();

    // Update TeamHierarchy for sponsor
    let currentSponsor = sponsorUser;
    let currentLevel = 1;

    while (currentSponsor && currentLevel <= 10) {
      await TeamHierarchy.create({
        userId: newUser._id,
        sponsorId: currentSponsor._id,
        level: currentLevel
      });

      // Move up the chain, find the next sponsor
      currentSponsor = await User.findOne({ username: currentSponsor.sponsorId });
      currentLevel++;
    }
    const transaction = new Transaction({
      userId: newUser._id,
      type: 'Product Price',
      amount: 3000,
      createdAt:date
    });
    transaction.save();
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.log(error);
    
    if (error.code && error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate key error. Please check your inputs.' });
    }
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};



// Get User Dashboard Data
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    const user = await User.findById(userId).select('username wallet sponsorId name mobileNumber');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Count total directs
    const totalDirects = await User.countDocuments({ sponsorId: user.username,level : 1 });

    // Respond with user data and total directs
    res.status(200).json({
      user: {
        username: user.username,
        wallet: user.wallet,
        totalDirects: totalDirects,
        name: user.name,
        mobileNumber: user.mobileNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user dashboard data.', error });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (password != user.password) {
     return res.status(400).json({ message: 'Invalid credentials.' });
    }
    res.status(200).json({ userId: user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed. Please try again later.', error: error.message });
  }
};


exports.getTeamHierarchy = async (req, res) => {
  try {
    const userId = req.params.userId;  // Starting with the current user
    const page = parseInt(req.query.page) || 1;  // Get page from query parameters
    const limit = parseInt(req.query.limit) || 5;  // Set limit (items per page)
    const currentLevel = parseInt(req.query.level) || 1;  // Get level from query parameters

    // Find team members where sponsorId matches the current user's userId
    const teamMembers = await TeamHierarchy.find({ sponsorId: userId, level: currentLevel })
    .populate('userId', 'name email username isApproved') // Populate user details for the team members
    .populate('sponsorId', 'username') // Populate sponsor details if needed
    .limit(limit)
    .skip((page - 1) * limit);  // Pagination logic

    const totalItems = await TeamHierarchy.countDocuments({ sponsorId: userId, level: currentLevel });

    // Send the paginated team hierarchy data
    res.status(200).json({
      team: teamMembers,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team hierarchy.', error });
  }
};

exports.getUserbyUsername = async (req, res) =>  {
  try {
    const sponserId = req.params.sponserId
    const user = await User.findOne({username: sponserId})
    if (user) {
      return res.status(200).json({status:200,data:user.name})
    }else{
      return res.status(200).json({status:400,message:"user not found"})
    }
  }
  catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
}

exports.getUserbyIdforIsApproved = async (req, res) =>  {
  try {
    const id = req.params.id
    const user = await User.findOne({_id: new Object(id)})
    const payments = await Payment.findOne({userId:new Object(id)})
    if (user) {
      return res.status(200).json({status:200,data:user.isApproved,payments:payments});
    }else{
      return res.status(200).json({status:400,message:"user not found"})
    }
  }
  catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
}


exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id; // User ID from request parameters
    const updateData = req.body;  // Data to update from the request body

    // Find the user by ID and update their profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },  // Fields to update
      { new: true, runValidators: true } // Return updated user and validate fields
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: 'Error updating user profile', error });
  }
};
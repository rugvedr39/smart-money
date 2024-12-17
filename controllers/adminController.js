const Admin = require('../models/adminModel');
const Transaction = require('../models/transactionModel');
const User = require('../models/user');
const Testimonial = require('../models/TestimonialModal');
const SocialLink = require('../models/SocialLinkModel');

// Get admin settings
exports.getAdminSettings = async (req, res) => {
  try {
    const adminSettings = await Admin.findOne();
    if (!adminSettings) {
      return res.status(404).json({ message: 'Admin settings not found' });
    }
    res.status(200).json(adminSettings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin settings', error });
  }
};

// Create or update admin settings
exports.createOrUpdateAdminSettings = async (req, res) => {
  try {
    const {
      gst,
      deliveryCharges,
      tdsCharges,
      adminCharges,
      productPrice,
      directIncomeTiers,
      levelIncomePercentages
    } = req.body;

    let adminSettings = await Admin.findOne();
    if (adminSettings) {
      // Update existing settings
      adminSettings.gst = gst;
      adminSettings.deliveryCharges = deliveryCharges;
      adminSettings.tdsCharges = tdsCharges;
      adminSettings.adminCharges = adminCharges;
      adminSettings.productPrice = productPrice;
      adminSettings.directIncomeTiers = directIncomeTiers;
      adminSettings.levelIncomePercentages = levelIncomePercentages;

      adminSettings = await adminSettings.save();
      res.status(200).json({ message: 'Admin settings updated successfully', adminSettings });
    } else {
      // Create new settings
      adminSettings = new Admin({
        gst,
        deliveryCharges,
        tdsCharges,
        adminCharges,
        productPrice,
        directIncomeTiers,
        levelIncomePercentages
      });

      await adminSettings.save();
      res.status(201).json({ message: 'Admin settings created successfully', adminSettings });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to create or update admin settings', error });
  }
};

// Delete admin settings
exports.deleteAdminSettings = async (req, res) => {
  try {
    const adminSettings = await Admin.findOne();
    if (!adminSettings) {
      return res.status(404).json({ message: 'Admin settings not found' });
    }
    await Admin.deleteOne({ _id: adminSettings._id });
    res.status(200).json({ message: 'Admin settings deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete admin settings', error });
  }
};



exports.getDashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEarnings = await Transaction.aggregate([
      { $match: { type: { $in: ['Product Price'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const activeMembers = await User.countDocuments({ isApproved: true });
    const pendingPayouts = await Transaction.countDocuments({
      type: 'Withdrawal',
      status: false,
    });
    res.status(200).json({
      success:true,
      data:{
        totalUsers,
        totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
        activeMembers,
        pendingPayouts,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: err });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find();
    res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch testimonials.",
    });
  }
};

exports.createTestimonial = async (req, res) => {
  try {
    const { name, title, message } = req.body;

    // Validation
    if (!name || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, title, and message.",
      });
    }

    // Create new testimonial
    const newTestimonial = new Testimonial({ name, title, message });
    await newTestimonial.save();

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully.",
      data: newTestimonial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to create testimonial.",
    });
  }
};

// Controller to delete a testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the testimonial
    const deletedTestimonial = await Testimonial.findByIdAndDelete(id);

    if (!deletedTestimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to delete testimonial.",
    });
  }
};




exports.addSocialLink = async (req, res) => {
  try {
    const { platform, url, icon } = req.body;
    if (!platform || !url || !icon) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const newLink = new SocialLink({ platform, url, icon });
    const savedLink = await newLink.save();
    res.status(201).json({ message: 'Social link added successfully.', data: savedLink });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

exports.getSocialLinks = async (req, res) => {
  try {
    const links = await SocialLink.find();
    res.status(200).json({ message: 'Social links fetched successfully.', data: links });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};


exports.updateSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, url, icon } = req.body;
    if (!platform || !url || !icon) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const updatedLink = await SocialLink.findByIdAndUpdate(
      id,
      { platform, url, icon },
      { new: true, runValidators: true }
    );
    if (!updatedLink) {
      return res.status(404).json({ message: 'Social link not found.' });
    }
    res.status(200).json({ message: 'Social link updated successfully.', data: updatedLink });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

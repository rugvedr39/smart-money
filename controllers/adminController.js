const Admin = require('../models/adminModel');

// Controller to get Admin settings
exports.getAdminSettings = async (req, res) => {
  try {
    const adminSettings = await Admin.findOne({});
    if (!adminSettings) {
      return res.status(404).json({ message: 'Admin settings not found.' });
    }
    res.status(200).json(adminSettings);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    res.status(500).json({ message: 'Error fetching admin settings.', error });
  }
};

// Controller to update Admin settings
exports.updateAdminSettings = async (req, res) => {
  try {
    const {
      productPrice,
      gst,
      deliveryCharges,
      tdsCharges,
      adminCharges,
      commissionLevels,
      directIncomePercentage
    } = req.body;

    let adminSettings = await Admin.findOne({});
    if (!adminSettings) {
      // If settings don't exist, create a new one
      adminSettings = new Admin({
        productPrice,
        gst,
        deliveryCharges,
        tdsCharges,
        adminCharges,
        commissionLevels,
        directIncomePercentage
      });
    } else {
      // Update the existing admin settings
      adminSettings.productPrice = productPrice;
      adminSettings.gst = gst;
      adminSettings.deliveryCharges = deliveryCharges;
      adminSettings.tdsCharges = tdsCharges;
      adminSettings.adminCharges = adminCharges;
      adminSettings.commissionLevels = commissionLevels;
      adminSettings.directIncomePercentage = directIncomePercentage;
    }

    await adminSettings.save();
    res.status(200).json({ message: 'Admin settings updated successfully.' });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    res.status(500).json({ message: 'Error updating admin settings.', error });
  }
};

exports.getProductDetails = async (req, res) => {
    try {
      const productDetails = await Admin.findOne({});
      if (!productDetails) {
        return res.status(404).json({ message: 'Product details not found' });
      }
      res.status(200).json(productDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve product details', error: error.message });
    }
};
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/setiingsController');

// Get company name
router.get('/', settingsController.getCompanyName);

// Update company name
router.put('/', settingsController.updateCompanyName);

module.exports = router;
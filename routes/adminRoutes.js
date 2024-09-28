const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/getProductDetails', adminController.getProductDetails)
router.post('/settings', adminController.updateAdminSettings);
router.get('/settings', adminController.getAdminSettings);





module.exports = router;

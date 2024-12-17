const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route to get admin settings
router.get('/', adminController.getAdminSettings);
router.get('/dashboardData', adminController.getDashboardData);
router.post('/', adminController.createOrUpdateAdminSettings);
router.delete('/', adminController.deleteAdminSettings);
router.get('/getTestimonials', adminController.getTestimonials);
router.post('/createTestimonial', adminController.createTestimonial);
router.delete('/deleteTestimonial', adminController.deleteTestimonial);
router.post('/social-links', adminController.addSocialLink);
router.get('/social-links', adminController.getSocialLinks);
router.put('/social-links/:id', adminController.updateSocialLink);

module.exports = router;
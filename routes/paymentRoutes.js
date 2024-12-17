const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');



// Route to submit UTR
router.post('/submit-utr', paymentController.submitUTR);

// Fetch all pending payments
router.get('/pending', paymentController.getPendingPayments);

// Admin route to approve payment
router.put('/approvePayment/:id', paymentController.approvePayment);
router.get('/getTransactions', paymentController.getTransactions);
router.post('/addwithdrawRequest', paymentController.withdrawRequest);
router.get('/withdrawals', paymentController.getWithdrawals);
router.post('/markAsPaid', paymentController.markAsPaid);
router.get('/teamhierarchy', paymentController.getTeamHierarchy);


module.exports = router;

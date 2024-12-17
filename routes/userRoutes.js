const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Routes for handling user CRUD operations
router.get('/', userController.getUsers);
router.post('/create', userController.createUser);
router.put('/update', userController.updateUser);
router.get('/:id', userController.getUser);
router.post('/login', userController.login);
router.get('/getUserbyIdforIsApproved/:id', userController.getUserbyIdforIsApproved);

router.get('/dashboard/:userId', userController.getDashboardData);
router.get('/transactions/:userId', userController.getTransactions);
router.get('/teamhierarchy', userController.getTeamHierarchy);



module.exports = router;
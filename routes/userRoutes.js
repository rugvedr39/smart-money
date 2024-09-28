const express = require('express');
const { registerUser,getUserDashboard ,loginUser,getTeamHierarchy,getUserbyUsername,getUserbyIdforIsApproved} = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);
router.get('/user/:userId', getUserDashboard);
router.post('/login', loginUser);
router.get('/team/:userId', getTeamHierarchy);
router.get('/getUserbyUsername/:sponserId', getUserbyUsername);
router.get('/getUserbyIdforIsApproved/:id', getUserbyIdforIsApproved);

module.exports = router;

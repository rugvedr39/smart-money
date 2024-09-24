const express = require('express');
const { registerUser,getUserDashboard ,loginUser,getTeamHierarchy} = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);
router.get('/user/:userId', getUserDashboard);
router.post('/login', loginUser);
router.get('/team/:userId', getTeamHierarchy);

module.exports = router;

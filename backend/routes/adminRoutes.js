const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.get('/analytics', auth, adminMiddleware, adminController.getAnalytics);

module.exports = router;
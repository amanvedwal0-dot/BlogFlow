const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const { auth } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// All help routes require user to be registered and authenticated
router.use(auth);

// Registered users submit a message
router.post('/messages', helpController.createHelpMessage);

// Admin-only routes to view and resolve help messages
router.get('/messages', adminMiddleware, helpController.getHelpMessages);
router.patch('/messages/:id/resolve', adminMiddleware, helpController.resolveHelpMessage);

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, notificationController.getNotifications);
// IMPORTANT: static route must come before the dynamic /:id route
router.patch('/mark-all-read', auth, notificationController.markAllRead);
router.patch('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
// User Routes
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/:id', auth, userController.getUser);
router.put('/:id', auth, userController.updateUser);
router.post('/:id/follow', auth, userController.followUser);
router.post('/:id/unfollow', auth, userController.unfollowUser);
router.patch('/:id/theme', auth, userController.setTheme);

module.exports = router;

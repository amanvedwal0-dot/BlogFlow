const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { auth } = require('../middleware/auth');

router.post('/', auth, bookmarkController.addBookmark);
router.delete('/', auth, bookmarkController.removeBookmark);
router.get('/', auth, bookmarkController.getBookmarks);

module.exports = router;
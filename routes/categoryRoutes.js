const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.post('/', auth, adminMiddleware, categoryController.createCategory);
router.get('/', categoryController.getCategories);

module.exports = router;
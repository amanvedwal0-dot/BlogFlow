// Post Routes
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const likeController = require('../controllers/likeController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Post routes
router.post('/create', auth, upload.single('image'), postController.createPost);
router.put('/:id', auth, upload.single('image'), postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.get('/', postController.getAllPosts);
router.get('/search', postController.searchBlogs);
router.get('/:id', postController.getPostById);

// Comment routes
router.post('/:postId/comments', auth, commentController.createComment);
router.get('/:postId/comments', commentController.getComments);

// Like routes
router.post('/:postId/likes', auth, likeController.likePost);
router.post('/:postId/unlike', auth, likeController.unlikePost);

module.exports = router;

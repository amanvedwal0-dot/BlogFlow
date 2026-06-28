const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

exports.createComment = async (req, res) => {
  try {
    const { body } = req.body;
    const postId = req.params.postId;
    if (!body) {
      return res.status(400).json({ success: false, message: 'Comment body is required' });
    }

    const post = await Post.findById(postId).populate('author');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user.userId,
      body,
    });

    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    if (post.author && post.author._id.toString() !== req.user.userId) {
      await Notification.create({
        recipient: post.author._id,
        sender: req.user.userId,
        post: postId,
        type: 'comment',
        message: `${req.user.name} commented on your post.`,
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error while creating comment', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'name profilePic')
      .sort({ createdAt: -1 });

    res.json({ success: true, comments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load comments', error: error.message });
  }
};
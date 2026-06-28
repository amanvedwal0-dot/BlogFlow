const Post = require('../models/Post');
const Like = require('../models/Like');
const Notification = require('../models/Notification');

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.userId;

    const existingLike = await Like.findOne({ post: postId, user: userId });
    if (existingLike) {
      return res.status(400).json({ success: false, message: 'Already liked' });
    }

    const post = await Post.findById(postId).populate('author');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const like = await Like.create({ post: postId, user: userId });
    await Post.findByIdAndUpdate(postId, { $push: { likes: like._id } });

    if (post.author && post.author._id.toString() !== userId) {
      await Notification.create({
        recipient: post.author._id,
        sender: userId,
        post: postId,
        type: 'like',
        message: `${req.user.name} liked your post.`,
      });
    }

    res.status(201).json({ success: true, like });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Error while liking post', error: error.message });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.userId;

    const deletedLike = await Like.findOneAndDelete({ post: postId, user: userId });
    if (!deletedLike) {
      return res.status(404).json({ success: false, message: 'Like not found' });
    }

    const updatedPost = await Post.findByIdAndUpdate(postId,
      { $pull: { likes: deletedLike._id } },
      { new: true }
    );

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Error while unliking post', error: error.message });
  }
};



const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.addBookmark = async (req, res) => {
  try {
    const { post } = req.body;
    const userId = req.user.userId;
    if (!post) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    const existing = await Bookmark.findOne({ post, user: userId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already bookmarked' });
    }

    const savedBookmark = await Bookmark.create({ post, user: userId });
    const targetPost = await Post.findById(post).populate('author');

    if (targetPost?.author && targetPost.author._id.toString() !== userId) {
      await Notification.create({
        recipient: targetPost.author._id,
        sender: userId,
        post,
        type: 'bookmark',
        message: `${req.user.name} bookmarked your post.`,
      });
    }

    res.status(201).json({ success: true, bookmark: savedBookmark });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to add bookmark', error: error.message });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    const { post } = req.body;
    const userId = req.user.userId;
    if (!post) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    await Bookmark.findOneAndDelete({ post, user: userId });
    res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to remove bookmark', error: error.message });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.userId }).populate({
      path: 'post',
      populate: [{ path: 'author', select: 'name profilePic' }, { path: 'category' }]
    });
    res.json({ success: true, bookmarks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load bookmarks', error: error.message });
  }
};

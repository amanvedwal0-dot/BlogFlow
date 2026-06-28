const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Category = require('../models/Category');

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalLikes = await Like.countDocuments();
    const totalCategories = await Category.countDocuments();

    const topCategories = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topPosts = await Post.aggregate([
      { $project: { title: 1, likesCount: { $size: '$likes' } } },
      { $sort: { likesCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalPosts,
        totalComments,
        totalLikes,
        totalCategories,
        topCategories,
        topPosts,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load analytics', error: error.message });
  }
};
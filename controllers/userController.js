const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name profilePic')
      .populate('following', 'name profilePic');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load user', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    delete updateData.role;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update user', error: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.followers.includes(currentUserId)) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    targetUser.followers.push(currentUserId);
    currentUser.following.push(targetUserId);
    await targetUser.save();
    await currentUser.save();

    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
      message: `${req.user.name} started following you.`,
    });

    res.json({ success: true, message: 'Followed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to follow user', error: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot unfollow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId);
    currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUserId);
    await targetUser.save();
    await currentUser.save();

    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to unfollow user', error: error.message });
  }
};

exports.setTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ success: false, message: 'Theme must be light or dark' });
    }

    const user = await User.findByIdAndUpdate(req.user.userId, { theme }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update theme', error: error.message });
  }
};

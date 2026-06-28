const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .populate('sender', 'name profilePic')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load notifications', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update notification', error: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.userId, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update notifications', error: error.message });
  }
};

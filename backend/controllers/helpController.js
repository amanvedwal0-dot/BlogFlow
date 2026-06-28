const HelpMessage = require('../models/HelpMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.createHelpMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const helpMsg = await HelpMessage.create({
      user: req.user.userId,
      subject,
      message,
    });

    // Notify all admin users about the new support request
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        recipient: admin._id,
        sender: req.user.userId,
        type: 'admin',
        message: `New support request: "${subject}" — submitted by a user. Please review in the Help Desk.`,
      }));
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({
      success: true,
      message: 'Help request submitted successfully. Our admin team will look into it!',
      helpMsg,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to submit help request', error: error.message });
  }
};

exports.getHelpMessages = async (req, res) => {
  try {
    const helpMessages = await HelpMessage.find()
      .populate('user', 'name email role profilePic')
      .sort({ createdAt: -1 });

    res.json({ success: true, helpMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load help messages', error: error.message });
  }
};

exports.resolveHelpMessage = async (req, res) => {
  try {
    const helpMsg = await HelpMessage.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    if (!helpMsg) {
      return res.status(404).json({ success: false, message: 'Help message not found' });
    }

    // Create a notification for the user who submitted the support request
    await Notification.create({
      recipient: helpMsg.user,
      sender: req.user.userId, // Admin ID
      type: 'admin',
      message: `Your support request regarding "${helpMsg.subject}" has been marked as resolved by the admin.`,
    });

    res.json({ success: true, message: 'Request marked as resolved and notification sent to user', helpMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to resolve help request', error: error.message });
  }
};

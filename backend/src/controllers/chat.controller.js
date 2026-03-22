import Message from '../models/chat.model.js';
import User from '../models/auth.model.js';

// Get all conversations for the logged-in user (with last message + unread count)
const getConversations = async (req, res, next) => {
  try {
    const me = req.user._id;

    // Get all unique user IDs this user has chatted with
    const sentTo = await Message.distinct('receiver', { sender: me });
    const receivedFrom = await Message.distinct('sender', { receiver: me });

    // Merge unique partner IDs
    const partnerSet = new Set([
      ...sentTo.map(id => id.toString()),
      ...receivedFrom.map(id => id.toString()),
    ]);
    const partnerIds = [...partnerSet];

    // Build conversation objects
    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        // Last message between us
        const lastMessage = await Message.findOne({
          $or: [
            { sender: me, receiver: partnerId },
            { sender: partnerId, receiver: me },
          ],
        }).sort({ createdAt: -1 });

        // Unread count (messages FROM partner that I haven't read)
        const unreadCount = await Message.countDocuments({
          sender: partnerId,
          receiver: me,
          isRead: false,
        });

        // Partner info
        const partner = await User.findById(partnerId).select('name email role').lean();

        return {
          partnerId,
          partnerName: partner?.name || partner?.email || 'Unknown User',
          partnerRole: partner?.role || 'user',
          lastMessage: lastMessage ? {
            _id: lastMessage._id,
            content: lastMessage.content,
            sender: lastMessage.sender,
            createdAt: lastMessage.createdAt,
          } : null,
          unreadCount,
        };
      })
    );

    // Sort by last message time (newest first)
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return new Date(bTime) - new Date(aTime);
    });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params; // The person you are chatting with
    const me = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: me, receiver: userId },
        { sender: userId, receiver: me }
      ]
    }).sort({ createdAt: 1 }).populate('replyTo');

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const markMessagesAsRead = async (req, res, next) => {
  try {
    const { senderId } = req.body;
    await Message.updateMany(
      { sender: senderId, receiver: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

export { getConversations, getChatHistory, markMessagesAsRead };

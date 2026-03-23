const { createMessage, getConversation, getConversationsForUser } = require('../models/messageModel');

async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const conversations = await getConversationsForUser(userId);
    return res.json({ conversations });
  } catch (err) {
    return next(err);
  }
}

async function getConversationWithUser(req, res, next) {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.params;

    const messages = await getConversation(userId, parseInt(otherUserId));
    return res.json({ messages });
  } catch (err) {
    return next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message || message.trim().length === 0) {
      return res.status(400).json({ message: 'receiverId and message are required' });
    }

    const newMessage = await createMessage({
      senderId,
      receiverId,
      message: message.trim(),
    });

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getConversations,
  getConversationWithUser,
  sendMessage,
};


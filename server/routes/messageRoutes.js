const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getConversations,
  getConversationWithUser,
  sendMessage,
} = require('../controllers/messageController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/messages/conversations
router.get('/conversations', getConversations);

// GET /api/messages/with/:userId
router.get('/with/:userId', getConversationWithUser);

// POST /api/messages
router.post(
  '/',
  [
    body('receiverId').isInt().withMessage('receiverId must be an integer'),
    body('message').trim().notEmpty().withMessage('message is required'),
  ],
  validate,
  sendMessage
);

module.exports = router;


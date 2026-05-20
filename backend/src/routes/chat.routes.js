const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

router.post('/ensure', protect, chatController.ensureChat);
router.get('/', protect, chatController.listMyChats);
router.post('/send', protect, chatController.sendMessage);
router.get('/:chatId/messages', protect, chatController.getMessages);

module.exports = router;
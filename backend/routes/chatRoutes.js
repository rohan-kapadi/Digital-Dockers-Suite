const express = require('express');
const router = express.Router();
const { getChatHistory, getChannelMessages, saveMessage, editMessage, deleteMessage } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/history/:room', protect, getChatHistory);
router.get('/channel/:channelId', protect, getChannelMessages);
router.post('/', protect, saveMessage);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;

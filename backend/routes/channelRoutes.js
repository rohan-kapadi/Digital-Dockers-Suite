const express = require('express');
const router = express.Router();
const {
    createChannel,
    getChannels,
    getChannelById,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
    addMembers,
    getOrCreateDirectChannel
} = require('../controllers/channelController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createChannel).get(protect, getChannels);
router.route('/:id').get(protect, getChannelById).put(protect, updateChannel).delete(protect, deleteChannel);
router.post('/:id/join', protect, joinChannel);
router.post('/:id/leave', protect, leaveChannel);
router.post('/:id/members', protect, addMembers);
router.post('/direct/:userId', protect, getOrCreateDirectChannel);

module.exports = router;

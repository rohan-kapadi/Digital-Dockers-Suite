const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Get Chat History
// @route   GET /api/chat/history/:room
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
    const { room } = req.params;

    const messages = await Message.find({ room, isDeleted: { $ne: true } })
        .populate('sender', 'fullName email profileInfo')
        .sort({ createdAt: 1 });
    res.status(200).json(messages);
});

// @desc    Get Chat History by Channel ID
// @route   GET /api/chat/channel/:channelId
// @access  Private
const getChannelMessages = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const messages = await Message.find({ channel: channelId, isDeleted: { $ne: true } })
        .populate('sender', 'fullName email profileInfo')
        .sort({ createdAt: 1 });
    res.status(200).json(messages);
});

// @desc    Save Chat Message
// @route   POST /api/chat
// @access  Private
const saveMessage = asyncHandler(async (req, res) => {
    const { message, room, recipient, channel } = req.body;

    if (!message || !message.trim()) {
        res.status(400);
        throw new Error('Message is required');
    }

    const newMessage = await Message.create({
        message: message.trim(),
        room: room || 'general',
        channel: channel || null,
        recipient: recipient || null,
        sender: req.user._id
    });

    await newMessage.populate('sender', 'fullName email profileInfo');

    res.status(201).json(newMessage);
});

// @desc    Edit a message
// @route   PUT /api/chat/:id
// @access  Private (sender only)
const editMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        res.status(400);
        throw new Error('Message content is required');
    }

    const existingMessage = await Message.findById(req.params.id);

    if (!existingMessage) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (existingMessage.sender.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You can only edit your own messages');
    }

    existingMessage.message = message.trim();
    existingMessage.isEdited = true;
    existingMessage.editedAt = new Date();
    await existingMessage.save();

    await existingMessage.populate('sender', 'fullName email profileInfo');

    // Broadcast edit via socket
    const io = req.app.get('io');
    if (io) {
        const roomId = existingMessage.channel 
            ? `channel_${existingMessage.channel}` 
            : existingMessage.room;
        io.to(roomId).emit('message_edited', existingMessage);
    }

    res.status(200).json(existingMessage);
});

// @desc    Delete a message (soft delete)
// @route   DELETE /api/chat/:id
// @access  Private (sender only)
const deleteMessage = asyncHandler(async (req, res) => {
    const existingMessage = await Message.findById(req.params.id);

    if (!existingMessage) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (existingMessage.sender.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You can only delete your own messages');
    }

    existingMessage.isDeleted = true;
    await existingMessage.save();

    // Broadcast delete via socket
    const io = req.app.get('io');
    if (io) {
        const roomId = existingMessage.channel 
            ? `channel_${existingMessage.channel}` 
            : existingMessage.room;
        io.to(roomId).emit('message_deleted', { messageId: existingMessage._id, room: roomId });
    }

    res.status(200).json({ message: 'Message deleted' });
});

module.exports = {
    getChatHistory,
    getChannelMessages,
    saveMessage,
    editMessage,
    deleteMessage
};

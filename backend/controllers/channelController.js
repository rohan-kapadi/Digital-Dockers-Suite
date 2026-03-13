const asyncHandler = require('express-async-handler');
const Channel = require('../models/Channel');
const User = require('../models/User');

// @desc    Create a new channel
// @route   POST /api/channels
// @access  Private
const createChannel = asyncHandler(async (req, res) => {
    const { name, description, type, members } = req.body;

    if (!name || !name.trim()) {
        res.status(400);
        throw new Error('Channel name is required');
    }

    // Check for duplicate channel name (for non-direct channels)
    if (type !== 'direct') {
        const existing = await Channel.findOne({ name: name.trim().toLowerCase().replace(/\s+/g, '-'), type: { $ne: 'direct' } });
        if (existing) {
            res.status(400);
            throw new Error('A channel with this name already exists');
        }
    }

    const channelMembers = members ? [...new Set([req.user._id.toString(), ...members])] : [req.user._id];

    const channel = await Channel.create({
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description || '',
        type: type || 'public',
        members: channelMembers,
        creator: req.user._id
    });

    await channel.populate('members', 'fullName email profileInfo');
    await channel.populate('creator', 'fullName email');

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
        channelMembers.forEach(memberId => {
            io.to(memberId.toString()).emit('channel_created', channel);
        });
    }

    res.status(201).json(channel);
});

// @desc    Get all channels for current user
// @route   GET /api/channels
// @access  Private
const getChannels = asyncHandler(async (req, res) => {
    const channels = await Channel.find({
        $or: [
            { type: 'public' },
            { members: req.user._id }
        ]
    })
    .populate('members', 'fullName email profileInfo')
    .populate('creator', 'fullName email')
    .sort({ updatedAt: -1 });

    res.status(200).json(channels);
});

// @desc    Get channel by ID
// @route   GET /api/channels/:id
// @access  Private
const getChannelById = asyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id)
        .populate('members', 'fullName email profileInfo')
        .populate('creator', 'fullName email');

    if (!channel) {
        res.status(404);
        throw new Error('Channel not found');
    }

    res.status(200).json(channel);
});

// @desc    Update channel
// @route   PUT /api/channels/:id
// @access  Private
const updateChannel = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
        res.status(404);
        throw new Error('Channel not found');
    }

    if (name) channel.name = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (description !== undefined) channel.description = description;

    await channel.save();
    await channel.populate('members', 'fullName email profileInfo');
    await channel.populate('creator', 'fullName email');

    const io = req.app.get('io');
    if (io) {
        io.to(`channel_${channel._id}`).emit('channel_updated', channel);
    }

    res.status(200).json(channel);
});

// @desc    Delete channel
// @route   DELETE /api/channels/:id
// @access  Private (creator only)
const deleteChannel = asyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
        res.status(404);
        throw new Error('Channel not found');
    }

    if (channel.creator.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only the channel creator can delete this channel');
    }

    await Channel.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
        io.to(`channel_${channel._id}`).emit('channel_deleted', { channelId: channel._id });
    }

    res.status(200).json({ message: 'Channel deleted' });
});

// @desc    Join a channel
// @route   POST /api/channels/:id/join
// @access  Private
const joinChannel = asyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
        res.status(404);
        throw new Error('Channel not found');
    }

    if (channel.type === 'private' && !channel.members.includes(req.user._id)) {
        res.status(403);
        throw new Error('This is a private channel. You need an invite to join.');
    }

    if (!channel.members.includes(req.user._id)) {
        channel.members.push(req.user._id);
        await channel.save();
    }

    await channel.populate('members', 'fullName email profileInfo');
    res.status(200).json(channel);
});

// @desc    Leave a channel
// @route   POST /api/channels/:id/leave
// @access  Private
const leaveChannel = asyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
        res.status(404);
        throw new Error('Channel not found');
    }

    channel.members = channel.members.filter(m => m.toString() !== req.user._id.toString());
    await channel.save();

    res.status(200).json({ message: 'Left channel' });
});

// @desc    Add members to a channel
// @route   POST /api/channels/:id/members
// @access  Private
const addMembers = asyncHandler(async (req, res) => {
    const { memberIds } = req.body;
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
        res.status(404);
        throw new Error('Channel not found');
    }

    if (memberIds && Array.isArray(memberIds)) {
        const newMembers = memberIds.filter(id => !channel.members.map(m => m.toString()).includes(id));
        channel.members.push(...newMembers);
        await channel.save();
    }

    await channel.populate('members', 'fullName email profileInfo');
    res.status(200).json(channel);
});

// @desc    Get or create a direct message channel with another user
// @route   POST /api/channels/direct/:userId
// @access  Private
const getOrCreateDirectChannel = asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
        res.status(400);
        throw new Error('Cannot create a direct message with yourself');
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        res.status(404);
        throw new Error('User not found');
    }

    // Find existing DM channel with exactly these two members
    let channel = await Channel.findOne({
        type: 'direct',
        members: { $all: [currentUserId, targetUserId], $size: 2 }
    })
    .populate('members', 'fullName email profileInfo')
    .populate('creator', 'fullName email');

    if (!channel) {
        // Create new DM channel
        const channelName = `dm-${Math.min(currentUserId, targetUserId)}-${Math.max(currentUserId, targetUserId)}`;
        
        channel = await Channel.create({
            name: channelName,
            type: 'direct',
            members: [currentUserId, targetUserId],
            creator: currentUserId
        });

        await channel.populate('members', 'fullName email profileInfo');
        await channel.populate('creator', 'fullName email');

        // Notify both users via socket
        const io = req.app.get('io');
        if (io) {
            [currentUserId, targetUserId].forEach(memberId => {
                io.to(memberId).emit('channel_created', channel);
            });
        }
    }

    res.status(200).json(channel);
});

module.exports = {
    createChannel,
    getChannels,
    getChannelById,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
    addMembers,
    getOrCreateDirectChannel
};

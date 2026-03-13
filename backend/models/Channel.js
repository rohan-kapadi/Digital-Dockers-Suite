const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['public', 'private', 'direct'],
        default: 'public'
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Ensure unique channel names (except for direct message channels)
channelSchema.index({ name: 1, type: 1 }, { 
    unique: true, 
    partialFilterExpression: { type: { $ne: 'direct' } } 
});

module.exports = mongoose.model('Channel', channelSchema);

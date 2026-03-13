const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    room: {
        type: String,
        index: true,
        default: 'general'
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        default: null,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    message: {
        type: String,
        required: true
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);

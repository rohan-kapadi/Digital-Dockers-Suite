const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const Channel = require('./models/Channel');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all messages that don't have a channel set
    const oldMessages = await Message.find({ channel: null });
    console.log(`Found ${oldMessages.length} old messages without a channel.`);

    if (oldMessages.length === 0) {
        console.log('No messages to migrate.');
        process.exit(0);
    }
    
    // Attempt to find the "general" channel
    let generalChannel = await Channel.findOne({ name: 'general' });
    
    // If no general channel exists, create one
    if (!generalChannel) {
        console.log('General channel does not exist, creating one...');
        
        // Find an admin or any user to be the creator
        const creator = await User.findOne({ role: 'admin' }) || await User.findOne();
        
        if (!creator) {
            console.log('CRITICAL: No users found in database to set as channel creator.');
            process.exit(1);
        }

        // Get all users to add them as members to 'general'
        const allUsers = await User.find({}, '_id');

        generalChannel = await Channel.create({
            name: 'general',
            description: 'Company-wide general chat',
            type: 'public',
            creator: creator._id,
            members: allUsers.map(u => u._id)
        });
        
        console.log(`Created general channel with ID: ${generalChannel._id}`);
    } else {
        console.log(`Using existing channel: ${generalChannel.name} (${generalChannel._id}) for migration.`);
    }
    
    // Migrate all messages that were in the "general" room
    const result = await Message.updateMany(
        { channel: null, room: 'general' },
        { $set: { channel: generalChannel._id } }
    );
    console.log(`Migrated ${result.modifiedCount} messages from 'general' room.`);

    // Migrate any remaining legacy DMs to general channel to avoid data loss
    const remainingResult = await Message.updateMany(
        { channel: null },
        { $set: { channel: generalChannel._id } }
    );
    console.log(`Migrated ${remainingResult.modifiedCount} remaining legacy messages into the general channel.`);
    
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

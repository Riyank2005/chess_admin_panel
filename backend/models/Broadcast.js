import mongoose from 'mongoose';

const broadcastSchema = mongoose.Schema({
    sender: {
        type: String,
        required: true,
        default: 'System'
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['emergency', 'announcement', 'maintenance', 'neutral'],
        default: 'neutral'
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

export default Broadcast;

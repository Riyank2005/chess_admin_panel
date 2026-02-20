import mongoose from 'mongoose';

const friendRequestSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export default FriendRequest;

import mongoose from 'mongoose';

const userManagementSchema = mongoose.Schema({
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    username: String,
    status: {
        type: String,
        enum: ['ACTIVE', 'BANNED', 'SUSPENDED', 'WARNED'],
        default: 'ACTIVE'
    },
    reason: String,
    banExpires: Date,
    warnings: {
        type: Number,
        default: 0
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    notes: String
}, {
    timestamps: true
});

const UserManagement = mongoose.model('UserManagement', userManagementSchema);
export default UserManagement;

import mongoose from 'mongoose';

const apiKeySchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    name: String,
    key: {
        type: String,
        unique: true,
        required: true
    },
    secret: String,
    permissions: [String],
    active: {
        type: Boolean,
        default: true
    },
    lastUsed: Date,
    expiresAt: Date
}, {
    timestamps: true
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;

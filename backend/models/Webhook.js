import mongoose from 'mongoose';

const webhookSchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    events: [String], // ['USER_BAN', 'GAME_FLAGGED', etc]
    active: {
        type: Boolean,
        default: true
    },
    secret: String,
    lastTriggered: Date,
    failureCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Webhook = mongoose.model('Webhook', webhookSchema);
export default Webhook;

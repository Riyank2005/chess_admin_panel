import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    type: {
        type: String,
        enum: ['ALERT', 'INFO', 'WARNING', 'ERROR', 'SUCCESS'],
        default: 'INFO'
    },
    title: String,
    message: String,
    read: {
        type: Boolean,
        default: false
    },
    actionUrl: String,
    emailSent: {
        type: Boolean,
        default: false
    },
    smsSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

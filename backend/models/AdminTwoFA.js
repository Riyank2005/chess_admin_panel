import mongoose from 'mongoose';

const adminTwoFASchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    secret: String,
    enabled: {
        type: Boolean,
        default: false
    },
    backupCodes: [String],
    lastUsed: Date
}, {
    timestamps: true
});

const AdminTwoFA = mongoose.model('AdminTwoFA', adminTwoFASchema);
export default AdminTwoFA;

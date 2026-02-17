import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    clearanceLevel: {
        type: String,
        enum: ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT'],
        default: 'MODERATOR'
    },
    loginOtp: { type: String },
    loginOtpExpires: { type: Date },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorBackupCodes: [{ type: String }],
    lastLogin: {
        type: Date
    }
    , notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        critical: { type: Boolean, default: true },
        warning: { type: Boolean, default: true },
        info: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

adminSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;

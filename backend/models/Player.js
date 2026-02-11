import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const playerSchema = mongoose.Schema({
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
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    elo: {
        type: Number,
        default: 1200
    },
    games: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'banned', 'inactive'],
        default: 'active'
    },
    isShadowBanned: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: { type: String },
    otpExpires: { type: Date },
    loginOtp: { type: String },
    loginOtpExpires: { type: Date },
    lastIp: { type: String },
    city: { type: String },
    country: { type: String },
    coordinates: {
        lat: { type: Number },
        lon: { type: Number }
    },
    fairPlayRiskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    averageAccuracy: {
        type: Number,
        default: 0
    },
    lastLogin: { type: Date }
}, {
    timestamps: true
});

playerSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

playerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Player = mongoose.model('Player', playerSchema);
export default Player;

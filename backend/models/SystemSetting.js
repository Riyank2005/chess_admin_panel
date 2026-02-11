import mongoose from 'mongoose';

const systemSettingSchema = mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: String,
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

export default SystemSetting;

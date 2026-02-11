import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['BAN', 'UNBAN', 'SHADOW_BAN', 'DELETE_USER', 'SYSTEM_KILLSWITCH', 'BROADCAST', 'GAME_TERMINATED', 'SETTINGS_UPDATE']
    },
    target: {
        type: String, // ID of the user, game, or setting changed
        required: true
    },
    details: {
        type: String
    },
    complianceRef: {
        type: String // Link to policy or case number
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

import mongoose from 'mongoose';

const scheduledTaskSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    taskType: {
        type: String,
        enum: ['CLEANUP', 'RESET', 'BACKUP', 'MAINTENANCE', 'REPORT'],
        required: true
    },
    schedule: String, // cron format
    enabled: {
        type: Boolean,
        default: true
    },
    lastRun: Date,
    nextRun: Date,
    status: {
        type: String,
        enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    config: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

const ScheduledTask = mongoose.model('ScheduledTask', scheduledTaskSchema);
export default ScheduledTask;

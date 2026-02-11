import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
    try {
        const { read, page = 1, limit = 20 } = req.query;
        const query = { adminId: req.user._id };
        if (read !== undefined) query.read = read === 'true';

        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            Notification.countDocuments(query)
        ]);

        res.json({
            notifications,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body;
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notification.findByIdAndDelete(notificationId);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createNotification = async (adminId, type, title, message, actionUrl = null) => {
    try {
        return await Notification.create({
            adminId,
            type,
            title,
            message,
            actionUrl
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export const bulkRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        await Notification.updateMany({ _id: { $in: notificationIds } }, { read: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bulkDelete = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        await Notification.deleteMany({ _id: { $in: notificationIds } });
        res.json({ message: 'Deleted notifications' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import Admin from '../models/Admin.js';

export const updatePreferences = async (req, res) => {
    try {
        const prefs = req.body;
        const updated = await Admin.findByIdAndUpdate(req.user._id, { notificationPreferences: prefs }, { new: true });
        res.json({ preferences: updated.notificationPreferences });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const pushNotification = async (req, res) => {
    try {
        const { title, message, priority = 'INFO' } = req.body;
        // Persist notification for admin
        const note = await Notification.create({ adminId: req.user._id, type: priority.toUpperCase(), title, message });
        // In a real system we'd send push/email/SMS here based on preferences
        res.json({ message: 'Push queued', notification: note });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

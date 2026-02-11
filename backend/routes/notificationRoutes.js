import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    markAsRead,
    deleteNotification
} from '../controllers/notificationController.js';
import { bulkRead, bulkDelete, updatePreferences, pushNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/read', protect, markAsRead);
router.delete('/:notificationId', protect, deleteNotification);
router.post('/bulk-read', protect, bulkRead);
router.post('/bulk-delete', protect, bulkDelete);
router.put('/preferences', protect, updatePreferences);
router.post('/push', protect, pushNotification);

export default router;

import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getScheduledTasks,
    createTask,
    updateTask,
    executeTask
} from '../controllers/taskController.js';

const router = express.Router();

router.get('/', protect, admin, getScheduledTasks);
router.post('/', protect, admin, createTask);
router.put('/:taskId', protect, admin, updateTask);
router.post('/:taskId/execute', protect, admin, executeTask);

export default router;

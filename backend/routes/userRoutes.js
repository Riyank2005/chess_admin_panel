import express from 'express';
import { getUsers, updateUserStatus, deleteUser, bulkUserOperations, exportUsers } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, bulkUserOperations); // Bulk operations

router.route('/export')
    .get(protect, admin, exportUsers);

router.route('/:id/status')
    .patch(protect, admin, updateUserStatus);

router.route('/:id')
    .delete(protect, admin, deleteUser);

export default router;

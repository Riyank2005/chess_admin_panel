import express from 'express';
import {
    createReport,
    getMyReports,
    submitAppeal,
    getAllReports
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Protect all report routes

router.route('/')
    .post(createReport)
    .get(getAllReports); // Note: Admin check should ideally be here if used by admins

router.get('/my-reports', getMyReports);
router.put('/:id/appeal', submitAppeal);

export default router;

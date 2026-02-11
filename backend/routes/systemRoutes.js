import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getSettings, updateSetting, getSettingByKey, seedUsers } from '../controllers/systemController.js';
import { getActiveBroadcast, createBroadcast, shutdownBroadcast } from '../controllers/broadcastController.js';

import { getSystemStats } from '../controllers/statsController.js';
import { getSystemHealth } from '../controllers/systemHealthController.js';

const router = express.Router();

router.route('/stats').get(getSystemStats);
router.route('/health').get(getSystemHealth);

router.route('/seed').post(seedUsers); // Temporarily public for debugging

router.route('/')
    .get(getSettings)
    .post(updateSetting);

router.route('/broadcast')
    .get(getActiveBroadcast)
    .post(createBroadcast);

router.route('/broadcast/shutdown')
    .post(shutdownBroadcast);

router.route('/:key')
    .get(getSettingByKey);

export default router;

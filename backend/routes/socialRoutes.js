import express from 'express';
import {
    sendFriendRequest,
    respondToRequest,
    getSocialInfo,
    toggleBlockUser,
    searchPlayers
} from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/info', getSocialInfo);
router.post('/request', sendFriendRequest);
router.put('/respond', respondToRequest);
router.put('/block', toggleBlockUser);
router.get('/search', searchPlayers);

export default router;

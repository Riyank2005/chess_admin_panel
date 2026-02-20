import Player from '../models/Player.js';
import FriendRequest from '../models/FriendRequest.js';

// @desc    Send a friend request
// @route   POST /api/social/request
// @access  Private
export const sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;

        if (req.user._id.toString() === receiverId) {
            return res.status(400).json({ message: "You cannot add yourself" });
        }

        const existingRequest = await FriendRequest.findOne({
            sender: req.user._id,
            receiver: receiverId,
            status: 'PENDING'
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Request already pending" });
        }

        const request = await FriendRequest.create({
            sender: req.user._id,
            receiver: receiverId
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Respond to friend request
// @route   PUT /api/social/respond
// @access  Private
export const respondToRequest = async (req, res) => {
    try {
        const { requestId, status } = req.body; // status: 'ACCEPTED' or 'REJECTED'

        const request = await FriendRequest.findById(requestId);

        if (!request || request.receiver.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = status;
        await request.save();

        if (status === 'ACCEPTED') {
            await Player.findByIdAndUpdate(req.user._id, { $addToSet: { friends: request.sender } });
            await Player.findByIdAndUpdate(request.sender, { $addToSet: { friends: req.user._id } });
        }

        res.json({ message: `Request ${status.toLowerCase()}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get friends and requests
// @route   GET /api/social/info
// @access  Private
export const getSocialInfo = async (req, res) => {
    try {
        const player = await Player.findById(req.user._id)
            .populate('friends', 'username elo status avatar')
            .populate('blockedUsers', 'username');

        const pendingRequests = await FriendRequest.find({
            receiver: req.user._id,
            status: 'PENDING'
        }).populate('sender', 'username elo avatar');

        res.json({
            friends: player.friends,
            pendingRequests,
            blockedUsers: player.blockedUsers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Block / Unblock user
// @route   PUT /api/social/block
// @access  Private
export const toggleBlockUser = async (req, res) => {
    try {
        const { targetId } = req.body;
        const player = await Player.findById(req.user._id);

        const isBlocked = player.blockedUsers.includes(targetId);

        if (isBlocked) {
            player.blockedUsers.pull(targetId);
        } else {
            player.blockedUsers.push(targetId);
            // Also remove from friends if blocked
            player.friends.pull(targetId);
            await Player.findByIdAndUpdate(targetId, { $pull: { friends: req.user._id } });
        }

        await player.save();
        res.json({ message: isBlocked ? "User unblocked" : "User blocked" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search for players to add
// @route   GET /api/social/search
// @access  Private
export const searchPlayers = async (req, res) => {
    try {
        const { query } = req.query;
        const players = await Player.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username elo avatar status').limit(10);

        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

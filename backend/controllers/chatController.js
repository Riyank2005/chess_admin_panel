import ChatMessage from '../models/ChatMessage.js';

// @desc    Get DM history with another player
// @route   GET /api/chat/dms/:otherPlayerId
// @access  Private
export const getDMHistory = async (req, res) => {
    try {
        const messages = await ChatMessage.find({
            $or: [
                { sender: req.user._id, receiver: req.params.otherPlayerId },
                { sender: req.params.otherPlayerId, receiver: req.user._id }
            ],
            gameId: { $exists: false }
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get In-Game chat history
// @route   GET /api/chat/game/:gameId
// @access  Private
export const getGameChatHistory = async (req, res) => {
    try {
        const messages = await ChatMessage.find({ gameId: req.params.gameId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message (Internal use by Socket, but also API ready)
export const saveMessage = async (data) => {
    try {
        const { senderId, receiverId, gameId, message } = data;
        const chatMsg = await ChatMessage.create({
            sender: senderId,
            receiver: receiverId,
            gameId,
            message
        });
        return chatMsg;
    } catch (error) {
        console.error("Save message error:", error);
    }
};

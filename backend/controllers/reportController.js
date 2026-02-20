import Report from '../models/Report.js';
import Player from '../models/Player.js';

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
    try {
        const { reportedId, reason, evidence, gameId } = req.body;

        const report = await Report.create({
            reporter: req.user._id,
            reported: reportedId,
            reason,
            evidence,
            gameId
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reports for the current player (as reporter or reported)
// @route   GET /api/reports/my-reports
// @access  Private
export const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({
            $or: [
                { reporter: req.user._id },
                { reported: req.user._id }
            ]
        })
            .populate('reported', 'username elo')
            .populate('reporter', 'username elo')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit an appeal for a report
// @route   PUT /api/reports/:id/appeal
// @access  Private
export const submitAppeal = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.reported.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only appeal reports filed against you' });
        }

        report.appeal = {
            description: req.body.description,
            status: 'PENDING',
            date: new Date()
        };

        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({})
            .populate('reporter', 'username email')
            .populate('reported', 'username email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import os from 'os';
import osUtils from 'os-utils';

// @desc    Get real-time system health metrics
// @route   GET /api/system/health
export const getSystemHealth = async (req, res) => {
    try {
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const memPercentage = ((usedMem / totalMem) * 100).toFixed(2);

        osUtils.cpuUsage((v) => {
            res.json({
                cpu: (v * 100).toFixed(2),
                memory: {
                    free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    percentage: memPercentage
                },
                uptime: {
                    system: os.uptime(),
                    process: process.uptime()
                },
                platform: os.platform(),
                arch: os.arch(),
                loadAvg: os.loadavg()
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

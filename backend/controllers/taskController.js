import ScheduledTask from '../models/ScheduledTask.js';

export const getScheduledTasks = async (req, res) => {
    try {
        const tasks = await ScheduledTask.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createTask = async (req, res) => {
    try {
        const { name, description, taskType, schedule, config } = req.body;
        
        const task = await ScheduledTask.create({
            name,
            description,
            taskType,
            schedule,
            config,
            nextRun: new Date(Date.now() + 60000)
        });

        res.json({ message: 'Task created', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { enabled, schedule, config } = req.body;

        const task = await ScheduledTask.findByIdAndUpdate(
            taskId,
            { enabled, schedule, config },
            { new: true }
        );

        res.json({ message: 'Task updated', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const executeTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await ScheduledTask.findByIdAndUpdate(
            taskId,
            { status: 'RUNNING', lastRun: new Date() },
            { new: true }
        );

        // Simulate task execution
        setTimeout(async () => {
            await ScheduledTask.findByIdAndUpdate(taskId, { status: 'COMPLETED' });
        }, 2000);

        res.json({ message: 'Task started', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

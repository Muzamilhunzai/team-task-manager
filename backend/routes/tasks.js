import express from 'express';
import { ensureAuthenticated, isAdmin } from '../middleware/auth.js';
import { validateTask } from '../middleware/validation.js';
import { createTask, getTasksByTeam, getTasksByAssignee, getAllUserTasks, updateTask, deleteTask, updateTaskStatus, getTaskReminders } from '../models/task.js';
import { getTeamById } from '../models/team.js';

const router = express.Router();

router.use(ensureAuthenticated);

// Get task reminders
router.get('/reminders', async (req, res) => {
    try {
        const reminders = await getTaskReminders(req.user.id);
        res.json(reminders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Get tasks with filters
router.get('/', async (req, res) => {
    const { teamId, assigneeId } = req.query;
    try {
        let tasks;
        if (teamId) {
            tasks = await getTasksByTeam(teamId, req.user);
        } else if (assigneeId) {
            tasks = await getTasksByAssignee(assigneeId, req.user);
        } else {
            tasks = await getAllUserTasks(req.user);
        }
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create task - Admin only
router.post('/', isAdmin, async (req, res) => {
    const { error } = validateTask(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    try {
        const team = await getTeamById(req.body.team_id, req.user);
        if (!team || !team.is_member) {
            return res.status(403).json({ error: 'You must be a team member to create tasks' });
        }
        
        const task = await createTask(req.body, req.user.id);
        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task details - creator/admin only (full edit).
// Note: Non-admin users are allowed to attempt edits; updateTask() will enforce creator-only.
router.put('/:id', async (req, res) => {
    const { error } = validateTask(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    try {
        const task = await updateTask(req.params.id, req.body, req.user);
        res.json(task);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// Update task status - Anyone (with restrictions in model)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });
    
    try {
        const task = await updateTaskStatus(req.params.id, status, req.user);
        res.json(task);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// Delete task - Admin only
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await deleteTask(req.params.id, req.user);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

export default router;
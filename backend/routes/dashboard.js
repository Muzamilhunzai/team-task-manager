import express from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = express.Router();

router.use(ensureAuthenticated);

// GET /api/dashboard/tasks/stats
router.get('/tasks/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // For simplicity, we'll count tasks the user is involved in
        const query = isAdmin
            ? `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed
               FROM tasks t
               JOIN team_members tm ON t.team_id = tm.team_id
               WHERE tm.user_id = $1`
            : `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed
               FROM tasks
               WHERE assignee_id = $1`;

        const result = await pool.query(query, [userId]);
        const stats = result.rows[0];

        res.json({
            totalTasks: parseInt(stats.total),
            completedTasks: parseInt(stats.completed),
            trends: {
                tasks: 5.2, // Dummy trend
                completed: 12.5
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch task stats' });
    }
});

// GET /api/dashboard/projects/stats
router.get('/projects/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT COUNT(*) as total FROM team_members WHERE user_id = $1',
            [userId]
        );
        res.json({
            activeProjects: parseInt(result.rows[0].total),
            activeProjectsTrend: 2.1
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
});

// GET /api/dashboard/teams/stats
router.get('/teams/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        // Total unique members in all teams user is in
        const result = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as total 
             FROM team_members 
             WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)`,
            [userId]
        );
        res.json({
            teamMembers: parseInt(result.rows[0].total),
            teamMembersTrend: 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch team stats' });
    }
});

// GET /api/dashboard/tasks/recent
router.get('/tasks/recent', async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const query = isAdmin
            ? `SELECT t.*, u.username as assignee_name
               FROM tasks t
               JOIN team_members tm ON t.team_id = tm.team_id
               LEFT JOIN users u ON t.assignee_id = u.id
               WHERE tm.user_id = $1
               ORDER BY t.updated_at DESC
               LIMIT 5`
            : `SELECT t.*, u.username as assignee_name
               FROM tasks t
               LEFT JOIN users u ON t.assignee_id = u.id
               WHERE t.assignee_id = $1
               ORDER BY t.updated_at DESC
               LIMIT 5`;

        const result = await pool.query(query, [userId]);
        res.json(result.rows.map(row => ({
            id: row.id,
            title: row.title,
            status: row.status,
            updatedAt: row.updated_at
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recent tasks' });
    }
});

// GET /api/dashboard/tasks/upcoming-deadlines
router.get('/tasks/upcoming-deadlines', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT id, title, due_date as "dueDate"
             FROM tasks
             WHERE (assignee_id = $1 OR created_by = $1)
               AND status != 'completed'
               AND due_date IS NOT NULL
               AND due_date >= CURRENT_TIMESTAMP
             ORDER BY due_date ASC
             LIMIT 5`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch deadlines' });
    }
});

// GET /api/dashboard/tasks/productivity
router.get('/tasks/productivity', async (req, res) => {
    try {
        const userId = req.user.id;
        // Last 7 days productivity
        const result = await pool.query(
            `SELECT 
                TO_CHAR(date_trunc('day', d), 'YYYY-MM-DD') as date,
                COUNT(t.id) as tasks
             FROM generate_series(current_date - interval '6 days', current_date, '1 day'::interval) d
             LEFT JOIN tasks t ON date_trunc('day', t.updated_at) = d 
                AND t.status = 'completed'
                AND (t.assignee_id = $1 OR t.created_by = $1)
             GROUP BY d
             ORDER BY d ASC`,
            [userId]
        );
        res.json(result.rows.map(row => ({
            date: row.date,
            tasks: parseInt(row.tasks)
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch productivity data' });
    }
});

// GET /api/dashboard/projects/progress
router.get('/projects/progress', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT 
                tm.name,
                CASE 
                    WHEN COUNT(t.id) = 0 THEN 0
                    ELSE ROUND(COUNT(t.id) FILTER (WHERE t.status = 'completed')::numeric / COUNT(t.id) * 100)
                END as progress
             FROM teams tm
             JOIN team_members tmm ON tm.id = tmm.team_id
             LEFT JOIN tasks t ON tm.id = t.team_id
             WHERE tmm.user_id = $1
             GROUP BY tm.id, tm.name
             LIMIT 5`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project progress' });
    }
});

// GET /api/dashboard/teams/activity
router.get('/teams/activity', async (req, res) => {
    try {
        const userId = req.user.id;
        // Mocking activity since we don't have an activity log table
        // We'll use recent task updates as activity
        const result = await pool.query(
            `SELECT 
                t.id,
                u.username as "userName",
                'updated task status' as action,
                t.title as task_title,
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.updated_at))/60 as "timeAgoMinutes"
             FROM tasks t
             JOIN users u ON t.assignee_id = u.id OR t.created_by = u.id
             JOIN team_members tmm ON t.team_id = tmm.team_id
             WHERE tmm.user_id = $1
             ORDER BY t.updated_at DESC
             LIMIT 5`,
            [userId]
        );
        res.json(result.rows.map(row => ({
            ...row,
            timeAgoMinutes: Math.floor(row.timeAgoMinutes)
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch team activity' });
    }
});

export default router;
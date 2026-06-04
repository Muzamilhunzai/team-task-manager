import pool from '../db/pool.js';

export const createTask = async (taskData, createdBy) => {
    const { title, description, status, due_date, team_id, assignee_id } = taskData;
    const result = await pool.query(
        `INSERT INTO tasks (title, description, status, due_date, team_id, assignee_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, description, status || 'pending', due_date, team_id, assignee_id, createdBy]
    );
    return result.rows[0];
};

export const getTasksByTeam = async (teamId, user) => {
    const isAdmin = user.role === 'admin';

    // Admins should only see tasks they created (even within teams they are a member of)
    const query = isAdmin
        ? `SELECT t.*, u.username as assignee_name, creator.username as creator_name
           FROM tasks t
           LEFT JOIN users u ON t.assignee_id = u.id
           LEFT JOIN users creator ON t.created_by = creator.id
           WHERE t.team_id = $1 AND t.created_by = $2
           ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`
        : `SELECT t.*, u.username as assignee_name, creator.username as creator_name
           FROM tasks t
           LEFT JOIN users u ON t.assignee_id = u.id
           LEFT JOIN users creator ON t.created_by = creator.id
           WHERE t.team_id = $1 AND t.assignee_id = $2
           ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`;

    const params = [teamId, user.id];
    const result = await pool.query(query, params);
    return result.rows;
};

export const getTasksByAssignee = async (assigneeId, user) => {
    // If user is not admin and trying to see others' tasks, restrict to self
    const targetId = (user.role !== 'admin') ? user.id : assigneeId;
    
    const result = await pool.query(
        `SELECT t.*, 
         u.username as assignee_name,
         creator.username as creator_name,
         tm.name as team_name
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         LEFT JOIN users creator ON t.created_by = creator.id
         JOIN teams tm ON t.team_id = tm.id
         WHERE t.assignee_id = $1
         ORDER BY t.due_date ASC NULLS LAST`,
        [targetId]
    );
    return result.rows;
};

export const getAllUserTasks = async (user) => {
    const isAdmin = user.role === 'admin';
    const query = isAdmin
        ? `SELECT t.*, 
           u.username as assignee_name,
           creator.username as creator_name,
           tm.name as team_name
           FROM tasks t
           JOIN team_members tm_mem ON t.team_id = tm_mem.team_id
           LEFT JOIN users u ON t.assignee_id = u.id
           LEFT JOIN users creator ON t.created_by = creator.id
           JOIN teams tm ON t.team_id = tm.id
           WHERE tm_mem.user_id = $1
           ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`
        : `SELECT t.*, 
           u.username as assignee_name,
           creator.username as creator_name,
           tm.name as team_name
           FROM tasks t
           JOIN team_members tm_mem ON t.team_id = tm_mem.team_id
           LEFT JOIN users u ON t.assignee_id = u.id
           LEFT JOIN users creator ON t.created_by = creator.id
           JOIN teams tm ON t.team_id = tm.id
           WHERE tm_mem.user_id = $1 AND t.assignee_id = $1
           ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`;

    const result = await pool.query(query, [user.id]);
    return result.rows;
};

export const updateTask = async (taskId, taskData, user) => {
    const { title, description, status, due_date, assignee_id } = taskData;
    
    const taskResult = await pool.query(
        'SELECT created_by, team_id FROM tasks WHERE id = $1',
        [taskId]
    );
    if (taskResult.rows.length === 0) throw new Error('Task not found');
    const task = taskResult.rows[0];
    
    if (task.created_by !== user.id) {
        throw new Error('You can only update this task if you are the creator');
    }
    
    const result = await pool.query(
        `UPDATE tasks 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             due_date = COALESCE($4, due_date),
             assignee_id = COALESCE($5, assignee_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [title, description, status, due_date, assignee_id, taskId]
    );
    return result.rows[0];
};

export const deleteTask = async (taskId, user) => {
    const taskResult = await pool.query(
        'SELECT created_by, team_id FROM tasks WHERE id = $1',
        [taskId]
    );
    if (taskResult.rows.length === 0) throw new Error('Task not found');
    const task = taskResult.rows[0];
    
    if (task.created_by !== user.id) {
        throw new Error('You can only delete this task if you are the creator');
    }
    
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
};

export const updateTaskStatus = async (taskId, status, user) => {
    const taskResult = await pool.query(
        'SELECT assignee_id, status, created_by FROM tasks WHERE id = $1',
        [taskId]
    );
    if (taskResult.rows.length === 0) throw new Error('Task not found');
    const task = taskResult.rows[0];

    // Check if user is assigned to this task or the creator
    if (task.assignee_id !== user.id && task.created_by !== user.id) {
        throw new Error('You can only update status of tasks assigned to you or created by you');
    }

    // Regular users can only change from pending to accepted/declined, or others if they are already in progress
    if (user.role !== 'admin') {
        if (task.status === 'pending' && !['accepted', 'declined'].includes(status)) {
            throw new Error('You can only accept or decline pending tasks');
        }
    }

    const result = await pool.query(
        `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, taskId]
    );
    return result.rows[0];
};

export const getTaskReminders = async (userId) => {
    const query = `
        SELECT t.*, tm.name as team_name
        FROM tasks t
        JOIN teams tm ON t.team_id = tm.id
        WHERE t.assignee_id = $1 
          AND t.status != 'completed'
          AND (
            (t.due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' AND t.due_date > CURRENT_TIMESTAMP) -- Due Soon
            OR (t.due_date < CURRENT_TIMESTAMP) -- Overdue
          )
        ORDER BY t.due_date ASC
    `;
    const result = await pool.query(query, [userId]);
    
    const reminders = {
        dueSoon: result.rows.filter(t => new Date(t.due_date) > new Date()),
        overdue: result.rows.filter(t => new Date(t.due_date) <= new Date())
    };
    
    return reminders;
};

export const getAllTasksDueSoon = async () => {
    const query = `
        SELECT t.*, u.email as user_email, u.username
        FROM tasks t
        JOIN users u ON t.assignee_id = u.id
        WHERE t.status != 'completed'
          AND (
            (t.due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' AND t.due_date > CURRENT_TIMESTAMP)
            OR (t.due_date < CURRENT_TIMESTAMP)
          )
    `;
    const result = await pool.query(query);
    return result.rows;
};
import pool from '../db/pool.js';

export const createNotification = async (userId, message, type = 'invitation') => {
    const result = await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *',
        [userId, message, type]
    );
    return result.rows[0];
};

export const getUserNotifications = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows[0];
};

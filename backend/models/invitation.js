import pool from '../db/pool.js';
import { randomUUID } from 'crypto';

export const createInvitation = async (email, teamId, senderId) => {
    const id = randomUUID();
    const result = await pool.query(
        'INSERT INTO invitations (id, email, team_id, sender_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, email, teamId, senderId, 'PENDING']
    );
    return result.rows[0];
};

export const findInvitationById = async (id) => {
    const result = await pool.query(
        `SELECT i.*, t.name as team_name, u.username as sender_name 
         FROM invitations i
         JOIN teams t ON i.team_id = t.id
         JOIN users u ON i.sender_id = u.id
         WHERE i.id = $1`,
        [id]
    );
    return result.rows[0];
};

export const getUserInvitations = async (email) => {
    const result = await pool.query(
        `SELECT i.*, t.name as team_name, u.username as sender_name 
         FROM invitations i
         JOIN teams t ON i.team_id = t.id
         JOIN users u ON i.sender_id = u.id
         WHERE i.email = $1 AND i.status = 'PENDING'
         ORDER BY i.created_at DESC`,
        [email]
    );
    return result.rows;
};

export const getAdminSentInvitations = async (adminId) => {
    const result = await pool.query(
        `SELECT i.*, t.name as team_name, u.username as recipient_name
         FROM invitations i
         JOIN teams t ON i.team_id = t.id
         LEFT JOIN users u ON i.email = u.email
         WHERE i.sender_id = $1
         ORDER BY i.created_at DESC`,
        [adminId]
    );
    return result.rows;
};

export const updateInvitationStatus = async (id, status) => {
    const result = await pool.query(
        'UPDATE invitations SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
    );
    return result.rows[0];
};

export const deleteInvitation = async (id) => {
    await pool.query('DELETE FROM invitations WHERE id = $1', [id]);
};

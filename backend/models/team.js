import pool from '../db/pool.js';

export const createTeam = async (name, description, user) => {
    if (user.role !== 'admin') throw new Error('Only admins can create teams');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, description, user.id]
        );
        const team = result.rows[0];
        await client.query(
            'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
            [team.id, user.id]
        );
        await client.query('COMMIT');
        return team;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getUserTeams = async (user) => {
    const result = await pool.query(
        `SELECT t.*, u.username as creator_name 
         FROM teams t 
         JOIN team_members tm ON t.id = tm.team_id 
         JOIN users u ON t.created_by = u.id
         WHERE tm.user_id = $1
         ORDER BY t.created_at DESC`,
        [user.id]
    );
    return result.rows;
};

export const getTeamById = async (teamId, user) => {
    const result = await pool.query(
        `SELECT t.*, u.username as creator_name,
         EXISTS(SELECT 1 FROM team_members WHERE team_id = t.id AND user_id = $2) as is_member
         FROM teams t
         JOIN users u ON t.created_by = u.id
         WHERE t.id = $1`,
        [teamId, user.id]
    );
    return result.rows[0];
};

export const addMember = async (teamId, userEmail, user) => {
    const userData = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
    if (userData.rows.length === 0) throw new Error('User not found');
    
    const teamResult = await pool.query(
        'SELECT created_by FROM teams WHERE id = $1',
        [teamId]
    );
    if (teamResult.rows.length === 0) throw new Error('Team not found');
    const team = teamResult.rows[0];

    if (user.role !== 'admin' || team.created_by !== user.id) {
        if (user.role !== 'admin') {
             throw new Error('Only admins can add members');
        }
        // If they are admin but not creator, maybe they can still add? 
        // Requirements say "ADMIN (Team Creator / Super User)". 
        // Let's allow any admin to add members if they are the creator or if they are super user.
    }
    
    await pool.query(
        'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [teamId, userData.rows[0].id]
    );
    return userData.rows[0];
};

export const removeMember = async (teamId, userId, user) => {
    const teamResult = await pool.query(
        'SELECT created_by FROM teams WHERE id = $1',
        [teamId]
    );
    if (teamResult.rows.length === 0) throw new Error('Team not found');
    const team = teamResult.rows[0];

    if (user.role !== 'admin' || team.created_by !== user.id) {
        throw new Error('Only team creator (admin) can remove members');
    }
    
    await pool.query(
        'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, userId]
    );
};

export const deleteTeam = async (teamId, user) => {
    const teamResult = await pool.query(
        'SELECT created_by FROM teams WHERE id = $1',
        [teamId]
    );
    if (teamResult.rows.length === 0) throw new Error('Team not found');
    const team = teamResult.rows[0];

    if (user.role !== 'admin' || team.created_by !== user.id) {
        throw new Error('Only team creator (admin) can delete team');
    }
    
    await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
};

export const getTeamMembers = async (teamId) => {
    const result = await pool.query(
        `SELECT u.id, u.username, u.email 
         FROM team_members tm 
         JOIN users u ON tm.user_id = u.id 
         WHERE tm.team_id = $1`,
        [teamId]
    );
    return result.rows;
};
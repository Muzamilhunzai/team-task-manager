import pool from '../db/pool.js';
import bcrypt from 'bcrypt';

export const createUser = async (username, email, password, role = 'user') => {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [username, email, hashedPassword, role]
    );
    return result.rows[0];
};

export const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

export const findUserByUsername = async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
};

export const findUserById = async (id) => {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

export const findUserByUsernameOrEmail = async (identifier) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $1',
        [identifier]
    );
    return result.rows[0];
};
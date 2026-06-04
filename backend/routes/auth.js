import express from 'express';
import passport from 'passport';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { createUser, findUserByEmail, findUserByUsername } from '../models/user.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { error, value } = validateRegister(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    const { username, email, password, role } = value;
    try {
        const [existingEmail, existingUsername] = await Promise.all([
            findUserByEmail(email),
            findUserByUsername(username)
        ]);

        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await createUser(username, email, password, role);
        res.status(201).json({ message: 'Registration successful', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res, next) => {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(401).json({ error: info.message || 'Invalid credentials' });
        
        req.logIn(user, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed' });
            res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
        });
    })(req, res, next);
});

// Logout
router.post('/logout', (req, res) => {
    req.logout(() => {
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

export default router;
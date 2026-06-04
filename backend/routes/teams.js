import express from 'express';
import { ensureAuthenticated, isAdmin } from '../middleware/auth.js';
import { validateTeam } from '../middleware/validation.js';
import { createTeam, getUserTeams, getTeamById, addMember, removeMember, deleteTeam, getTeamMembers } from '../models/team.js';
import { findUserByEmail } from '../models/user.js';

const router = express.Router();

router.use(ensureAuthenticated);

// Create team - Admin only
router.post('/', isAdmin, async (req, res) => {
    const { error } = validateTeam(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    try {
        const team = await createTeam(req.body.name, req.body.description, req.user);
        res.status(201).json(team);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Invite member (Stub) - Admin only
router.post('/:id/invite', isAdmin, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    try {
        console.log(`[STUB] Invitation sent to ${email} for team ${req.params.id}`);
        res.json({ message: `Invitation sent to ${email}` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// Get user's teams
router.get('/', async (req, res) => {
    try {
        const teams = await getUserTeams(req.user);
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get team details
router.get('/:id', async (req, res) => {
    try {
        const team = await getTeamById(req.params.id, req.user);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Add member - Admin only
router.post('/:id/members', isAdmin, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    try {
        const user = await findUserByEmail(email);
        if (!user) {
            // Stub: trigger invite logic if user not found
            console.log(`[STUB] User ${email} not found. Triggering invite.`);
            return res.status(404).json({ error: 'User not found', inviteSent: true });
        }
        
        await addMember(req.params.id, email, req.user);
        res.json({ message: 'Member added successfully', user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// Get team members
router.get('/:id/members', async (req, res) => {
    try {
        const members = await getTeamMembers(req.params.id);
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// Remove member - Admin only
router.delete('/:id/members/:userId', isAdmin, async (req, res) => {
    try {
        await removeMember(req.params.id, parseInt(req.params.userId), req.user);
        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// Delete team - Admin only
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await deleteTeam(req.params.id, req.user);
        res.json({ message: 'Team deleted successfully' });
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

export default router;
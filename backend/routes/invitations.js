import express from 'express';
import { body, validationResult } from 'express-validator';
import { createInvitation, getUserInvitations, updateInvitationStatus, findInvitationById, getAdminSentInvitations } from '../models/invitation.js';
import { findUserByEmail } from '../models/user.js';
import { createNotification } from '../models/notification.js';
import { ensureAuthenticated, isAdmin } from '../middleware/auth.js';
import { addMember } from '../models/team.js';

const router = express.Router();

router.use(ensureAuthenticated);

// POST /api/invitations - SEND (Admin only)
router.post('/', isAdmin, [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('teamId').isInt().withMessage('Valid team ID required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, teamId } = req.body;
    const sender = req.user;

    try {
        const targetUser = await findUserByEmail(email);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found. They must register first.' });
        }

        const invitation = await createInvitation(email, teamId, sender.id);
        
        await createNotification(targetUser.id, `${sender.username} invited you to join a team.`, 'invitation');

        res.status(201).json({ message: "Invitation sent successfully", invitation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// GET /api/invitations/my - LIST for current user
router.get('/my', async (req, res) => {
    try {
        const invitations = await getUserInvitations(req.user.email);
        res.json(invitations);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

// GET /api/invitations/sent - LIST for admin
router.get('/sent', isAdmin, async (req, res) => {
    try {
        const invitations = await getAdminSentInvitations(req.user.id);
        res.json(invitations);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sent invitations' });
    }
});

// POST /api/invitations/:id/accept
router.post('/:id/accept', async (req, res) => {
    try {
        const invitation = await findInvitationById(req.params.id);
        if (!invitation || invitation.email !== req.user.email) {
            return res.status(403).json({ error: 'Invalid invitation' });
        }

        await updateInvitationStatus(invitation.id, 'ACCEPTED');
        await addMember(invitation.team_id, req.user.email, { role: 'admin' }); // bypass creator check via mock object

        await createNotification(invitation.sender_id, `${req.user.username} accepted your invitation.`, 'info');

        res.json({ message: 'Invitation accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

// POST /api/invitations/:id/decline
router.post('/:id/decline', async (req, res) => {
    try {
        const invitation = await findInvitationById(req.params.id);
        if (!invitation || invitation.email !== req.user.email) {
            return res.status(403).json({ error: 'Invalid invitation' });
        }

        await updateInvitationStatus(invitation.id, 'DECLINED');
        await createNotification(invitation.sender_id, `${req.user.username} declined your invitation.`, 'info');

        res.json({ message: 'Invitation declined' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to decline invitation' });
    }
});

export default router;

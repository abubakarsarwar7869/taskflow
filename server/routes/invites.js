import express from 'express';
import User from '../models/User.js';
import Board from '../models/Board.js';
import { protect } from '../middleware/auth.js';
import { sendInviteEmail } from '../utils/email.js';

const router = express.Router();

// @route   POST /api/invites
// @desc    Send invitation email to a user
// @access  Private (Admin or Board Owner)
router.post('/', protect, async (req, res) => {
  try {
    const { email, boardName, boardId } = req.body;

    // Validation
    if (!email || !boardName || !boardId) {
      return res.status(400).json({ error: 'Email, board name, and boardId are required' });
    }

    // Check permissions: User must be admin OR board owner
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const isOwner = board.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Only board owners or administrators can send invitations' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists. They can log in directly.'
      });
    }

    // Add placeholder member to the board so they show as pending in the UI
    try {
      // Check if member already exists (including as a placeholder)
      const memberExists = board.members.some(m => m.email === email);
      if (!memberExists) {
        board.members.push({
          name: email.split('@')[0], // Use email prefix as temporary name
          email: email,
          role: 'member',
          status: 'pending',
          avatar: ''
        });
        await board.save();
      }
    } catch (err) {
      console.warn('⚠️ Could not add placeholder member to board:', err.message);
    }

    // Send invitation email using utility
    const sent = await sendInviteEmail({
      to: email,
      inviterName: req.user.name,
      boardName,
      boardId
    });

    if (!sent) {
      return res.status(500).json({
        error: 'Failed to send invitation email. Please check email service configuration.'
      });
    }

    console.log(`✅ Invitation email sent to ${email} for board "${boardName}"`);

    res.json({
      message: 'Invitation email sent successfully',
      email,
      boardName,
    });
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    res.status(500).json({
      error: 'Failed to send invitation email'
    });
  }
});

export default router;


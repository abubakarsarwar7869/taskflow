import express from 'express';
import Board from '../models/Board.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get boards visible to a user
router.get('/', protect, async (req, res) => {
  try {
    // Public boards
    const publicBoards = await Board.find({ isPublic: true });
    // Boards where user is a member or owner
    const privateBoards = await Board.find({
      $or: [
        { 'members.id': req.user._id },
        { ownerId: req.user._id }
      ],
    });
    // Merge and dedupe
    const ids = new Set();
    const allBoards = [...publicBoards, ...privateBoards].filter(board => {
      if (ids.has(board._id.toString())) return false;
      ids.add(board._id.toString());
      return true;
    });
    res.json(allBoards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new board (admin/owner only)
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    if (!name) return res.status(400).json({ error: 'Board name required' });
    // Only admin (system) can create
    if (req.user.role !== 'admin') return res.status(403).json({ error:'Only system admin can create boards'});

    const currentUserAsMember = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: 'admin',
    };
    const board = await Board.create({
      name,
      description,
      isPublic: !!isPublic,
      ownerId: req.user._id,
      members: [currentUserAsMember],
    });
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a board (only the owner can change name/description/public, only admin can edit members)
router.put('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error: 'Only the board owner can edit this board' });
    // Updating fields
    board.name = req.body.name || board.name;
    board.description = req.body.description || board.description;
    if (typeof req.body.isPublic === 'boolean') board.isPublic = req.body.isPublic;
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a board (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error: 'Only the owner can delete the board' });
    await board.remove();
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invite member endpoint (owner only)
router.patch('/:id/invite', protect, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name required' });
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error: 'Only owner can invite' });
    // Check if already a member
    if (board.members.some(m => m.email === email)) return res.status(409).json({ error: 'Already a member' });
    // You may want to check if user exists as well - this is a demo
    board.members.push({ id: null, email, name, role:'member' });
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change member role (owner only)
router.patch('/:id/members/:mid/role', protect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin','member'].includes(role)) return res.status(400).json({ error:'Invalid role'});
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error: 'Only owner can change roles' });
    const member = board.members.id(req.params.mid);
    if (!member) return res.status(404).json({ error: 'No such member' });
    member.role = role;
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

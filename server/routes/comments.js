import express from 'express';
import { protect } from '../middleware/auth.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';

const router = express.Router();

// GET /api/comments/:taskId - get all comments for a task
router.get('/:taskId', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/comments/:taskId - add a comment (with optional screenshot)
router.post('/:taskId', protect, async (req, res) => {
  try {
    const { text, screenshotUrl, type } = req.body; // type can be 'comment' or 'completion'
    if (!text && !screenshotUrl) return res.status(400).json({ error: 'No comment or screenshot' });
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Must be board member or owner to comment
    const board = await Board.findById(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const isMember = board.members.some(m => m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);
    if (!isMember && !isOwner) return res.status(403).json({ error: 'Not a board member' });

    const comment = await Comment.create({
      taskId: req.params.taskId,
      userId: req.user._id,
      userName: req.user.name,
      text,
      screenshotUrl,
      type: type || 'comment',
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;




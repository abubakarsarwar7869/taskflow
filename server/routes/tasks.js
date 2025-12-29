import express from 'express';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for a board (visible if board is public or user is a member)
router.get('/board/:boardId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    // Allow if public or member or owner
    const isMember = board.members.some(m => m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);
    if (!board.isPublic && !isMember && !isOwner) return res.status(403).json({ error: 'No permission' });
    const tasks = await Task.find({ boardId: board._id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a task (owner only)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, boardId } = req.body;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error:'Only board admin can create tasks'});
    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      boardId,
      userId: req.user._id
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const board = await Board.findById(task.boardId);
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error:'Only board admin can edit tasks'});
    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const board = await Board.findById(task.boardId);
    if (!board.ownerId.equals(req.user._id)) return res.status(403).json({ error:'Only board admin can delete tasks'});
    await task.remove();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark task complete (member only, not admin/owner)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const { comment, screenshotUrl } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const board = await Board.findById(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const isMember = board.members.some(m=>m.id.equals(req.user._id) && m.role==='member');
    const isOwnerOrAdmin = board.ownerId.equals(req.user._id) || board.members.some(m=>m.id.equals(req.user._id) && m.role==='admin');
    if (!isMember) return res.status(403).json({ error:'Only board members can complete tasks' });
    if (isOwnerOrAdmin) return res.status(403).json({ error:'Admins/owners cannot complete tasks this way' });
    task.status = 'done';
    await task.save();
    // Optionally, log this in comments
    const Comment = (await import('../models/Comment.js')).default;
    if (comment || screenshotUrl) {
      await Comment.create({
        taskId: task._id,
        userId: req.user._id,
        userName: req.user.name,
        text: comment,
        screenshotUrl,
        type: 'completion'
      });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import { protect } from '../middleware/auth.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Notification from '../models/Notification.js';

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

// POST /api/comments/:taskId - add a comment (with optional screenshot and parentId for replies)
router.post('/:taskId', protect, async (req, res) => {
  try {
    const { text, screenshotUrl, type, parentId } = req.body; // type can be 'comment' or 'completion'
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
      parentId: parentId || null
    });

    console.log('✅ Comment created:', comment._id, 'by user:', req.user.name);

    // Create notifications
    const notificationPromises = [];
    const mentionedUserIds = new Set();

    // Parse mentions
    if (text) {
      // Check members for mentions
      board.members.forEach(member => {
        if (member.id && text.includes(`@${member.name}`)) {
          mentionedUserIds.add(member.id.toString());
        }
      });
      // Check owner for mention (though they might be in members too)
      // Since we don't have owner name easily here without population, we rely on members list
      // which usually includes the owner if they were added as member, or we could populate owner
    }

    // Notify mentioned users first
    mentionedUserIds.forEach(userId => {
      if (userId !== req.user._id.toString()) {
        notificationPromises.push(
          Notification.create({
            userId,
            message: `${req.user.name} mentioned you in a comment on task "${task.title}"`,
            type: 'mention',
            boardId: board._id,
            taskId: task._id
          })
        );
      }
    });

    // Notify board owner if they're not the commenter and not already mentioned
    if (!board.ownerId.equals(req.user._id) && !mentionedUserIds.has(board.ownerId.toString())) {
      notificationPromises.push(
        Notification.create({
          userId: board.ownerId,
          message: `${req.user.name} commented on task "${task.title}" in board "${board.name}"`,
          type: 'comment_added',
          boardId: board._id,
          taskId: task._id
        })
      );
    }

    // Notify all active members (except the commenter and mentioned users)
    board.members.forEach(member => {
      if (member.status === 'active' && member.id &&
        !member.id.equals(req.user._id) &&
        !mentionedUserIds.has(member.id.toString())) {
        notificationPromises.push(
          Notification.create({
            userId: member.id,
            message: `${req.user.name} commented on task "${task.title}" in board "${board.name}"`,
            type: 'comment_added',
            boardId: board._id,
            taskId: task._id
          })
        );
      }
    });

    const createdNotifications = await Promise.all(notificationPromises);
    console.log(`📬 Created ${notificationPromises.length} notifications (${mentionedUserIds.size} mentions) for comment`);

    // Real-time synchronization via Socket.io
    const io = req.app.get('io');
    if (io) {
      // 1. Emit new comment to the board room (everyone looking at this board gets the update)
      io.to(`board:${board._id}`).emit('new_comment', {
        ...comment.toObject(),
        id: comment._id // Ensure consistency
      });

      // 2. Emit each notification to the specific user's room
      createdNotifications.forEach(notif => {
        if (notif) {
          io.to(`user:${notif.userId}`).emit('new_notification', {
            ...notif.toObject(),
            id: notif._id
          });
        }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('❌ Create comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;




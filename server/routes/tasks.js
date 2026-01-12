import express from 'express';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import Comment from '../models/Comment.js';

const router = express.Router();

// Get all tasks for a board (with comment counts)
router.get('/board/:boardId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const isMember = board.members.some(m => m.id && m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);

    if (!board.isPublic && !isMember && !isOwner) {
      return res.status(403).json({ error: 'No permission' });
    }

    // Use aggregation to get tasks with comment counts
    const tasks = await Task.aggregate([
      { $match: { boardId: board._id } },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'taskId',
          as: 'comments'
        }
      },
      {
        $addFields: {
          id: '$_id',
          commentsCount: { $size: '$comments' }
        }
      },
      { $sort: { position: 1, createdAt: -1 } },
      { $project: { comments: 0 } } // Exclude the full comments array
    ]);

    res.json(tasks);
  } catch (error) {
    console.error('❌ Fetch tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a task
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, boardId, labels } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const userMember = board.members.find(m => m.id && m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);
    const isAdmin = isOwner || (userMember && userMember.role === 'admin');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only board admins or owners can create tasks' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || [],
      boardId,
      userId: req.user._id,
      position: 0,
    });

    console.log('✅ Task created:', task._id);

    // Create notifications for all board members
    const notificationPromises = [];

    // Notify board owner
    notificationPromises.push(
      Notification.create({
        userId: board.ownerId,
        message: board.ownerId.equals(req.user._id)
          ? `You added a new task: "${task.title}" to board "${board.name}"`
          : `${req.user.name} added a new task: "${task.title}" to board "${board.name}"`,
        type: 'task_created',
        boardId: board._id,
        taskId: task._id
      })
    );

    // Notify all active members
    board.members.forEach(member => {
      if (member.status === 'active' && member.id) {
        notificationPromises.push(
          Notification.create({
            userId: member.id,
            message: member.id.equals(req.user._id)
              ? `You added a new task: "${task.title}" to board "${board.name}"`
              : `${req.user.name} added a new task: "${task.title}" to board "${board.name}"`,
            type: 'task_created',
            boardId: board._id,
            taskId: task._id
          })
        );
      }
    });

    const createdNotifications = await Promise.all(notificationPromises);

    // Real-time synchronization
    const io = req.app.get('io');
    if (io) {
      // Notify everyone on the board about the new task
      io.to(`board:${board._id}`).emit('task_created', {
        ...task.toObject(),
        id: task._id
      });

      // Send notifications to individual users
      createdNotifications.forEach(notif => {
        if (notif) {
          io.to(`user:${notif.userId}`).emit('new_notification', {
            ...notif.toObject(),
            id: notif._id
          });
        }
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('❌ Create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findById(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const userMember = board.members.find(m => m.id && m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);
    const isAdmin = isOwner || (userMember && userMember.role === 'admin');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only board admins or owners can edit tasks' });
    }

    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.description !== undefined) task.description = req.body.description.trim();
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.labels !== undefined) task.labels = req.body.labels;
    if (req.body.position !== undefined) task.position = req.body.position;

    await task.save();

    // Create notification for task move/update
    if (req.body.status !== undefined) {
      const dueDateInfo = task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : '';
      const notificationPromises = [];

      // Notify board owner
      notificationPromises.push(
        Notification.create({
          userId: board.ownerId,
          message: board.ownerId.equals(req.user._id)
            ? `Task "${task.title}" moved to ${req.body.status} in board "${board.name}"${dueDateInfo}`
            : `${req.user.name} moved task "${task.title}" to ${req.body.status} in board "${board.name}"${dueDateInfo}`,
          type: 'task_moved',
          boardId: board._id,
          taskId: task._id
        })
      );

      // Notify all active members
      board.members.forEach(member => {
        if (member.status === 'active' && member.id) {
          notificationPromises.push(
            Notification.create({
              userId: member.id,
              message: member.id.equals(req.user._id)
                ? `Task "${task.title}" moved to ${req.body.status} in board "${board.name}"${dueDateInfo}`
                : `${req.user.name} moved task "${task.title}" to ${req.body.status} in board "${board.name}"${dueDateInfo}`,
              type: 'task_moved',
              boardId: board._id,
              taskId: task._id
            })
          );
        }
      });

      const createdNotifications = await Promise.all(notificationPromises);

      // Real-time synchronization
      const io = req.app.get('io');
      if (io) {
        createdNotifications.forEach(notif => {
          if (notif) {
            io.to(`user:${notif.userId}`).emit('new_notification', {
              ...notif.toObject(),
              id: notif._id
            });
          }
        });
      }
    }

    // Always emit task_updated for any changes
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id}`).emit('task_updated', {
        ...task.toObject(),
        id: task._id
      });
    }

    console.log('✅ Task updated:', task._id);
    res.json(task);
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findById(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const isOwner = board.ownerId.equals(req.user._id);
    const isAdmin = board.members.some(m => m.id && m.id.equals(req.user._id) && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only board admins can delete tasks' });
    }

    const taskTitle = task.title;
    await Task.findByIdAndDelete(req.params.id);

    const notification = await Notification.create({
      userId: req.user._id,
      message: `Task "${taskTitle}" was deleted from board "${board.name}"`,
      type: 'task_deleted',
      boardId: board._id
    });

    // Real-time synchronization for delete
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id}`).emit('task_deleted', req.params.id);

      // Notify board owner/admins about deletion
      io.to(`user:${board.ownerId}`).emit('new_notification', notification);
      board.members.forEach(m => {
        if (m.role === 'admin' && m.id) {
          io.to(`user:${m.id}`).emit('new_notification', notification);
        }
      });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Delete task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a task
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const { comment, screenshotUrl } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findById(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const isMember = board.members.some(m => m.id && m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);
    const isOwnerOrAdmin = isOwner || board.members.some(m => m.id && m.id.equals(req.user._id) && m.role === 'admin');

    if (!isMember && !isOwnerOrAdmin) {
      return res.status(403).json({ error: 'Only board members, admins, or owners can complete tasks' });
    }

    task.status = 'done';
    task.completedAt = Date.now();
    await task.save();

    // Socket emission
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id}`).emit('task_updated', {
        ...task.toObject(),
        id: task._id
      });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
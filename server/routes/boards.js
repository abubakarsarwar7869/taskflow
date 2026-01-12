import express from 'express';
import Board from '../models/Board.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { sendInviteEmail } from '../utils/email.js';

const router = express.Router();

/**
 * GET /api/boards
 * Fetch all boards visible to the logged-in user
 */
router.get('/', protect, async (req, res) => {
  try {
    console.log('🔍 GET /api/boards - User ID:', req.user._id);
    const userId = req.user._id;

    // Only return boards where user is owner OR an active member (not pending)
    const boards = await Board.find({
      $or: [
        { ownerId: userId },
        {
          'members': {
            $elemMatch: {
              id: userId,
              status: 'active'
            }
          }
        }
      ],
    })
      .populate('ownerId', 'name email avatar')
      .sort({ createdAt: -1 });

    const boardsWithTaskCount = await Promise.all(boards.map(async (board) => {
      const taskCount = await Task.countDocuments({ boardId: board._id });
      return {
        ...board.toObject(),
        id: board._id,
        taskCount
      };
    }));

    console.log('📊 Found boards:', boardsWithTaskCount.length);
    res.json(boardsWithTaskCount);
  } catch (error) {
    console.error('❌ Fetch boards error:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

/**
 * GET /api/boards/community
 * Fetch all public boards
 */
router.get('/community', async (req, res) => {
  try {
    console.log('🔍 GET /api/boards/community');
    const boards = await Board.find({ isPublic: true })
      .populate('ownerId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Add task count for each board
    const boardsWithTaskCount = await Promise.all(boards.map(async (board) => {
      const taskCount = await Task.countDocuments({ boardId: board._id });
      return {
        ...board.toObject(),
        id: board._id,
        taskCount
      };
    }));

    console.log('📊 Found public boards:', boardsWithTaskCount.length);
    res.json(boardsWithTaskCount);
  } catch (error) {
    console.error('❌ Fetch community boards error:', error);
    res.status(500).json({ error: 'Failed to fetch community boards' });
  }
});

/**
 * GET /api/boards/:id
 * Get a single board by ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    console.log('🔍 GET /api/boards/:id - Board ID:', req.params.id);
    const board = await Board.findById(req.params.id);
    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ error: 'Board not found' });
    }

    const isMember = board.members.some(m => m.id && m.id.equals(req.user._id));
    const isOwner = board.ownerId.equals(req.user._id);

    console.log('🔐 Permissions - isOwner:', isOwner, 'isMember:', isMember, 'isPublic:', board.isPublic);

    if (!board.isPublic && !isMember && !isOwner) {
      return res.status(403).json({ error: 'No permission to view this board' });
    }

    res.json(board);
  } catch (error) {
    console.error('❌ Fetch board error:', error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

/**
 * GET /api/boards/:id/preview
 * Get public preview of a board (for invitations)
 */
router.get('/:id/preview', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('ownerId', 'name avatar')
      .select('name description ownerId isPublic');

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({
      id: board._id,
      name: board.name,
      description: board.description,
      owner: board.ownerId ? board.ownerId.name : 'Unknown',
      ownerAvatar: board.ownerId ? board.ownerId.avatar : ''
    });
  } catch (error) {
    console.error('❌ Board preview error:', error);
    res.status(500).json({ error: 'Failed to fetch board preview' });
  }
});

/**
 * POST /api/boards
 * Create a new board
 */
router.post('/', protect, async (req, res) => {
  try {
    console.log('📝 POST /api/boards - Request body:', req.body);
    console.log('👤 User:', req.user._id, req.user.name);

    const { name, description, isPublic, columns } = req.body;

    if (!name || name.trim() === '') {
      console.log('❌ Validation failed: Board name is required');
      return res.status(400).json({ error: 'Board name is required' });
    }

    console.log('✍️ Creating board with data:', {
      name: name.trim(),
      description: description ? description.trim() : '',
      isPublic: !!isPublic,
      ownerId: req.user._id,
    });

    const board = await Board.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      isPublic: !!isPublic,
      ownerId: req.user._id,
      members: [],
      columns: columns || [
        { id: 'todo', title: 'To Do', position: 0 },
        { id: 'in-progress', title: 'In Progress', position: 1 },
        { id: 'done', title: 'Done', position: 2 }
      ],
    });

    console.log('✅ Board created successfully!');
    console.log('📋 Board details:', {
      _id: board._id,
      name: board.name,
      ownerId: board.ownerId,
      isPublic: board.isPublic
    });

    // Create notification for board creation
    const notification = await Notification.create({
      userId: req.user._id,
      message: `You created a new board: "${board.name}"`,
      type: 'board_created',
      boardId: board._id
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('new_notification', {
        ...notification.toObject(),
        id: notification._id
      });
    }

    res.status(201).json(board);
  } catch (error) {
    console.error('❌ Create board error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create board', details: error.message });
  }
});

/**
 * PUT /api/boards/:id
 * Update a board
 */
router.put('/:id', protect, async (req, res) => {
  try {
    console.log('📝 PUT /api/boards/:id - Board ID:', req.params.id);
    console.log('📝 Update data:', req.body);

    const { id } = req.params;
    const { name, description, isPublic, columns } = req.body;

    const board = await Board.findById(id);
    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ error: 'Board not found' });
    }

    console.log('🔐 Checking ownership - Board ownerId:', board.ownerId, 'User ID:', req.user._id);

    if (!board.ownerId.equals(req.user._id)) {
      console.log('❌ Not authorized');
      return res.status(403).json({ error: 'Not authorized to update this board' });
    }

    if (name !== undefined) board.name = name.trim();
    if (description !== undefined) board.description = description.trim();
    if (isPublic !== undefined) board.isPublic = !!isPublic;
    if (columns !== undefined) board.columns = columns;

    await board.save();
    console.log('✅ Board updated:', board._id);

    res.json(board);
  } catch (error) {
    console.error('❌ Update board error:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

/**
 * DELETE /api/boards/:id
 * Delete a board and associated tasks
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/boards/:id - Board ID:', req.params.id);

    const { id } = req.params;

    const board = await Board.findById(id);
    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!board.ownerId.equals(req.user._id)) {
      console.log('❌ Not authorized');
      return res.status(403).json({ error: 'Not authorized to delete this board' });
    }

    console.log('🗑️ Deleting tasks for board...');
    const deletedTasks = await Task.deleteMany({ boardId: board._id });
    console.log('✅ Deleted tasks:', deletedTasks.deletedCount);

    await Board.deleteOne({ _id: board._id });
    console.log('✅ Board deleted:', id);

    res.json({ message: 'Board and associated tasks deleted successfully' });
  } catch (error) {
    console.error('❌ Delete board error:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

/**
 * POST /api/boards/:id/members
 * Add a member to a board by email
 */
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const { id } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if requester is owner
    if (!board.ownerId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only board owners can add members' });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found. Please invite them via email instead.' });
    }

    // Check if already a member
    const alreadyMember = board.members.some(m => m.id && m.id.equals(userToAdd._id));
    if (alreadyMember || board.ownerId.equals(userToAdd._id)) {
      return res.status(400).json({ error: 'User is already a member or owner of this board' });
    }

    // Add member as pending
    board.members.push({
      id: userToAdd._id,
      name: userToAdd.name,
      email: userToAdd.email,
      role: 'member',
      status: 'pending',
      avatar: userToAdd.avatar || ''
    });

    await board.save();

    // Create notification for the added user
    const notification = await Notification.create({
      userId: userToAdd._id,
      message: `${req.user.name} has invited you to join the board: "${board.name}"`,
      type: 'added_to_board',
      boardId: board._id
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userToAdd._id}`).emit('new_notification', {
        ...notification.toObject(),
        id: notification._id
      });
    }

    // Automatically send invite email
    await sendInviteEmail({
      to: userToAdd.email,
      inviterName: req.user.name,
      boardName: board.name,
      boardId: board._id
    });

    // Return updated board with populated owner for real-time UI update
    const updatedBoard = await Board.findById(board._id).populate('ownerId', 'name email avatar');
    const taskCount = await Task.countDocuments({ boardId: board._id });

    res.json({
      ...updatedBoard.toObject(),
      id: updatedBoard._id,
      taskCount
    });
  } catch (error) {
    console.error('❌ Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

/**
 * DELETE /api/boards/:id/members/:memberId
 * Remove a member from a board
 */
router.delete('/:id/members/:memberId', protect, async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if requester is owner or the member themselves
    const isOwner = board.ownerId.equals(req.user._id);
    const isRemovingSelf = req.user._id.equals(memberId);

    if (!isOwner && !isRemovingSelf) {
      return res.status(403).json({ error: 'Not authorized to remove this member' });
    }

    // Find the member to get their name
    const removedMember = board.members.find(m => m.id && m.id.equals(memberId));
    const removedMemberName = removedMember ? removedMember.name : 'A member';

    // Remove member
    board.members = board.members.filter(m => m.id && !m.id.equals(memberId));
    await board.save();

    // Create notifications for owner and admins
    const notificationPromises = [];
    const notificationMessage = isRemovingSelf
      ? `${removedMemberName} has left the board "${board.name}"`
      : `${req.user.name} removed ${removedMemberName} from board "${board.name}"`;
    const notificationType = isRemovingSelf ? 'member_left' : 'member_removed';

    // Notify owner
    if (!board.ownerId.equals(memberId)) {
      notificationPromises.push(
        Notification.create({
          userId: board.ownerId,
          message: notificationMessage,
          type: notificationType,
          boardId: board._id
        })
      );
    }

    // Notify all admins
    board.members.forEach(m => {
      if (m.role === 'admin' && m.id && !m.id.equals(memberId)) {
        notificationPromises.push(
          Notification.create({
            userId: m.id,
            message: notificationMessage,
            type: notificationType,
            boardId: board._id
          })
        );
      }
    });

    const createdNotifications = await Promise.all(notificationPromises);

    // Socket emission
    const io = req.app.get('io');
    if (io) {
      createdNotifications.forEach(notif => {
        io.to(`user:${notif.userId}`).emit('new_notification', {
          ...notif.toObject(),
          id: notif._id
        });
      });

      // Specific event for the removed member to trigger immediate UI redirect
      if (!isRemovingSelf && removedMember) {
        io.to(`user:${memberId}`).emit('you_were_removed', {
          boardId: board._id,
          boardName: board.name
        });
      }

      // Notify everyone about board update
      io.to(`board:${board._id}`).emit('board_updated', {
        ...board.toObject(),
        id: board._id
      });
    }

    res.json(board);
  } catch (error) {
    console.error('❌ Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * PUT /api/boards/:id/members/:memberId
 * Update a member's role
 */
router.put('/:id/members/:memberId', protect, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "member"' });
    }

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Only board owner can change roles
    if (!board.ownerId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only board owner can change member roles' });
    }

    // Find the member
    const member = board.members.find(m => m.id && m.id.equals(memberId));
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const oldRole = member.role;
    member.role = role;
    await board.save();

    // Create notification for the member whose role was changed
    await Notification.create({
      userId: memberId,
      message: `Your role in board "${board.name}" was changed from ${oldRole} to ${role}`,
      type: 'role_changed',
      boardId: board._id
    });

    console.log(`✅ Member ${memberId} role updated to ${role} in board ${board.name}`);
    res.json(board);
  } catch (error) {
    console.error('❌ Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

/**
 * POST /api/boards/:id/members/accept
 * Accept a board invitation
 */
router.post('/:id/members/accept', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find the member in the board's member list
    const member = board.members.find(m =>
      m.id && m.id.toString() === req.user._id.toString()
    ) || board.members.find(m =>
      m.email === req.user.email
    );

    if (!member) {
      return res.status(404).json({ error: 'You are not an invited member of this board' });
    }

    // Update status and ensure ID is set (in case it was a placeholder)
    member.status = 'active';
    member.id = req.user._id;
    member.name = req.user.name;
    member.avatar = req.user.avatar || '';

    await board.save();

    // Create notification for board owner
    const notification = await Notification.create({
      userId: board.ownerId,
      message: `${req.user.name} has joined the board "${board.name}"`,
      type: 'board_invite', // Reusing board_invite or we could use a new 'member_joined' type
      boardId: board._id
    });

    const io = req.app.get('io');
    if (io) {
      // Notify owner
      io.to(`user:${board.ownerId}`).emit('new_notification', {
        ...notification.toObject(),
        id: notification._id
      });

      // Notify everyone about board update (member status change)
      io.to(`board:${board._id}`).emit('board_updated', {
        ...board.toObject(),
        id: board._id
      });
    }

    console.log(`✅ User ${req.user.email} accepted invitation to board "${board.name}"`);
    res.json(board);
  } catch (error) {
    console.error('❌ Accept invite error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

/**
 * POST /api/boards/:id/members/reject
 * Reject a board invitation
 */
router.post('/:id/members/reject', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find the member in the board's member list
    const member = board.members.find(m =>
      (m.id && m.id.toString() === req.user._id.toString()) ||
      (m.email === req.user.email)
    );

    if (!member) {
      return res.status(404).json({ error: 'You are not an invited member of this board' });
    }

    // Update status to rejected
    member.status = 'rejected';
    await board.save();

    console.log(`❌ User ${req.user.email} rejected invitation to board "${board.name}"`);
    res.json({ message: 'Invitation rejected successfully' });
  } catch (error) {
    console.error('❌ Reject invite error:', error);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
});

export default router;
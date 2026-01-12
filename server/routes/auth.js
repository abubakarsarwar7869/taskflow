import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import EmailVerification from '../models/EmailVerification.js';
import nodemailer from 'nodemailer';
import { protect } from '../middleware/auth.js';
import { generateToken } from './auth_v1/utils.js';
import { sendInviteEmail, createTransporter } from '../utils/email.js';
import { SERVER_CONFIG } from '../config/env.js';
import googleAuthRoutes from './auth_v1/google.js';

const router = express.Router();

// @route   POST /api/auth/send-code
// @desc    Send numeric verification code to email
// @access  Public
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create or update verification record
    await EmailVerification.findOneAndUpdate(
      { email },
      { code, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send email
    const transporter = createTransporter();
    if (!transporter) {
      // In development, we can log the code if transporter is not config
      if (SERVER_CONFIG.NODE_ENV === 'development') {
        console.log(`📡 [DEV] Verification code for ${email}: ${code}`);
        return res.json({ message: 'Code logged to server console (Dev Mode)' });
      }
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const mailOptions = {
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your TaskFlow account',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #667eea;">TaskFlow Verification</h2>
          <p>Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('❌ Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected - cannot perform registration');
      return res.status(503).json({
        error: 'Database not available. Please check MongoDB connection.'
      });
    }

    const { email, password, name, code, boardId } = req.body;

    console.log('📝 Register request received:', { email, name, hasPassword: !!password, hasCode: !!code });

    // Validation
    if (!email || !password || !name || !code) {
      console.log('❌ Validation failed: Missing fields');
      return res.status(400).json({ error: 'Please provide all fields and the verification code' });
    }

    // Verify code
    const verification = await EmailVerification.findOne({ email });
    if (!verification || verification.code !== code) {
      console.log('❌ Invalid or expired verification code');
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const userRole = isFirstUser ? 'admin' : 'user';

    if (isFirstUser) {
      console.log('👑 First user registered - assigning admin role');
    }

    // Create user
    console.log(`✅ Creating new user: ${email} with role: ${userRole}`);
    const user = await User.create({
      email,
      password,
      name,
      role: userRole,
    });

    console.log('👤 User created, ID:', user._id);

    if (user) {
      // Delete verification record
      await EmailVerification.deleteOne({ email });

      // If registered via invitation, add to board
      // If registered via invitation, add to board or update status
      if (boardId) {
        try {
          const board = await Board.findById(boardId);
          if (board) {
            const existingMemberIndex = board.members.findIndex(m => m.email === user.email);

            if (existingMemberIndex !== -1) {
              // Update existing placeholder
              board.members[existingMemberIndex].id = user._id;
              board.members[existingMemberIndex].name = user.name;
              board.members[existingMemberIndex].status = 'active';
              board.members[existingMemberIndex].avatar = user.avatar || '';
            } else {
              // Add new member
              board.members.push({
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'member',
                status: 'active',
                avatar: user.avatar || ''
              });
            }
            await board.save();
            console.log(`🤝 User ${user.email} joined board ${boardId}`);
          }
        } catch (inviteError) {
          console.error('❌ Failed to auto-join board:', inviteError);
        }
      }

      console.log('✅ User created successfully:', user.email);
      res.status(201).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      console.log('❌ Failed to create user');
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      error: error.message || 'Server error during registration',
      details: SERVER_CONFIG.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login request received:', { email, hasPassword: !!password });

    // Validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected - cannot perform login');
      return res.status(503).json({
        error: 'Database not available. Please check MongoDB connection.'
      });
    }

    // Check for user (explicitly include password field for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is OAuth-only (no password)
    if (!user.password) {
      console.log('❌ User is OAuth-only, cannot login with password:', email);
      return res.status(401).json({
        error: 'This account was created with Google. Please use Google login.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for user:', email);

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: error.message || 'Server error during login',
      details: SERVER_CONFIG.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar,
      provider: req.user.provider,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    console.log('📝 Profile update request:', { userId: req.user._id, name, hasAvatar: !!avatar });

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    console.log('✅ Profile updated successfully:', user.email);

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth routes
router.use('/google', googleAuthRoutes);

// @route   DELETE /api/auth/me
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/me', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    // Delete all boards where the user is the owner
    // Note: This will trigger the Board pre('deleteOne') middleware which deletes tasks
    const userBoards = await Board.find({ ownerId: userId });
    for (const board of userBoards) {
      await Board.deleteOne({ _id: board._id });
    }

    // Delete tasks where user is assigned (if any tasks remain where they weren't the board owner)
    await Task.deleteMany({ assignedTo: userId });

    // Delete all notifications for the user
    await Notification.deleteMany({ userId });

    // Remove user from all boards where they are a member
    await Board.updateMany(
      { 'members.id': userId },
      { $pull: { members: { id: userId } } }
    );

    // Finally, delete the user itself
    await User.findByIdAndDelete(userId);

    console.log(`✅ Account successfully deleted for user: ${userId}`);
    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;

import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { generateToken } from './auth/utils.js';
import { SERVER_CONFIG } from '../config/env.js';
import googleAuthRoutes from './auth/google.js';

const router = express.Router();

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

    const { email, password, name } = req.body;

    console.log('📝 Register request received:', { email, name, hasPassword: !!password });

    // Validation
    if (!email || !password || !name) {
      console.log('❌ Validation failed: Missing fields');
      return res.status(400).json({ error: 'Please provide all fields (email, password, name)' });
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
    console.log('✅ Creating new user...');
    const user = await User.create({
      email,
      password,
      name,
      role: userRole,
    });

    if (user) {
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

// Google OAuth routes
router.use('/google', googleAuthRoutes);

export default router;

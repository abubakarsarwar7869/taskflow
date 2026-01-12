import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../../models/User.js';
import Board from '../../models/Board.js';
import { generateToken } from './utils.js';
import { GOOGLE_CONFIG, FRONTEND_CONFIG } from '../../config/env.js';

const router = express.Router();

// Initialize Google OAuth client (if credentials are available)
let googleClient = null;
if (GOOGLE_CONFIG.ENABLED) {
  googleClient = new OAuth2Client(
    GOOGLE_CONFIG.CLIENT_ID,
    GOOGLE_CONFIG.CLIENT_SECRET,
    GOOGLE_CONFIG.REDIRECT_URI
  );
}

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth login
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (!googleClient || !GOOGLE_CONFIG.ENABLED) {
      return res.status(500).json({
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
      });
    }

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.status(500).json({ error: 'Failed to initiate Google login' });
  }
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get('/callback', async (req, res) => {
  try {
    console.log('🔵 Google OAuth callback received');
    const { code, error: oauthError } = req.query;

    // Check for OAuth errors from Google
    if (oauthError) {
      console.error('❌ Google OAuth error:', oauthError);
      return res.redirect(`${FRONTEND_CONFIG.URL}/auth?error=google_auth_failed&details=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect(`${FRONTEND_CONFIG.URL}/auth?error=google_auth_failed&details=no_code`);
    }

    if (!googleClient) {
      console.error('❌ Google OAuth client not initialized');
      return res.redirect(`${FRONTEND_CONFIG.URL}/auth?error=google_not_configured`);
    }

    console.log('🔄 Exchanging code for tokens...');
    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    if (!tokens.id_token) {
      console.error('❌ No ID token received from Google');
      return res.redirect(`${FRONTEND_CONFIG.URL}/auth?error=google_auth_failed&details=no_id_token`);
    }

    console.log('🔄 Verifying ID token...');
    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CONFIG.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      console.error('❌ No email in Google account');
      return res.redirect(`${FRONTEND_CONFIG.URL}/auth?error=no_email`);
    }

    console.log(`✅ Google user authenticated: ${email}`);

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.avatar = picture;
        await user.save();
        console.log(`✅ Updated existing user with Google info: ${email}`);
      } else {
        console.log(`✅ Existing Google user logged in: ${email}`);
      }
    } else {
      // Check if this is the first user (make them admin)
      const userCount = await User.countDocuments();
      const isFirstUser = userCount === 0;
      const userRole = isFirstUser ? 'admin' : 'user';

      if (isFirstUser) {
        console.log('👑 First user registered via Google - assigning admin role');
      }

      // Create new user
      user = await User.create({
        email,
        name,
        googleId,
        provider: 'google',
        avatar: picture,
        role: userRole,
      });
      console.log(`✅ New Google user created: ${email}`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Check if user has any pending board invitations
    const pendingBoards = await Board.find({
      'members': {
        $elemMatch: {
          email: user.email,
          status: 'pending'
        }
      }
    }).limit(1);

    let redirectUrl;
    if (pendingBoards.length > 0) {
      // User has pending invitations - redirect to dashboard with invite params
      const board = pendingBoards[0];
      redirectUrl = `${FRONTEND_CONFIG.URL}/auth?token=${token}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&invite=true&boardId=${board._id}&boardName=${encodeURIComponent(board.name)}`;
      console.log(`🔄 Redirecting to dashboard with pending invitation for board: ${board.name}`);
    } else {
      // No pending invitations - normal redirect
      redirectUrl = `${FRONTEND_CONFIG.URL}/auth?token=${token}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`;
      console.log(`🔄 Redirecting to frontend: ${FRONTEND_CONFIG.URL}/auth`);
    }

    // Redirect to frontend with token
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Provide more specific error information
    let errorDetails = 'google_auth_failed';
    if (error.message?.includes('redirect_uri_mismatch')) {
      errorDetails = 'redirect_uri_mismatch';
    } else if (error.message?.includes('invalid_grant')) {
      errorDetails = 'invalid_grant';
    } else if (error.message?.includes('invalid_client')) {
      errorDetails = 'invalid_client';
    }

    res.redirect(`${FRONTEND_CONFIG.URL}/auth?error=${errorDetails}&details=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
});

// @route   POST /api/auth/google/verify
// @desc    Verify Google ID token (for frontend direct login)
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    if (!googleClient || !GOOGLE_CONFIG.ENABLED) {
      return res.status(500).json({
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
      });
    }

    // Verify the token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CONFIG.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ error: 'No email found in Google account' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.avatar = picture;
        await user.save();
      }
    } else {
      // Check if this is the first user (make them admin)
      const userCount = await User.countDocuments();
      const isFirstUser = userCount === 0;
      const userRole = isFirstUser ? 'admin' : 'user';

      if (isFirstUser) {
        console.log('👑 First user registered via Google - assigning admin role');
      }

      // Create new user
      user = await User.create({
        email,
        name,
        googleId,
        provider: 'google',
        avatar: picture,
        role: userRole,
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
      token,
    });
  } catch (error) {
    console.error('❌ Google token verification error:', error);
    res.status(500).json({ error: 'Failed to verify Google token' });
  }
});

export default router;


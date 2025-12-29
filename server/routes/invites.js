import express from 'express';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { FRONTEND_CONFIG, SERVER_CONFIG } from '../config/env.js';

const router = express.Router();

// Create email transporter (using Gmail)
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('⚠️  Email credentials not configured. Email invitations will not work.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword, // Use App Password for Gmail
    },
  });
};

// @route   POST /api/invites
// @desc    Send invitation email to a user
// @access  Private (Admin only)
router.post('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can send invitations' });
    }

    const { email, boardName, boardId } = req.body;

    // Validation
    if (!email || !boardName) {
      return res.status(400).json({ error: 'Email and board name are required' });
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

    // Create email transporter
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ 
        error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env' 
      });
    }

    // Create invitation link
    const inviteLink = `${FRONTEND_CONFIG.URL}/auth?invite=true&email=${encodeURIComponent(email)}&board=${encodeURIComponent(boardName)}`;

    // Email content
    const mailOptions = {
      from: `"${req.user.name}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invitation to join ${boardName} on TaskFlow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TaskFlow Invitation</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have been invited by <strong>${req.user.name}</strong> to collaborate on the board <strong>"${boardName}"</strong> on TaskFlow.</p>
              <p>TaskFlow is a modern task management application where you can organize your work, collaborate with your team, and stay productive.</p>
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${inviteLink}</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>This invitation was sent from TaskFlow. If you have any questions, please contact the person who invited you.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        TaskFlow Invitation
        
        Hello,
        
        You have been invited by ${req.user.name} to collaborate on the board "${boardName}" on TaskFlow.
        
        TaskFlow is a modern task management application where you can organize your work, collaborate with your team, and stay productive.
        
        Accept your invitation by clicking this link:
        ${inviteLink}
        
        If you didn't expect this invitation, you can safely ignore this email.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Invitation email sent to ${email} for board "${boardName}"`);

    res.json({
      message: 'Invitation email sent successfully',
      email,
      boardName,
    });
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation email',
      details: SERVER_CONFIG.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;


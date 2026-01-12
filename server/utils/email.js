import nodemailer from 'nodemailer';
import { FRONTEND_CONFIG } from '../config/env.js';

/**
 * Creates a nodemailer transporter using credentials from environment variables.
 */
export const createTransporter = () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
        console.warn('⚠️  Email credentials not configured');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
    });
};

/**
 * Sends an invitation email to a user.
 * @param {Object} options - Invitation options
 * @param {string} options.to - Recipient email
 * @param {string} options.inviterName - Name of the person sending the invite
 * @param {string} options.boardName - Name of the board
 * @param {string} options.boardId - ID of the board
 * @returns {Promise<boolean>} - True if sent successfully
 */
export const sendInviteEmail = async ({ to, inviterName, boardName, boardId }) => {
    try {
        const transporter = createTransporter();
        if (!transporter) return false;

        const inviteLink = `${FRONTEND_CONFIG.URL}/auth?invite=true&email=${encodeURIComponent(to)}&boardName=${encodeURIComponent(boardName)}&boardId=${encodeURIComponent(boardId)}`;

        const mailOptions = {
            from: `"TaskFlow Team" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Collaboration Invite: ${boardName} on TaskFlow`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TaskFlow Invitation</title>
          <style>
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #1a1a1a; 
              margin: 0; 
              padding: 0; 
              background-color: #f8fafc;
            }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 48px 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 40px 32px; background: white; }
            .inviter-pill { display: inline-block; padding: 6px 12px; background: #eef2ff; color: #4f46e5; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
            .board-box { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center; }
            .board-name { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
            .button-container { text-align: center; margin-top: 32px; }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background-color: #4f46e5; 
              color: #ffffff !important; 
              text-decoration: none; 
              border-radius: 10px; 
              font-weight: 600; 
              font-size: 16px;
              box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
              transition: transform 0.2s ease;
            }
            .footer { text-align: center; padding: 32px; color: #64748b; font-size: 14px; }
            .secondary-text { color: #64748b; font-size: 15px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>TaskFlow</h1>
              </div>
              <div class="content">
                <div class="inviter-pill">New Invitation</div>
                <p style="font-size: 18px; margin-top: 0;"><strong>${inviterName}</strong> has invited you to join their team.</p>
                <p class="secondary-text">You've been invited to collaborate on the project board:</p>
                
                <div class="board-box">
                  <p class="board-name">${boardName}</p>
                </div>

                <p class="secondary-text">Click the button below to accept the invitation and get started.</p>
                
                <div class="button-container">
                  <a href="${inviteLink}" class="button">Accept Invitation</a>
                </div>
              </div>
              <div class="footer">
                <p>This invitation was sent from TaskFlow.<br>If you didn't expect this, you can safely ignore this email.</p>
                <p style="font-size: 12px; margin-top: 16px;">© 2024 TaskFlow. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
        TaskFlow Invitation
        
        Hello!
        
        ${inviterName} has invited you to collaborate on the board "${boardName}" on TaskFlow.
        
        Accept your invitation by clicking this link:
        ${inviteLink}
        
        If you didn't expect this invitation, you can safely ignore this email.
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Invitation email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending invitation email:', error);
        return false;
    }
};

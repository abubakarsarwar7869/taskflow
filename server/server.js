import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import connectDB from './config/database.js';
import Task from './models/Task.js';
import Notification from './models/Notification.js';
import {
  SERVER_CONFIG,
  CORS_CONFIG,
  validateEnv
} from './config/env.js';

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import boardRoutes from './routes/boards.js';
import inviteRoutes from './routes/invites.js';
import notificationRoutes from './routes/notifications.js';
import commentRoutes from './routes/comments.js';
import uploadRoutes from './routes/uploads.js';

// Validate environment variables
validateEnv();

// Connect to database (non-blocking - server will start even if DB connection fails initially)
connectDB().catch((error) => {
  console.error('⚠️ Database connection failed, but server will continue running');
  console.error('   The server will retry connection on next request');
});

// Initialize Express app
const app = express();

// Middleware - CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin || CORS_CONFIG.ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin} `);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'TaskFlow API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        google: 'GET /api/auth/google (OAuth login)',
        me: 'GET /api/auth/me (protected)'
      },
      tasks: '/api/tasks (protected)',
      boards: '/api/boards (protected)'
    },
    documentation: 'See README.md for API documentation'
  });
});

// API root route
app.get('/api', (req, res) => {
  res.json({
    message: 'TaskFlow API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (requires Bearer token)'
      },
      tasks: {
        list: 'GET /api/tasks (requires Bearer token)',
        create: 'POST /api/tasks (requires Bearer token)',
        update: 'PUT /api/tasks/:id (requires Bearer token)',
        delete: 'DELETE /api/tasks/:id (requires Bearer token)'
      },
      boards: {
        list: 'GET /api/boards (requires Bearer token)',
        create: 'POST /api/boards (requires Bearer token)',
        update: 'PUT /api/boards/:id (requires Bearer token)',
        delete: 'DELETE /api/boards/:id (requires Bearer token)'
      }
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'OK',
    message: 'TaskFlow API is running',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      root: 'GET /',
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (requires Bearer token)'
      },
      tasks: 'GET/POST/PUT/DELETE /api/tasks (requires Bearer token)',
      boards: 'GET/POST/PUT/DELETE /api/boards (requires Bearer token)'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: Origin not allowed' });
  }

  const errorResponse = {
    error: err.message || 'Something went wrong!',
  };

  if (SERVER_CONFIG.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

import { Server } from 'socket.io';
import { createServer } from 'http';

// Periodic task for deadlines
const checkDeadlines = async (io) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Find tasks due within the next 24 hours that haven't been notified for deadline yet
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: tomorrow },
      status: { $ne: 'done' }
    }).populate('boardId');

    for (const task of tasks) {
      // Check if notification already exists
      const existing = await Notification.findOne({
        userId: task.userId,
        taskId: task._id,
        type: 'task_deadline'
      });

      if (!existing && task.boardId) {
        const notification = await Notification.create({
          userId: task.userId,
          message: `Deadline approaching: "${task.title}" in board "${task.boardId.name}" is due within 24 hours!`,
          type: 'task_deadline',
          boardId: task.boardId._id,
          taskId: task._id
        });
        console.log(`⏰ Deadline notification created for task: ${task.title}`);

        // Emit socket event to the user
        if (io) {
          io.to(`user:${task.userId}`).emit('new_notification', notification);
        }
      }
    }
  } catch (error) {
    console.error('❌ Deadline checker error:', error);
  }
};

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_CONFIG.ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Attach io to app for use in routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join_board', (boardId) => {
    socket.join(`board:${boardId}`);
    // console.log(`📥 Socket ${socket.id} joined board:${boardId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user:${userId}`);
    // console.log(`📥 Socket ${socket.id} joined user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Run every hour
setInterval(() => checkDeadlines(io), 3600000);
// Also run on startup after a short delay
setTimeout(() => checkDeadlines(io), 5000);

// Start server with error handling
httpServer.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  console.log(`📍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
});

// Handle server errors
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${SERVER_CONFIG.PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});




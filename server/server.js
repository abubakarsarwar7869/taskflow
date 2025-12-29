import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
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
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Start server with error handling
const server = app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  console.log(`📍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
});

// Handle server errors (like port already in use)
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${SERVER_CONFIG.PORT} is already in use`);
    console.error('💡 Please stop the other process using this port or change PORT in .env');
    console.error('   You can find and stop the process with:');
    console.error(`   Get-NetTCPConnection -LocalPort ${SERVER_CONFIG.PORT} | Select-Object OwningProcess`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});




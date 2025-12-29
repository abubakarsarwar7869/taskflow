# TaskFlow Backend API

Express.js + MongoDB backend for TaskFlow application.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CORS_ORIGIN=http://localhost:8080
   ```
   
   **Note:** The frontend runs on port 8080. You can specify multiple origins separated by commas if needed.

4. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📦 MongoDB Setup

### Option 1: Local MongoDB Installation

1. **Download MongoDB:**
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow official MongoDB installation guide

2. **Start MongoDB service:**
   ```bash
   # Windows (run as Administrator)
   net start MongoDB
   
   # Mac/Linux
   mongod
   ```

3. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskflow
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create a free account:**
   - Go to https://www.mongodb.com/cloud/atlas/register

2. **Create a cluster:**
   - Choose "Free" tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

3. **Set up database access:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"

4. **Configure network access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address

5. **Get connection string:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `taskflow`

6. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tasks
- `GET /api/tasks` - Get all tasks (protected)
- `POST /api/tasks` - Create a task (protected)
- `PUT /api/tasks/:id` - Update a task (protected)
- `DELETE /api/tasks/:id` - Delete a task (protected)

### Boards
- `GET /api/boards` - Get all boards (protected)
- `POST /api/boards` - Create a board (protected)
- `PUT /api/boards/:id` - Update a board (protected)
- `DELETE /api/boards/:id` - Delete a board (protected)

### Health Check
- `GET /api/health` - Check API status

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## 📝 Example API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@taskflow.com",
    "password": "admin123",
    "name": "Admin User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@taskflow.com",
    "password": "admin123"
  }'
```

### Create Task (with token)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "status": "todo",
    "priority": "high",
    "boardId": "BOARD_ID_HERE"
  }'
```

## 🛠️ Development

- The server uses `nodemon` for auto-reload in development mode
- All routes are prefixed with `/api`
- CORS is enabled for frontend communication
- Error handling middleware is included

## 📚 Project Structure

```
server/
├── config/
│   └── database.js       # MongoDB connection
├── middleware/
│   └── auth.js          # Authentication middleware
├── models/
│   ├── User.js          # User model
│   ├── Board.js         # Board model
│   └── Task.js          # Task model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── tasks.js         # Task routes
│   └── boards.js        # Board routes
├── .env.example         # Environment variables template
├── server.js            # Main server file
└── package.json         # Dependencies
```

## 🔧 Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl status mongod
   ```

2. **Verify connection string in `.env`**

3. **Check MongoDB logs for errors**

### Port Already in Use

Change the `PORT` in `.env` file to a different port (e.g., 5001)

### CORS Issues

Make sure `CORS_ORIGIN` in `.env` matches your frontend URL. The default is port 8080. You can specify multiple origins separated by commas if needed.

### Network Errors During Signup

1. **Make sure the backend server is running:**
   ```bash
   cd server
   npm run dev
   ```
   
2. **Verify the server is accessible:**
   - Open http://localhost:5000/api/health in your browser
   - You should see: `{"status":"OK","message":"TaskFlow API is running"}`

3. **Check MongoDB connection:**
   - Look for `✅ MongoDB Connected` in server console
   - If you see connection errors, verify your `MONGODB_URI` in `.env`

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Look for detailed error messages in the Console tab




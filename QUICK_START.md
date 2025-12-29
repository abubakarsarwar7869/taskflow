# TaskFlow - Quick Start Guide

## ✅ What's Been Done

1. ✅ **Removed all Supabase functionality**
2. ✅ **Created simple admin login system**
3. ✅ **Built Express + MongoDB backend structure**
4. ✅ **Created MongoDB setup guide**

## 🔐 Default Admin Login

**Frontend Login Credentials:**
- **Email:** `admin@taskflow.com`
- **Password:** `admin123`

The frontend now uses a simple hardcoded admin authentication. You can log in with these credentials immediately.

## 🚀 Backend Setup (MongoDB + Express)

### Step 1: Set Up MongoDB

Choose one option:

**Option A: MongoDB Atlas (Cloud - Recommended)**
- Follow the detailed guide in `MONGODB_SETUP_GUIDE.md`
- Quick steps:
  1. Sign up at https://www.mongodb.com/cloud/atlas/register
  2. Create a free M0 cluster
  3. Create database user
  4. Configure network access
  5. Copy connection string

**Option B: Local MongoDB**
- Install MongoDB Community Edition
- Start MongoDB service
- Use connection string: `mongodb://localhost:27017/taskflow`

### Step 2: Configure Backend

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Create `.env` file:**
   ```bash
   # Copy the example (or create manually)
   # Create server/.env with:
   ```
   
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskflow
   # OR for Atlas: mongodb+srv://username:password@cluster.mongodb.net/taskflow
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CORS_ORIGIN=http://localhost:8080
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the backend server:**
   ```bash
   # Development mode (auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify it's working:**
   - Open http://localhost:5000/api/health
   - You should see: `{"status":"OK","message":"TaskFlow API is running"}`
   - Check console for: `✅ MongoDB Connected`

## 🎨 Frontend Setup

1. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Access the app:**
   - Open http://localhost:8080
   - Go to `/auth` page
   - Login with: `admin@taskflow.com` / `admin123`

## 📁 Project Structure

```
TaskFlow/
├── src/                    # Frontend React app
│   ├── contexts/
│   │   └── AuthContext.tsx # Admin authentication
│   ├── pages/
│   │   └── Auth.tsx        # Login page
│   └── ...
├── server/                 # Backend Express API
│   ├── config/
│   │   └── database.js    # MongoDB connection
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   ├── Board.js
│   │   └── Task.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── boards.js
│   ├── middleware/
│   │   └── auth.js        # JWT authentication
│   └── server.js          # Main server file
├── MONGODB_SETUP_GUIDE.md # Detailed MongoDB guide
└── QUICK_START.md         # This file
```

## 🔗 Connecting Frontend to Backend

Currently, the frontend uses hardcoded admin credentials. To connect to the backend API:

1. **Backend must be running** on `http://localhost:5000`

2. **Update `src/contexts/AuthContext.tsx`** to call the backend API:
   ```typescript
   const signIn = async (email: string, password: string) => {
     const response = await fetch('http://localhost:5000/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     
     if (response.ok) {
       const data = await response.json();
       // Store token and user data
       localStorage.setItem('token', data.token);
       setUser(data);
       return { error: null };
     } else {
       const error = await response.json();
       return { error: { message: error.error } };
     }
   };
   ```

3. **Register admin user** via API:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@taskflow.com","password":"admin123","name":"Admin"}'
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks (requires auth)
- `POST /api/tasks` - Create task (requires auth)
- `PUT /api/tasks/:id` - Update task (requires auth)
- `DELETE /api/tasks/:id` - Delete task (requires auth)

### Boards
- `GET /api/boards` - Get all boards (requires auth)
- `POST /api/boards` - Create board (requires auth)
- `PUT /api/boards/:id` - Update board (requires auth)
- `DELETE /api/boards/:id` - Delete board (requires auth)

## 🛠️ Next Steps

1. ✅ **MongoDB is set up** - Follow `MONGODB_SETUP_GUIDE.md`
2. ✅ **Backend is running** - Check `server/README.md` for details
3. ✅ **Frontend can login** - Use admin credentials
4. 🔄 **Connect frontend to backend** - Update AuthContext to use API
5. 🔄 **Add API integration** - Connect task/board features to backend

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB is running/connected
- Verify `.env` file exists and has correct values
- Check port 5000 is not in use

### Frontend can't login
- Verify credentials: `admin@taskflow.com` / `admin123`
- Check browser console for errors
- Clear localStorage if needed

### MongoDB connection fails
- Verify connection string in `.env`
- Check MongoDB service is running (local)
- Verify network access (Atlas)
- See `MONGODB_SETUP_GUIDE.md` for detailed troubleshooting

## 📖 Documentation

- **Backend API:** See `server/README.md`
- **MongoDB Setup:** See `MONGODB_SETUP_GUIDE.md`
- **Frontend:** React + TypeScript + Vite

---

**Ready to go!** 🎉

Start with MongoDB setup, then run the backend, and finally test the frontend login.




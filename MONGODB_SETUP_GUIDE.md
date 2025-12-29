# MongoDB Setup Guide for TaskFlow

This guide will help you set up MongoDB for the TaskFlow application. You have two options: **Local MongoDB** or **MongoDB Atlas (Cloud)**.

## 🎯 Option 1: MongoDB Atlas (Cloud) - RECOMMENDED

MongoDB Atlas is a cloud-hosted MongoDB service. It's free for small projects and perfect for development.

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email (or use Google/GitHub)
3. Verify your email address

### Step 2: Create a Free Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (Free forever)
3. Select your preferred **Cloud Provider** and **Region** (choose closest to you)
4. Click **"Create"**
5. Wait 3-5 minutes for cluster creation

### Step 3: Create Database User

1. In the **"Security"** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter:
   - **Username**: `taskflow_admin` (or your choice)
   - **Password**: Create a strong password (save it!)
5. Under **"Database User Privileges"**, select **"Atlas admin"** (or "Read and write to any database")
6. Click **"Add User"**

### Step 4: Configure Network Access

1. In **"Security"** section, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ **Note**: For production, use specific IP addresses only
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** section
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update Your Backend Configuration

1. Open `server/.env` file
2. Replace the connection string:
   ```env
   MONGODB_URI=mongodb+srv://taskflow_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
   ```
   - Replace `YOUR_PASSWORD` with the password you created
   - Replace `cluster0.xxxxx` with your actual cluster address
   - The `/taskflow` part creates/uses a database named "taskflow"

### Step 7: Test Connection

1. Navigate to `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies (if not done):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. You should see:
   ```
   ✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
   🚀 Server running on port 5000
   ```

---

## 🖥️ Option 2: Local MongoDB Installation

If you prefer to run MongoDB on your local machine:

### Windows Installation

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Download and run the installer

2. **Install MongoDB:**
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Check "Install MongoDB Compass" (GUI tool)
   - Click "Install"

3. **Start MongoDB Service:**
   ```powershell
   # Run PowerShell as Administrator
   net start MongoDB
   ```

4. **Verify Installation:**
   - Open MongoDB Compass (installed GUI)
   - Connect to: `mongodb://localhost:27017`

5. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskflow
   ```

### macOS Installation

1. **Install using Homebrew:**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB:**
   ```bash
   brew services start mongodb-community
   ```

3. **Verify:**
   ```bash
   brew services list
   ```

4. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskflow
   ```

### Linux Installation

1. **Import MongoDB public GPG key:**
   ```bash
   curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   ```

2. **Add MongoDB repository:**
   ```bash
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   ```

3. **Install MongoDB:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

4. **Start MongoDB:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

5. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskflow
   ```

---

## 🔗 Connecting Frontend to Backend

Once MongoDB is set up and the backend is running:

1. **Backend should be running on:** `http://localhost:5000`

2. **Update frontend API calls** to point to your backend:
   - Create a file `src/lib/api.ts` or similar
   - Set base URL: `const API_URL = 'http://localhost:5000/api'`

3. **Example API call from frontend:**
   ```typescript
   const response = await fetch('http://localhost:5000/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password })
   });
   ```

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created OR Local MongoDB installed
- [ ] Database user created with username/password
- [ ] Network access configured (Atlas) OR MongoDB service running (Local)
- [ ] Connection string copied and updated in `server/.env`
- [ ] Backend dependencies installed (`npm install` in `server/` folder)
- [ ] Backend server starts without errors
- [ ] See "✅ MongoDB Connected" message in console

---

## 🆘 Troubleshooting

### "MongoServerError: Authentication failed"
- **Solution**: Check username/password in connection string
- Make sure password doesn't contain special characters that need URL encoding

### "MongoNetworkError: connect ECONNREFUSED"
- **Solution**: 
  - For Atlas: Check network access settings
  - For Local: Make sure MongoDB service is running

### "MongoParseError: Invalid connection string"
- **Solution**: Check `.env` file format, ensure no extra spaces or quotes

### Port 27017 already in use (Local)
- **Solution**: MongoDB is already running, or another service is using the port

---

## 📚 Additional Resources

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Local Installation: https://docs.mongodb.com/manual/installation/
- MongoDB Compass (GUI): https://www.mongodb.com/products/compass
- Express + MongoDB Tutorial: https://www.mongodb.com/languages/express-mongodb-rest-api-tutorial

---

## 🎉 Next Steps

After MongoDB is connected:

1. ✅ Backend API is ready to use
2. ✅ You can create users, boards, and tasks
3. ✅ Frontend can connect to backend API
4. ✅ All data will be stored in MongoDB

**Default Admin Login (Frontend):**
- Email: `admin@taskflow.com`
- Password: `admin123`

**Note**: The frontend currently uses a simple hardcoded admin login. To use the backend API, you'll need to:
1. Register the admin user via `/api/auth/register`
2. Update the frontend `AuthContext` to call the backend API instead of hardcoded credentials








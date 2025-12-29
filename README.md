# TaskFlow - Task Management Application

A modern task management application built with React, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   # From root directory
   npm install
   cp .env.example .env
   # Edit .env if needed (optional)
   npm run dev
   ```

## 📁 Project Structure

```
TaskFlow/
├── server/                 # Backend API
│   ├── config/            # Configuration files
│   │   ├── database.js    # MongoDB connection
│   │   └── env.js         # Environment variables config
│   ├── middleware/        # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
├── src/                  # Frontend React app
│   ├── config/           # Frontend configuration
│   ├── contexts/         # React contexts
│   ├── components/       # React components
│   └── pages/            # Page components
└── .env.example          # Environment variables template
```

## ⚙️ Configuration

All configuration is done through environment variables. See:
- `server/.env.example` - Backend configuration
- `.env.example` - Frontend configuration

### Key Environment Variables

**Backend (server/.env):**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Allowed frontend origins
- `FRONTEND_URL` - Frontend URL for OAuth redirects
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (optional)

**Frontend (.env):**
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID (optional)

## 🔐 Authentication

- Email/Password authentication
- Google OAuth login (optional)
- JWT token-based authentication

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md)
- [MongoDB Setup Guide](MONGODB_SETUP_GUIDE.md)
- [Google OAuth Setup](GOOGLE_OAUTH_SETUP.md)

## 🛠️ Development

```bash
# Backend
cd server
npm run dev

# Frontend
npm run dev
```

## 📝 License

ISC

# Quick Start Guide

## 🚀 Running the Finance Tracker Locally

### Step 1: Verify Environment Setup

Make sure you have a `.env` file in the root directory with:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

### Step 2: Start the Backend Server

Open a terminal in the project root and run:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

You should see:
- ✅ "Connected to MongoDB Atlas!"
- ✅ "Server is running on port 3000"

### Step 3: Start the Frontend

Open a **new terminal** and navigate to the frontend directory:
```bash
cd finance-tracker-frontend
npm start
```

The React app will automatically open in your browser at `http://localhost:3000`

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **Backend Health Check**: http://localhost:3000/

## 📋 What You'll See

1. **Dashboard View**: 
   - Monthly summary cards (Income, Expenses, Savings, Investments)
   - Transaction list with add/edit/delete functionality
   - Account balance tracking
   - Credit card summary

2. **Search View**:
   - Advanced search with multiple filters
   - Transaction suggestions/autocomplete
   - Category breakdowns

## ⚠️ Important Notes

- The app currently uses a hardcoded user ID. You'll need to create a user in MongoDB or update the `userId` in `finance-tracker-frontend/src/Dashboard.js`
- Make sure MongoDB is accessible (check your connection string)
- Both servers need to run simultaneously (backend + frontend)

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB connection string is correct in `.env`
- Ensure port 3000 is not already in use

**Frontend can't connect to backend:**
- Verify backend is running on port 3000
- Check browser console for CORS errors
- Ensure both servers are running

**CORS Errors:**
- The backend now allows `http://localhost:3000` and `http://localhost:3001`
- If React runs on a different port, update `allowedOrigins` in `index.js`


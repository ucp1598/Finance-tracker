# Finance Tracker Application

A full-stack personal finance tracking application built with Node.js/Express backend and React frontend.

## Project Structure

```
Project-Finance_Tracker/
├── Backend (Root Directory)
│   ├── index.js                 # Express server entry point
│   ├── models/                  # MongoDB Mongoose models
│   │   ├── User.js             # User model (empty - may need implementation)
│   │   ├── Transaction.js      # Transaction model with monthly summary logic
│   │   └── Account.js           # Bank account model
│   ├── routes/                  # API route handlers
│   │   ├── transactionRoutes.js # Transaction CRUD operations
│   │   ├── accountRoutes.js     # Account management
│   │   ├── creditCardRoutes.js # Credit card tracking
│   │   └── userRoutes.js       # User management (empty)
│   └── package.json            # Backend dependencies
│
└── finance-tracker-frontend/    # React Frontend
    ├── src/
    │   ├── App.js              # Main app component with navigation
    │   ├── Dashboard.js        # Main dashboard with transaction management
    │   ├── EnhancedSearch.js   # Advanced search functionality
    │   ├── components/         # Reusable components
    │   │   ├── TransactionForm.js
    │   │   ├── SummaryCards.js
    │   │   ├── CreditCardSummary.js
    │   │   └── OptionsEditor.js
    │   └── config.js           # API configuration
    └── package.json            # Frontend dependencies
```

## Features

- **Transaction Management**: Add, edit, delete transactions (expenses, income, transfers, credit card payments)
- **Account Tracking**: Track bank account balances by month
- **Credit Card Tracking**: Monitor credit card expenses and payments
- **Advanced Search**: Filter transactions by multiple criteria (date range, amount, category, payee, etc.)
- **Monthly Summary**: View income, expenses, savings, and investments breakdown
- **Analytics**: Spending trends and category-wise analysis
- **Needs/Wants Classification**: Categorize expenses as Needs, Wants, Savings, or Investments

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- CORS enabled for frontend communication

### Frontend
- React 19
- Axios for API calls
- Chart.js for data visualization (via react-chartjs-2)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the root directory:
```bash
cd Project-Finance_Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

4. Start the backend server:
```bash
npm start
# OR for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd finance-tracker-frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file if you want to customize the API URL:
```env
REACT_APP_API_URL=http://localhost:3000
```

4. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` (or another port if 3000 is taken)

**Note**: The backend CORS is configured to allow `http://localhost:3001`, but React defaults to port 3000. If you run the frontend on port 3000, you may need to update the CORS configuration in `index.js`.

## API Endpoints

### Transactions
- `POST /api/transactions/add` - Create a new transaction
- `GET /api/transactions/user/:userId` - Get all transactions for a user
- `GET /api/transactions/search/:userId` - Advanced search with filters
- `GET /api/transactions/summary/:userId` - Monthly summary
- `GET /api/transactions/analytics/:userId` - Spending trends
- `PUT /api/transactions/:transactionId` - Update a transaction
- `DELETE /api/transactions/:transactionId` - Delete a transaction

### Accounts
- `GET /api/accounts/user/:userId` - Get accounts for a user
- `POST /api/accounts` - Create/update an account

### Credit Cards
- `GET /api/creditcards/user/:userId` - Get credit cards for a user
- `POST /api/creditcards` - Create/update a credit card

## Important Notes

1. **User ID**: The frontend currently has a hardcoded user ID (`68d669f0d712f627d829c474`) in `Dashboard.js`. You may want to implement proper authentication.

2. **MongoDB Connection**: Make sure your MongoDB connection string is correct in the `.env` file.

3. **CORS Configuration**: The backend allows requests from `http://localhost:3001` and a Vercel deployment URL. Update `index.js` if you need different origins.

4. **Port Configuration**: 
   - Backend: Port 3000 (configurable via PORT env variable)
   - Frontend: Port 3000 by default (React), but CORS expects 3001

## Troubleshooting

- **MongoDB Connection Error**: Verify your `MONGODB_URI` in the `.env` file
- **CORS Errors**: Check that the frontend URL matches the allowed origins in `index.js`
- **Port Conflicts**: If port 3000 is taken, React will automatically use another port. Update CORS accordingly.

## Development

- Backend uses `nodemon` for auto-reload during development (`npm run dev`)
- Frontend uses React's hot-reload feature automatically


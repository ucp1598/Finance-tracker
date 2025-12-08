const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Utility to escape regex special characters
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/* CREATE */
router.post('/add', async (req, res) => {
  try {
    // LOG request body for debugging every POST
    console.log("POST /add req.body:", req.body);

    // Convert user field to ObjectId if needed
    if (req.body.user && typeof req.body.user === "string" && mongoose.Types.ObjectId.isValid(req.body.user)) {
      req.body.user = new mongoose.Types.ObjectId(req.body.user);
    }

    // Always set a valid date, fallback to current
    if (!req.body.date || isNaN(new Date(req.body.date).getTime())) {
      req.body.date = new Date();
    }

    // Create and save
    const saved = await new Transaction(req.body).save();
    // Log successful save
    console.log("Saved transaction:", saved);

    res.status(201).json(saved);
  } catch (err) {
    // LOG errors for diagnostics
    console.error("Add transaction error:", err);
    res.status(400).json({ error: err.message });
  }
});

/* READ all for a user */
router.get('/user/:userId', async (req, res) => {
  try {
    const txns = await Transaction.find({ user: req.params.userId });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ENHANCED GLOBAL SEARCH WITH ADVANCED FILTERS */
router.get('/search/:userId', async (req, res) => {
  try {
    const { 
      search, category, expenseType, type, mode, payee,
      paymentMethod, paymentApp, startDate, endDate, minAmount, maxAmount,
      needsWants, limit = 100
    } = req.query;

    let query = { user: req.params.userId };

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { payee: searchRegex },
        { remarks: searchRegex },
        { expenseType: searchRegex },
        { paymentMethod: searchRegex },
        { paymentApp: searchRegex }
      ];
    }
    if (category) query.category = category;
    if (expenseType) query.expenseType = expenseType;
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentApp) query.paymentApp = paymentApp;
    if (mode) query.mode = { $regex: escapeRegex(mode), $options: 'i' };
    if (payee && !search) query.payee = { $regex: escapeRegex(payee), $options: 'i' };
    if (needsWants) query.needsWants = needsWants;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date.$lte = endDateTime;
      }
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    const transactions = await Transaction
      .find(query)
      .sort({ date: -1 })
      .limit(Number(limit));

    const totalExpenses = transactions.reduce((sum, t) => 
      sum + (t.type === 'expense' || t.type === 'saved' || t.type === 'credit_card_payment' ? t.amount : 0), 0);

    const totalIncome = transactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : 0), 0);

    // Category breakdown
    const categoryBreakdown = {};
    const typeBreakdown = {};

    transactions.forEach(t => {
      if (t.expenseType) {
        categoryBreakdown[t.expenseType] = (categoryBreakdown[t.expenseType] || 0) + t.amount;
      }
      typeBreakdown[t.type] = (typeBreakdown[t.type] || 0) + t.amount;
    });

    res.json({
      transactions,
      count: transactions.length,
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      categoryBreakdown,
      typeBreakdown,
      searchQuery: req.query,
      dateRange: {
        earliest: transactions.length ? transactions[transactions.length - 1].date : null,
        latest: transactions.length ? transactions[0].date : null
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* QUICK FILTER: Recent transactions */
router.get('/recent/:userId', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const transactions = await Transaction
      .find({
        user: req.params.userId,
        date: { $gte: startDate }
      })
      .sort({ date: -1 })
      .limit(50);

    const totalExpenses = transactions.reduce((sum, t) => 
      sum + (t.type === 'expense' || t.type === 'saved' || t.type === 'credit_card_payment' ? t.amount : 0), 0);

    const totalIncome = transactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : 0), 0);

    res.json({
      transactions,
      count: transactions.length,
      totalExpenses,
      totalIncome,
      period: `Last ${days} days`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* QUICK FILTER: Category search */
router.get('/category/:userId/:category', async (req, res) => {
  try {
    const { userId, category } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await Transaction
      .find({
        user: userId,
        $or: [
          { category: category },
          { expenseType: category },
          { needsWants: category }
        ]
      })
      .sort({ date: -1 })
      .limit(Number(limit));

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      transactions,
      count: transactions.length,
      totalAmount,
      category: category
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SEARCH SUGGESTIONS: Get unique values for autocomplete */
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const { field } = req.query; // payee, expenseType, mode, etc.
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    let pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } }
    ];

    if (field === 'payee') {
      pipeline.push(
        { $group: { _id: '$payee', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      );
    } else if (field === 'expenseType') {
      pipeline.push(
        { $group: { _id: '$expenseType', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      );
    } else if (field === 'mode') {
      pipeline.push(
        { $group: { _id: '$mode', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      );
    }

    const results = await Transaction.aggregate(pipeline);
    const suggestions = results.map(r => r._id).filter(Boolean);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ANALYTICS: Spending trends */
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const { userId } = req.params;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const pipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    const trends = await Transaction.aggregate(pipeline);

    // Category-wise spending
    const categoryPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: { $in: ['expense', 'saved', 'credit_card_payment'] },
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$expenseType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ];

    const categorySpending = await Transaction.aggregate(categoryPipeline);

    res.json({
      trends,
      categorySpending,
      period: `Last ${months} months`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* MONTHLY SUMMARY */
router.get('/summary/:userId', async (req, res) => {
  try {
    const { month, year } = req.query;
    const data = await Transaction.getMonthlySummary(
      req.params.userId,
      Number(month),
      Number(year)
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE */
router.put('/:transactionId', async (req, res) => {
  try {
    // It's a good practice to ensure the user owns the transaction they are updating.
    // Assuming the user's ID is sent in the body.
    const userId = req.body.user;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for an update.' });
    }

    // The user ID from the body is used for authorization in the query.
    // It's good practice to remove it from the update payload to prevent it from being changed.
    const updatePayload = { ...req.body };
    delete updatePayload.user;

    const updated = await Transaction.findByIdAndUpdate(
      { _id: req.params.transactionId, user: userId },
      updatePayload,
      { new: true });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* DELETE */
router.delete('/:transactionId', async (req, res) => {
  try {
    // To be fully secure, the user's ID should be passed, e.g., from an auth token.
    // For now, we can assume it's in the request body for consistency.
    const userId = req.body.user; 
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for deletion.' });
    }
    const result = await Transaction.findOneAndDelete({ _id: req.params.transactionId, user: userId });
    if (!result) return res.status(404).json({ error: 'Transaction not found or user not authorized.' });
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

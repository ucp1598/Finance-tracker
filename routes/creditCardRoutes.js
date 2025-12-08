const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const creditCardNames = [
  "Coral GPay CC",
  "MMT Mastercard",
  "Coral Paytm CC",
  "SBI Elite VISA 8359"
  // Add any new card "mode" value here as needed
];

// GET /api/creditcards/summary/:userId?month=9&year=2025
router.get("/summary/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    const start = new Date(`${year}-${month}-01`);
    const end = new Date(year, Number(month), 0, 23, 59, 59, 999);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    // Single aggregation pipeline for better performance
    const summary = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: start, $lte: end },
          mode: { $in: creditCardNames },
          type: { $in: ["expense", "credit_card_payment"] }
        }
      },
      {
        $group: {
          _id: "$mode",
          totalSpent: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
          },
          totalRepaid: {
            $sum: { $cond: [{ $eq: ["$type", "credit_card_payment"] }, "$amount", 0] }
          }
        }
      }
    ]);

    // Map the results to the full list of cards
    const output = creditCardNames.map(card => {
      const cardData = summary.find(s => s._id === card);
      return {
        card,
        totalSpent: cardData?.totalSpent || 0,
        totalRepaid: cardData?.totalRepaid || 0,
        balance: (cardData?.totalSpent || 0) - (cardData?.totalRepaid || 0)
      };
    });

    res.json({ cards: output, query: { month, year } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

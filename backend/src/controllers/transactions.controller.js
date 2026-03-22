import Transaction from '../models/transactions.model.js';
import Session from '../models/sessions.model.js';

// Get paginated transactions for the logged-in therapist
export const getMyTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ therapist: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ therapist: req.user._id });

    res.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// Calculate real-time earnings (Total Earned vs Total Withdrawn)
export const getMyEarnings = async (req, res, next) => {
  try {
    const therapistId = req.user._id;

    const earnings = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const withdrawals = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalEarned = earnings.length > 0 ? earnings[0].total : 0;
    const totalWithdrawn = withdrawals.length > 0 ? withdrawals[0].total : 0;
    const availableBalance = totalEarned - totalWithdrawn;

    // This month earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEarnings = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'earning', status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Today earnings
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEarnings = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'earning', status: 'completed', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Pending withdrawals
    const pendingWithdrawals = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'withdrawal', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find({ therapist: therapistId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Total completed sessions
    const completedSessions = await Session.countDocuments({
      therapist: therapistId,
      status: 'completed',
    }).catch(() => 0);

    res.json({
      totalEarned,
      totalWithdrawn,
      availableBalance,
      thisMonth: monthEarnings.length > 0 ? monthEarnings[0].total : 0,
      thisMonthSessions: monthEarnings.length > 0 ? monthEarnings[0].count : 0,
      today: todayEarnings.length > 0 ? todayEarnings[0].total : 0,
      todaySessions: todayEarnings.length > 0 ? todayEarnings[0].count : 0,
      pendingAmount: pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0,
      completedSessions,
      recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// Request a withdrawal
export const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, upiId } = req.body;
    const therapistId = req.user._id;

    if (!amount || !upiId) {
      return res.status(400).json({ message: 'Amount and UPI ID are required' });
    }

    // Check balance first
    const earnings = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const withdrawals = await Transaction.aggregate([
      { $match: { therapist: therapistId, type: 'withdrawal', status: { $in: ['completed', 'pending'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalEarned = earnings.length > 0 ? earnings[0].total : 0;
    const totalWithdrawn = withdrawals.length > 0 ? withdrawals[0].total : 0;
    const availableBalance = totalEarned - totalWithdrawn;

    if (amount > availableBalance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      therapist: therapistId,
      amount,
      type: 'withdrawal',
      status: 'completed', // Dummy instant completion as per request
      description: `Withdrawal to UPI: ${upiId}`,
      upiId
    });

    res.status(201).json({ success: true, transaction, message: 'Withdrawal successful' });
  } catch (error) {
    next(error);
  }
};

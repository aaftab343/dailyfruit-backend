import Wallet from '../models/Wallet.js';
import User from '../models/User.js';

const ensureWalletForUser = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
  }
  return wallet;
};

export const getMyWallet = async (req, res) => {
  try {
    const wallet = await ensureWalletForUser(req.user._id);
    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (err) {
    console.error('getMyWallet error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await ensureWalletForUser(userId);
    res.json(wallet);
  } catch (err) {
    console.error('adminGetUserWallet error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminAdjustWallet = async (req, res) => {
  try {
    const { userId } = req.body;
    let { amount, type, remark } = req.body;
    amount = Number(amount || 0);

    if (!userId || !amount || !type) {
      return res.status(400).json({ message: 'userId, amount and type are required' });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await ensureWalletForUser(userId);

    if (type === 'debit' && wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    if (type === 'credit') {
      wallet.balance += amount;
    } else {
      wallet.balance -= amount;
    }

    wallet.transactions.push({
      type,
      amount,
      remark: remark || `Admin ${type}`
    });

    await wallet.save();

    res.json({ message: 'Wallet updated', wallet });
  } catch (err) {
    console.error('adminAdjustWallet error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

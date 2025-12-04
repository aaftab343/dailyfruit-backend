import User from '../models/User.js';
import Referral from '../models/Referral.js';

const generateReferralCode = (user) => {
  const base = user.name?.split(' ')[0] || 'USER';
  const slug = base.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
  const random = user._id.toString().slice(-4).toUpperCase();
  return `${slug}${random}`;
};

export const getMyReferralInfo = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user);
      await user.save();
    }

    const referrals = await Referral.find({ referrerUserId: user._id }).populate('referredUserId', 'name email');
    const completed = referrals.filter(r => r.status === 'completed').length;

    res.json({
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      completedReferrals: completed,
      referrals
    });
  } catch (err) {
    console.error('getMyReferralInfo error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminListReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({})
      .populate('referrerUserId', 'name email')
      .populate('referredUserId', 'name email')
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (err) {
    console.error('adminListReferrals error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

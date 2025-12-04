import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("getProfile error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, addressDetails, address, userType, offersOptIn, deliveryTime } = req.body;
    const update = {};
    if (fullName) update.name = fullName;
    if (phone) update.phone = phone;
    if (address) update.address = address;
    if (addressDetails) update.addressDetails = addressDetails;
    if (userType) update.userType = userType;
    if (typeof offersOptIn === 'boolean') update.offersOptIn = offersOptIn;
    if (deliveryTime) update.deliveryTime = deliveryTime;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error("updateProfile error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

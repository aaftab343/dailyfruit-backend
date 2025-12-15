import User from "../models/User.js";

/* GET MY PROFILE */
export const getMe = async (req, res) => {
  res.json(req.user);
};

/* GET MY ADDRESSES */
export const getMyAddresses = async (req, res) => {
  res.json({ addresses: req.user.addresses || [] });
};

/* ADD NEW ADDRESS */
export const addUserAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.isDefault) {
    user.addresses.forEach(a => a.isDefault = false);
  }

  user.addresses.push(req.body);
  await user.save();

  res.json({ ok: true, addresses: user.addresses });
};

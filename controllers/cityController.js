import City from '../models/City.js';

export const getActiveCities = async (req, res) => {
  try {
    const cities = await City.find({ active: true }).sort({ name: 1 });
    res.json(cities);
  } catch (err) {
    console.error('getActiveCities error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateCity = async (req, res) => {
  try {
    const { name, slug, deliveryFee, minOrderAmount, zones } = req.body;
    const existing = await City.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Slug already exists' });

    const city = await City.create({
      name,
      slug,
      deliveryFee,
      minOrderAmount,
      zones: zones || []
    });

    res.status(201).json(city);
  } catch (err) {
    console.error('adminCreateCity error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByIdAndUpdate(id, req.body, { new: true });
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.json(city);
  } catch (err) {
    console.error('adminUpdateCity error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminToggleCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);
    if (!city) return res.status(404).json({ message: 'City not found' });
    city.active = !city.active;
    await city.save();
    res.json(city);
  } catch (err) {
    console.error('adminToggleCity error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

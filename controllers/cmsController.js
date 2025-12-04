import Banner from '../models/Banner.js';

export const getBanners = async (req, res) => {
  try {
    const { citySlug, position } = req.query;
    const filter = { active: true };

    if (position) filter.position = position;
    if (citySlug) {
      filter.$or = [{ citySlug }, { citySlug: { $exists: false } }, { citySlug: null }];
    }

    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error('getBanners error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err) {
    console.error('adminCreateBanner error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(id, req.body, { new: true });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    console.error('adminUpdateBanner error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminToggleBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    banner.active = !banner.active;
    await banner.save();
    res.json(banner);
  } catch (err) {
    console.error('adminToggleBanner error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

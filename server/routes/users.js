const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const COMMON = ['name', 'phone', 'address'];
const PROVIDER_ONLY = ['category', 'bio', 'hourlyRate', 'isAvailable'];

// Update own profile
router.put('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    const allowed = user.role === 'provider' ? [...COMMON, ...PROVIDER_ONLY] : COMMON;

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    const { lat, lng } = req.body;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      user.location = { type: 'Point', coordinates: [lng, lat] };
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = req.body.password;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Public provider profile
router.get('/provider/:id', async (req, res) => {
  const provider = await User.findOne({ _id: req.params.id, role: 'provider' }).select(
    'name category bio hourlyRate rating ratingCount isAvailable phone'
  );
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json({ provider });
});

module.exports = router;

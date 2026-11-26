const router = require('express').Router();
const User = require('../models/User');

// GET /api/workers/nearby?lat=..&lng=..&radius=10&category=Plumbing
// radius is in kilometres. Results include `distance` in metres, nearest first.
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radius) || 10;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const query = { role: 'provider', isAvailable: true };
    if (req.query.category) query.category = req.query.category;

    const workers = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query,
        },
      },
      { $limit: 50 },
      { $project: { password: 0, email: 0, __v: 0 } },
    ]);

    res.json({ workers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

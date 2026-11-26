const router = require('express').Router();
const Service = require('../models/Service');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

const PROVIDER_FIELDS = 'name category rating ratingCount hourlyRate isAvailable bio phone';

// Browse services (public). Filters: category, q (text), provider
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.provider) filter.provider = req.query.provider;
    if (req.query.q) {
      const rx = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { description: rx }];
    }
    const services = await Service.find(filter)
      .populate('provider', PROVIDER_FIELDS)
      .sort('-createdAt');
    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/categories', (_req, res) => res.json({ categories: User.CATEGORIES }));

// Services owned by the logged in provider (includes inactive)
router.get('/mine', protect, restrictTo('provider'), async (req, res) => {
  const services = await Service.find({ provider: req.user.id }).sort('-createdAt');
  res.json({ services });
});

router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('provider', PROVIDER_FIELDS);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ service });
  } catch {
    res.status(404).json({ message: 'Service not found' });
  }
});

router.post('/', protect, restrictTo('provider'), async (req, res) => {
  try {
    const { title, description, category, price, durationMinutes } = req.body;
    const service = await Service.create({
      title,
      description,
      category: category || req.user.category,
      price,
      durationMinutes,
      provider: req.user.id,
    });
    res.status(201).json({ service });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, restrictTo('provider'), async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, provider: req.user.id });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    ['title', 'description', 'category', 'price', 'durationMinutes', 'isActive'].forEach((f) => {
      if (req.body[f] !== undefined) service[f] = req.body[f];
    });
    await service.save();
    res.json({ service });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, restrictTo('provider'), async (req, res) => {
  const service = await Service.findOneAndDelete({ _id: req.params.id, provider: req.user.id });
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json({ message: 'Service deleted' });
});

module.exports = router;

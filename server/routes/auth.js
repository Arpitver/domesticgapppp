const router = require('express').Router();
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, category } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const safeRole = role === 'provider' ? 'provider' : 'customer';
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: safeRole,
      ...(safeRole === 'provider' && category ? { category } : {}),
    });

    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.matchPassword(password || ''))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user.id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;

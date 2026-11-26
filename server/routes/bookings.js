const router = require('express').Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { protect, restrictTo } = require('../middleware/auth');

const populateAll = (q) =>
  q
    .populate('service', 'title category price durationMinutes')
    .populate('customer', 'name phone address')
    .populate('provider', 'name phone category location rating');

// Notify both parties (and anyone watching the booking room) about a change
function broadcast(io, booking, event) {
  const payload = { booking };
  io.to(`user:${booking.customer._id || booking.customer}`).emit(event, payload);
  io.to(`user:${booking.provider._id || booking.provider}`).emit(event, payload);
  io.to(`booking:${booking.id}`).emit(event, payload);
}

// Customer creates a booking
router.post('/', protect, restrictTo('customer'), async (req, res) => {
  try {
    const { serviceId, scheduledAt, address, notes, lat, lng } = req.body;
    if (!serviceId || !scheduledAt || !address) {
      return res.status(400).json({ message: 'Service, date/time and address are required' });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Please pick the service location on the map' });
    }
    if (new Date(scheduledAt) < new Date(Date.now() - 60 * 1000)) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) return res.status(404).json({ message: 'Service not found' });

    const booking = await Booking.create({
      customer: req.user.id,
      provider: service.provider,
      service: service.id,
      scheduledAt,
      address,
      notes,
      price: service.price,
      location: { type: 'Point', coordinates: [lng, lat] },
    });

    const full = await populateAll(Booking.findById(booking.id));
    broadcast(req.app.get('io'), full, 'booking:new');
    res.status(201).json({ booking: full });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Booking history for the logged-in user (customer or provider)
router.get('/mine', protect, async (req, res) => {
  const field = req.user.role === 'provider' ? 'provider' : 'customer';
  const filter = { [field]: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await populateAll(Booking.find(filter).sort('-createdAt'));
  res.json({ bookings });
});

router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await populateAll(Booking.findById(req.params.id));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const uid = req.user.id;
    if (booking.customer.id !== uid && booking.provider.id !== uid) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    res.json({ booking });
  } catch {
    res.status(404).json({ message: 'Booking not found' });
  }
});

// Change status. Allowed transitions depend on the caller's role.
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const uid = req.user.id;
    const isProvider = booking.provider.toString() === uid;
    const isCustomer = booking.customer.toString() === uid;
    if (!isProvider && !isCustomer) return res.status(403).json({ message: 'Not your booking' });

    const role = isProvider ? 'provider' : 'customer';
    const allowed = (Booking.TRANSITIONS[role] || {})[booking.status] || [];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: `Cannot change status from "${booking.status}" to "${status}"` });
    }

    booking.status = status;
    await booking.save();

    const full = await populateAll(Booking.findById(booking.id));
    broadcast(req.app.get('io'), full, 'booking:updated');
    res.json({ booking: full });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

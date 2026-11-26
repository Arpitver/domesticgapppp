const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Booking = require('./models/Booking');

module.exports = function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
  });

  // Authenticate every socket with the same JWT used for the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.user.id;
    // Personal room: booking notifications for this user
    socket.join(`user:${uid}`);

    // Join a booking room to receive live location + status updates
    socket.on('booking:join', async (bookingId, ack) => {
      try {
        const booking = await Booking.findById(bookingId).populate('provider', 'location');
        const isParty =
          booking &&
          (booking.customer.toString() === uid || booking.provider.id === uid);
        if (!isParty) return ack && ack({ ok: false, message: 'Not allowed' });

        socket.join(`booking:${bookingId}`);
        const coords = booking.provider.location && booking.provider.location.coordinates;
        ack &&
          ack({
            ok: true,
            status: booking.status,
            providerLocation: coords ? { lat: coords[1], lng: coords[0] } : null,
          });
      } catch {
        ack && ack({ ok: false, message: 'Could not join booking' });
      }
    });

    socket.on('booking:leave', (bookingId) => socket.leave(`booking:${bookingId}`));

    // Provider streams their position during an active booking
    socket.on('location:update', async ({ bookingId, lat, lng } = {}) => {
      try {
        if (socket.user.role !== 'provider') return;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const booking = await Booking.findById(bookingId);
        if (!booking || booking.provider.toString() !== uid) return;
        if (!Booking.TRACKABLE.includes(booking.status)) return;

        await User.updateOne(
          { _id: uid },
          { location: { type: 'Point', coordinates: [lng, lat] } }
        );

        io.to(`booking:${bookingId}`).emit('location:updated', {
          bookingId,
          lat,
          lng,
          at: Date.now(),
        });
      } catch (err) {
        console.error('location:update failed', err.message);
      }
    });
  });

  return io;
};

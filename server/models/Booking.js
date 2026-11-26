const mongoose = require('mongoose');

const STATUSES = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
];

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    scheduledAt: { type: Date, required: true },
    address: { type: String, required: true },
    notes: { type: String, default: '' },
    // Where the service takes place, as [lng, lat]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    price: { type: Number, required: true },
    status: { type: String, enum: STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });

// Which transitions each role may perform
bookingSchema.statics.TRANSITIONS = {
  provider: {
    pending: ['accepted', 'rejected'],
    accepted: ['on_the_way'],
    on_the_way: ['in_progress'],
    in_progress: ['completed'],
  },
  customer: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
  },
};

bookingSchema.statics.TRACKABLE = ['accepted', 'on_the_way', 'in_progress'];

module.exports = mongoose.model('Booking', bookingSchema);

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, default: 60 },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);

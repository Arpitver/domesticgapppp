const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Carpentry',
  'Painting',
  'Appliance Repair',
  'Gardening',
  'Pest Control',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['customer', 'provider'], default: 'customer' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },

    // GeoJSON point [lng, lat]. Left undefined until the user sets a location.
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },

    // Provider-only fields
    category: { type: String, enum: CATEGORIES },
    bio: { type: String, default: '' },
    hourlyRate: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
module.exports.CATEGORIES = CATEGORIES;

// Usage: npm run seed   (wipes users, services and bookings, then adds demo data)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Service = require('./models/Service');
const Booking = require('./models/Booking');

// Demo data is centred on Bengaluru. Change CENTER to seed around your own city.
const CENTER = { lat: 12.9716, lng: 77.5946 };
const jitter = () => (Math.random() - 0.5) * 0.08; // roughly +/- 4 km

const providers = [
  { name: 'Ravi Kumar', category: 'Plumbing', rate: 400, bio: '10 years fixing leaks and fitting bathrooms.' },
  { name: 'Anita Sharma', category: 'Cleaning', rate: 300, bio: 'Deep cleaning for homes and apartments.' },
  { name: 'Mohammed Irfan', category: 'Electrical', rate: 450, bio: 'Licensed electrician. Wiring, fans, inverters.' },
  { name: 'Suresh Patil', category: 'Carpentry', rate: 500, bio: 'Custom furniture and quick repairs.' },
  { name: 'Lakshmi Devi', category: 'Painting', rate: 350, bio: 'Interior and exterior painting.' },
  { name: 'Arjun Reddy', category: 'Appliance Repair', rate: 420, bio: 'AC, washing machine and fridge repair.' },
];

const servicesFor = {
  Plumbing: [['Leak repair', 'Fix taps, pipes and joints.', 399], ['Bathroom fitting', 'Install fixtures and fittings.', 1499]],
  Cleaning: [['Full home deep clean', 'Kitchen, bathrooms and floors.', 1999], ['Sofa & carpet cleaning', 'Steam cleaning.', 799]],
  Electrical: [['Fan / light installation', 'Install or replace fixtures.', 299], ['Wiring inspection', 'Safety check and fixes.', 599]],
  Carpentry: [['Furniture repair', 'Doors, drawers, beds.', 499], ['Custom shelving', 'Built to your measurements.', 2499]],
  Painting: [['Room painting', 'Per room, paint extra.', 2999]],
  'Appliance Repair': [['AC service', 'Cleaning and gas check.', 699], ['Washing machine repair', 'Diagnosis and repair.', 549]],
};

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), Service.deleteMany({}), Booking.deleteMany({})]);

  await User.create({
    name: 'Demo Customer',
    email: 'customer@demo.com',
    password: 'password123',
    role: 'customer',
    phone: '9000000001',
    address: 'MG Road, Bengaluru',
    location: { type: 'Point', coordinates: [CENTER.lng, CENTER.lat] },
  });

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const user = await User.create({
      name: p.name,
      email: i === 0 ? 'provider@demo.com' : `provider${i + 1}@demo.com`,
      password: 'password123',
      role: 'provider',
      phone: `90000001${i}0`,
      category: p.category,
      bio: p.bio,
      hourlyRate: p.rate,
      rating: 4 + Math.round(Math.random() * 10) / 10,
      ratingCount: 10 + Math.floor(Math.random() * 90),
      location: { type: 'Point', coordinates: [CENTER.lng + jitter(), CENTER.lat + jitter()] },
    });
    for (const [title, description, price] of servicesFor[p.category]) {
      await Service.create({ title, description, price, category: p.category, provider: user.id });
    }
  }

  console.log('Seeded. Logins (password: password123):');
  console.log('  customer@demo.com');
  console.log('  provider@demo.com');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

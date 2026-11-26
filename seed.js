require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');

const day = (n) => new Date(Date.now() + n * 86400000);

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusconnect');
  await Event.deleteMany({});
  await User.deleteMany({});
  const hash = await bcrypt.hash('password123', 10);
  const org = await User.create({ name: 'Coding Club', email: 'club@campus.edu', password: hash, role: 'organizer' });
  await User.create({ name: 'Demo Student', email: 'student@campus.edu', password: hash, role: 'student' });

  await Event.insertMany([
    { title: 'Hack the Campus 24h Hackathon', description: 'A 24-hour hackathon to build solutions for campus problems. Teams of up to 4.', category: 'Technical', club: 'Coding Club', venue: 'Main Auditorium', date: day(10), capacity: 120, organizer: org._id },
    { title: 'Web Dev Workshop: HTML, CSS & JS', description: 'Hands-on beginner workshop building a responsive portfolio page.', category: 'Workshop', club: 'Coding Club', venue: 'Lab 3', date: day(4), capacity: 60, organizer: org._id },
    { title: 'Annual Cultural Fest - Rangotsav', description: 'Music, dance, drama and food stalls. Open for all students.', category: 'Cultural', club: 'Cultural Society', venue: 'Open Air Theatre', date: day(20), capacity: 500, organizer: org._id },
    { title: 'Inter-Department Cricket Cup', description: 'Knockout cricket tournament between departments.', category: 'Sports', club: 'Sports Council', venue: 'Cricket Ground', date: day(15), capacity: 200, organizer: org._id }
  ]);
  console.log('Seeded. Organizer: club@campus.edu / password123 | Student: student@campus.edu / password123');
  await mongoose.disconnect();
})();

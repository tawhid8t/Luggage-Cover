require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_USERS = [
  {
    fullName: 'Admin User',
    username: 'admin',
    password: process.env.ADMIN_DEFAULT_PASSWORD || 'lcbd@Admin2024!',
    email: 'admin@luggagecoverbd.com',
    role: 'admin',
    status: 'active',
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of ADMIN_USERS) {
      const existing = await User.findOne({ username: userData.username }).select('+password');
      if (existing) {
        const isMatch = await existing.matchPassword(userData.password);
        if (isMatch) {
          console.log(`User '${userData.username}' already exists with correct password, skipping.`);
        } else {
          const hashed = await bcrypt.hash(userData.password, 12);
          existing.password = hashed;
          existing.role = 'admin';
          existing.status = 'active';
          await existing.save();
          console.log(`User '${userData.username}' updated with new password.`);
        }
        continue;
      }

      const emailExists = await User.findOne({ email: userData.email }).select('+password');
      if (emailExists) {
        emailExists.username = userData.username;
        emailExists.fullName = userData.fullName;
        const hashed = await bcrypt.hash(userData.password, 12);
        emailExists.password = hashed;
        emailExists.role = 'admin';
        emailExists.status = 'active';
        await emailExists.save();
        console.log(`Updated existing user (${userData.email}) as admin.`);
        continue;
      }

      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username} (password: ${userData.password})`);
    }

    console.log('\nSeed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seedUsers();

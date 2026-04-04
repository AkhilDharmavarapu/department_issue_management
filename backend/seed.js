/**
 * Database Seeding Script
 * Creates demo users for testing
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/passwordUtils');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/department_management';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove this if you want to keep existing data)
    // await User.deleteMany({});

    // Check if users already exist
    const adminExists = await User.findOne({ email: 'admin@college.edu' });
    const facultyExists = await User.findOne({ email: 'faculty@college.edu' });
    const studentExists = await User.findOne({ email: 'student@college.edu' });

    if (adminExists && facultyExists && studentExists) {
      console.log('✅ Demo users already exist!');
      await mongoose.connection.close();
      return;
    }

    // Delete existing demo users to recreate them
    await User.deleteMany({
      email: { $in: ['admin@college.edu', 'faculty@college.edu', 'student@college.edu'] }
    });

    // Create demo users using save() to trigger pre-save hooks
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@college.edu',
      passwordHash: 'password123',
      role: 'admin',
      isActive: true,
    });

    const facultyUser = new User({
      name: 'Faculty User',
      email: 'faculty@college.edu',
      passwordHash: 'password123',
      role: 'faculty',
      isActive: true,
    });

    const studentUser = new User({
      name: 'Student User',
      email: 'student@college.edu',
      passwordHash: 'password123',
      rollNumber: 'CS001',
      role: 'student',
      isActive: true,
    });

    // Save users (triggers password hashing pre-save hook)
    await adminUser.save();
    await facultyUser.save();
    await studentUser.save();

    console.log('✅ Demo users created successfully:');
    console.log('   - admin@college.edu (admin)');
    console.log('   - faculty@college.edu (faculty)');
    console.log('   - student@college.edu (student)');
    console.log('\n🔐 All passwords: password123');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

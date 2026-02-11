import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const generateOTP = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateOTPForUser = async (identifier) => {
  try {
    if (!identifier) {
      console.log('\n❌ Usage: node backend/generate-otp.js <username or email>');
      console.log('Example: node backend/generate-otp.js admin\n');
      process.exit(1);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           🔐 OTP GENERATOR - BACKEND ADMIN 🔐          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Find user
    const user = await Player.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (!user) {
      console.log(`❌ User not found: "${identifier}"`);
      console.log('\nSearching in database...');
      const allUsers = await Player.find({}, 'username email').limit(5);
      if (allUsers.length > 0) {
        console.log('\nAvailable users:');
        allUsers.forEach(u => console.log(`  - ${u.username} (${u.email})`));
      }
      process.exit(1);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║           🔐 OTP GENERATED SUCCESSFULLY 🔐            ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  USERNAME: ${user.username.padEnd(45)}║`);
    console.log(`║  EMAIL:    ${user.email.padEnd(45)}║`);
    console.log(`║  PHONE:    ${user.phone.padEnd(45)}║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║                                                        ║`);
    console.log(`║              🎯 OTP CODE: ${otp}                      ║`);
    console.log(`║                                                        ║`);
    console.log(`║  ⏰ Expires at: ${otpExpires.toLocaleString().padEnd(33)}║`);
    console.log(`║  ✓ Valid for: 15 minutes                              ║`);
    console.log('╚════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating OTP:', error.message);
    process.exit(1);
  }
};

const username = process.argv[2];
generateOTPForUser(username);

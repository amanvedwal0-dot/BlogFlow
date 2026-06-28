const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/BlogApp';
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB:', dbUrl);

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@blog.com' });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log('✅ Existing user promoted to admin!');
      } else {
        console.log('ℹ️  Admin already exists. No changes made.');
      }
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@blog.com',
        password: hashedPassword,
        role: 'admin',
        theme: 'light',
        followers: [],
        following: [],
      });
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🔐 Admin Login Credentials:');
    console.log('   Email   : admin@blog.com');
    console.log('   Password: admin123');
    console.log('\n👉 Go to your frontend and log in with these credentials.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();

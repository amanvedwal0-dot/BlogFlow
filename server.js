// server initialization code
const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();
const PORT = process.env.PORT || 3000;

// middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.ALLOWED_ORIGIN, // your Vercel frontend URL (set in Render dashboard)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes mounting
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const helpRoutes = require('./routes/helpRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/help', helpRoutes);

// Database connection
const connectDB = require('./config/database');

const seedDefaultCategories = async () => {
  const Category = require('./models/Category');
  const defaultCategories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'News', slug: 'news' },
    { name: 'Lifestyle', slug: 'lifestyle' },
    { name: 'Travel', slug: 'travel' },
    { name: 'Tutorial', slug: 'tutorial' },
  ];

  for (const category of defaultCategories) {
    await Category.findOneAndUpdate(
      { slug: category.slug },
      { $setOnInsert: category },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const startServer = async () => {
  await connectDB();
  await seedDefaultCategories();
  app.listen(PORT, () => {
    console.log(` ✅ Server is running on port ${PORT}`);
  });
};

startServer();
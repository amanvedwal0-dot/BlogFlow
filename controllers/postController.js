const slugify = require('slugify');
const mongoose = require('mongoose');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const Category = require('../models/Category');

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'blog_posts' }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
    stream.end(buffer);
  });
};

const saveLocalImage = (file) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, file.buffer);
  return `/uploads/${filename}`;
};

exports.createPost = async (req, res) => {
  try {
    console.log('createPost request', {
      body: req.body,
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      } : null,
      isConfigured,
    });
    const { title, content, category, tags } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content and category are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category selected' });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    let thumbnail;
    if (req.file && req.file.buffer) {
      if (isConfigured) {
        const result = await uploadToCloudinary(req.file.buffer);
        thumbnail = result.secure_url;
      } else {
        thumbnail = saveLocalImage(req.file);
      }
    }

    const post = await Post.create({
      title,
      slug: slugify(title, { lower: true, strict: true }),
      content,
      thumbnail,
      author: req.user.userId,
      category,
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    });

    res.status(201).json({ success: true, post });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: only the publisher can update this post' });
    }

    const { title, content, category, tags } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content and category are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category selected' });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    let thumbnail = post.thumbnail;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer);
      thumbnail = result.secure_url;
    }

    post.title = title;
    post.slug = slugify(title, { lower: true, strict: true });
    post.content = content;
    post.category = category;
    post.tags = tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    post.thumbnail = thumbnail;

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: only the publisher can delete this post' });
    }

    await post.remove();
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { category, tag, author, keyword, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (author) {
      filter.author = author;
    }
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      filter.$or = [
        { title: regex },
        { content: regex },
        { tags: regex }
      ];
    }

    const posts = await Post.find(filter)
      .populate('author', 'name profilePic')
      .populate('category')
      .populate({ path: 'comments', populate: { path: 'user', select: 'name profilePic' } })
      .populate('likes')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load posts', error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePic')
      .populate('category')
      .populate({ path: 'comments', populate: { path: 'user', select: 'name profilePic' } })
      .populate('likes');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, post });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load post', error: error.message });
  }
};

exports.searchBlogs = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Search keyword is required' });
    }

    const regex = new RegExp(keyword, 'i');
    const posts = await Post.find({
      $or: [
        { title: regex },
        { content: regex },
        { tags: regex }
      ]
    })
      .populate('author', 'name profilePic')
      .populate('category');

    res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
};
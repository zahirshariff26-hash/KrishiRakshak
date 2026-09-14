const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { CommunityPost, Comment, User } = require('../models/index');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const postInclude = [
  { model: User, as: 'user', attributes: ['id', 'name'] },
  {
    model: Comment,
    as: 'comments',
    include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
  },
];

router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await CommunityPost.findAndCountAll({
      include: postInclude,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ posts: rows, total: count, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error('[COMMUNITY] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/', authenticate, upload.single('image'), [
  body('caption').optional().trim().isLength({ max: 1000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { caption, disease_name, confidence, latitude, longitude } = req.body;
    const post = await CommunityPost.create({
      user_id: req.user.id,
      image_path: req.file ? `/uploads/${req.file.filename}` : null,
      caption: caption || null,
      disease_name: disease_name || null,
      confidence: confidence ? parseFloat(confidence) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    const full = await CommunityPost.findByPk(post.id, { include: postInclude });
    res.status(201).json({ post: full });
  } catch (err) {
    console.error('[COMMUNITY] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.post('/:postId/comments', authenticate, [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment text required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const post = await CommunityPost.findByPk(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      post_id: post.id,
      user_id: req.user.id,
      text: req.body.text,
    });

    const full = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });

    res.status(201).json({ comment: full });
  } catch (err) {
    console.error('[COMMENT] Create error:', err.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;

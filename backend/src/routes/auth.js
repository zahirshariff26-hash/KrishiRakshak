const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

const TOKEN_EXPIRY_MINUTES = 15;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

router.post('/signup', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password_hash });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[AUTH] Signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: 'If an account exists with this email, a reset link has been generated.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await PasswordReset.destroy({ where: { user_id: user.id, used: false } });

    await PasswordReset.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    console.log(`[AUTH] Password reset for ${email}: token=${rawToken}`);

    res.json({
      message: 'If an account exists with this email, a reset link has been generated.',
      _dev_token: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    });
  } catch (err) {
    console.error('[AUTH] Forgot password error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.get('/reset-password/:token', async (req, res) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const record = await PasswordReset.findOne({
      where: { token_hash: tokenHash, used: false },
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    res.json({ message: 'Token is valid.' });
  } catch (err) {
    console.error('[AUTH] Validate reset token error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const tokenHash = hashToken(req.params.token);
    const record = await PasswordReset.findOne({
      where: { token_hash: tokenHash, used: false },
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(req.body.password, 12);
    await User.update({ password_hash }, { where: { id: record.user_id } });

    record.used = true;
    await record.save();

    console.log(`[AUTH] Password reset successful for user_id=${record.user_id}`);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('[AUTH] Reset password error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;

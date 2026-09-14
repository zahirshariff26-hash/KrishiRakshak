const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp)$/i;
    if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP images are allowed'));
    }
  },
});

router.post('/', optionalAuth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const mlUrl = process.env.ML_SERVICE_URL;

  if (!mlUrl) {
    console.error('[PREDICT] ML_SERVICE_URL is not configured');
    return res.status(500).json({ error: 'ML service not configured' });
  }

  try {
    const formData = new (require('form-data'))();
    formData.append('image', require('fs').createReadStream(req.file.path), req.file.filename);
    if (req.body.lang) formData.append('lang', req.body.lang);

    const mlResponse = await axios.post(`${mlUrl}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 120000,
    });

    res.json({
      ...mlResponse.data,
      image_path: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    const mlErr = err.response?.data?.error || err.message;
    console.error('[PREDICT] ML error:', mlErr, '| code:', err.code, '| status:', err.response?.status);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'ML service unavailable. Please try again in a moment.' });
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'ML service timed out. The model may be loading — please try again.' });
    }
    if (err.response?.status === 400) {
      return res.status(400).json({ error: err.response?.data?.error || 'Invalid image for ML service' });
    }
    if (err.response?.status === 500) {
      return res.status(502).json({ error: 'ML prediction error. Please try a different image.' });
    }
    res.status(500).json({ error: 'Prediction failed. Please try again.' });
  }
});

module.exports = router;

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

    const isColdStart =
      err.code === 'ECONNREFUSED' ||
      err.code === 'ECONNABORTED' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ENOTFOUND' ||
      (err.response && [502, 503, 504].includes(err.response.status));

    if (isColdStart) {
      return res.status(503).json({
        error: 'AI service is starting up. Please try again shortly.',
        error_code: 'ML_WARMING_UP',
      });
    }

    if (err.response?.status === 400) {
      return res.status(400).json({
        error: err.response?.data?.error || 'Invalid image. Please upload a clear crop photo.',
        error_code: 'INVALID_INPUT',
      });
    }

    console.error('[PREDICT] Unexpected error:', err.message);
    res.status(500).json({
      error: 'Prediction failed. Please try again.',
      error_code: 'PREDICTION_FAILED',
    });
  }
});

module.exports = router;

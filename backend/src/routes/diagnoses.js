const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { Diagnosis } = require('../models/index');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const diagnoses = await Diagnosis.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ diagnoses });
  } catch (err) {
    console.error('[DIAGNOSES] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch diagnoses' });
  }
});

router.post('/', authenticate, [
  body('disease_name').trim().notEmpty().withMessage('Disease name required'),
  body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be 0-1'),
  body('treatment_advice').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { disease_name, confidence, treatment_advice, image_path, latitude, longitude } = req.body;
    const diagnosis = await Diagnosis.create({
      user_id: req.user.id,
      image_path: image_path || null,
      disease_name,
      confidence,
      treatment_advice: treatment_advice || null,
      latitude: latitude || null,
      longitude: longitude || null,
    });
    res.status(201).json({ diagnosis });
  } catch (err) {
    console.error('[DIAGNOSES] Create error:', err.message);
    res.status(500).json({ error: 'Failed to save diagnosis' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    await diagnosis.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[DIAGNOSES] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;

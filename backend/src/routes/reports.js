const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { Diagnosis, CommunityPost, User } = require('../models/index');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const diagnoses = await Diagnosis.findAll({
      where: { latitude: { [require('sequelize').Op.ne]: null } },
      attributes: ['id', 'disease_name', 'confidence', 'latitude', 'longitude', 'created_at'],
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 200,
    });

    const posts = await CommunityPost.findAll({
      where: { latitude: { [require('sequelize').Op.ne]: null } },
      attributes: ['id', 'disease_name', 'confidence', 'latitude', 'longitude', 'created_at', 'caption'],
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 200,
    });

    const reports = [
      ...diagnoses.map(d => ({ ...d.toJSON(), source: 'diagnosis' })),
      ...posts.map(p => ({ ...p.toJSON(), source: 'community' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ reports });
  } catch (err) {
    console.error('[REPORTS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;

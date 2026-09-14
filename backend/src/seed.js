require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Diagnosis, CommunityPost, Comment } = require('./models/index');

const DEMO_USERS = [
  { name: 'Rahul Patil', email: 'rahul@demo.krishirakshak', password: 'demo123' },
  { name: 'Priya Jadhav', email: 'priya@demo.krishirakshak', password: 'demo123' },
  { name: 'Amit Deshmukh', email: 'amit@demo.krishirakshak', password: 'demo123' },
];

const MAHARASHTRA_LOCATIONS = [
  { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
  { lat: 18.5204, lng: 73.8567, city: 'Pune' },
  { lat: 21.1458, lng: 79.0882, city: 'Nagpur' },
  { lat: 16.8524, lng: 74.5646, city: 'Kolhapur' },
  { lat: 20.9517, lng: 75.5684, city: 'Jalgaon' },
  { lat: 19.8762, lng: 75.3433, city: 'Aurangabad' },
  { lat: 17.6599, lng: 75.9064, city: 'Solapur' },
  { lat: 18.1848, lng: 75.0194, city: 'Latur' },
  { lat: 19.9975, lng: 73.7898, city: 'Nashik' },
  { lat: 16.7049, lng: 74.2432, city: 'Sangli' },
  { lat: 20.7070, lng: 76.5669, city: 'Buldhana' },
  { lat: 18.7420, lng: 76.4428, city: 'Beed' },
  { lat: 21.2333, lng: 78.4167, city: 'Yavatmal' },
  { lat: 19.0825, lng: 74.7483, city: 'Ahmednagar' },
  { lat: 20.1035, lng: 76.8535, city: 'Vidarbha' },
  { lat: 17.8815, lng: 76.4370, city: 'Udgir' },
  { lat: 18.4088, lng: 75.0078, city: 'Osmanabad' },
  { lat: 19.5000, lng: 73.8500, city: 'Thane' },
];

const DEMO_DISEASES = [
  { disease: 'Tomato_Bacterial_spot', confidence: 0.89 },
  { disease: 'Tomato_Early_blight', confidence: 0.92 },
  { disease: 'Tomato_Late_blight', confidence: 0.85 },
  { disease: 'Tomato_Leaf_Mold', confidence: 0.78 },
  { disease: 'Tomato_YellowLeafCurl_Virus', confidence: 0.94 },
  { disease: 'Tomato_Mosaic_virus', confidence: 0.88 },
  { disease: 'Tomato_Septoria_leaf_spot', confidence: 0.91 },
  { disease: 'Tomato_Spider_mites', confidence: 0.82 },
  { disease: 'Tomato_Target_Spot', confidence: 0.86 },
  { disease: 'Pepper__bell___Bacterial_spot', confidence: 0.90 },
  { disease: 'Potato___Early_blight', confidence: 0.87 },
  { disease: 'Potato___Late_blight', confidence: 0.93 },
  { disease: 'Tomato_healthy', confidence: 0.95 },
  { disease: 'Potato___healthy', confidence: 0.96 },
];

const DEMO_CAPTIONS = [
  'Spots appearing on tomato leaves in my backyard garden',
  'Yellow patches spreading across the field',
  'White powdery substance on the stems',
  'Leaves curling and turning yellow',
  'Dark spots on the fruit surface',
  'Early signs of infection detected',
  'Whole row seems affected after last rain',
  'Brown lesions on lower leaves',
  'Green patches looking healthy thankfully',
  'Need help identifying this disease',
  'Multiple plants showing similar symptoms',
  'This appeared suddenly after humid weather',
  'Growing tomatoes in containers, seeing this issue',
  'Paprika plants showing leaf damage',
  'Potato crop affected near irrigation channel',
  'Mixed symptoms — spots and wilting',
  'First time seeing this in 5 years of farming',
  'Organic garden, no pesticides used',
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected');

    await sequelize.sync({ force: true });
    console.log('[DB] Tables recreated');

    const users = [];
    for (const u of DEMO_USERS) {
      const hash = await bcrypt.hash(u.password, 12);
      const user = await User.create({ name: u.name, email: u.email, password_hash: hash });
      users.push(user);
    }
    console.log(`[SEED] Created ${users.length} demo users`);

    for (let i = 0; i < 18; i++) {
      const user = users[i % users.length];
      const loc = MAHARASHTRA_LOCATIONS[i % MAHARASHTRA_LOCATIONS.length];
      const dis = DEMO_DISEASES[i % DEMO_DISEASES.length];
      const caption = DEMO_CAPTIONS[i % DEMO_CAPTIONS.length];
      const daysAgo = Math.floor(Math.random() * 30);

      const diagnosis = await Diagnosis.create({
        user_id: user.id,
        image_path: null,
        disease_name: dis.disease,
        confidence: dis.confidence + (Math.random() * 0.05 - 0.025),
        treatment_advice: `Advisory for ${dis.disease.replace(/_/g, ' ')}. Monitor crop regularly.`,
        latitude: loc.lat + (Math.random() * 0.1 - 0.05),
        longitude: loc.lng + (Math.random() * 0.1 - 0.05),
        created_at: new Date(Date.now() - daysAgo * 86400000),
      });

      if (i % 3 === 0) {
        const post = await CommunityPost.create({
          user_id: user.id,
          image_path: null,
          caption,
          disease_name: dis.disease,
          confidence: diagnosis.confidence,
          latitude: diagnosis.latitude,
          longitude: diagnosis.longitude,
          created_at: diagnosis.created_at,
        });

        if (i % 2 === 0) {
          const commenter = users[(i + 1) % users.length];
          await Comment.create({
            post_id: post.id,
            user_id: commenter.id,
            text: 'I had the same issue last season. Try removing affected leaves.',
            created_at: new Date(diagnosis.created_at.getTime() + 3600000),
          });
        }
      }
    }
    console.log('[SEED] Created 18 demo diagnoses, community posts, and comments');
    console.log('[SEED] Done!');
    console.log('\nDemo login credentials:');
    DEMO_USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`));

    process.exit(0);
  } catch (err) {
    console.error('[SEED] Error:', err);
    process.exit(1);
  }
}

seed();

# KrishiRakshak — AI-Powered Crop Health Network & Early Warning System

> **Smart India Hackathon 2026 — PS Number: SIH26131**
> *Early Detection and Management of Crop Diseases and Pest Infestations*
> Theme: Agriculture, FoodTech & Rural Development | Sponsoring Organization: Government of Maharashtra

---

## Overview

KrishiRakshak is an AI-powered platform that enables farmers to detect crop diseases early through image-based AI diagnosis. Farmers upload a photo of a diseased leaf or crop, and the system returns:

- **Predicted disease** with confidence score
- **Treatment & advisory recommendations**
- **Integrated Pest Management (IPM) guidance**

The platform supports community sharing, regional disease mapping, multilingual advisories, and works on mobile devices.

## Features

- AI-powered crop disease detection (MobileNetV2 on PlantVillage dataset)
- Guest mode + full authentication
- Diagnosis history for logged-in users
- Community feed with comments
- Leaflet-based regional disease map
- English, Hindi, Marathi language support
- Light / Dark / System theme
- PWA-ready responsive design
- Real agricultural advisories (not medical claims)

## Architecture

```
Frontend (React + Vite + TailwindCSS)
        ↓ HTTP
Backend (Node.js + Express + Sequelize)
        ↓ HTTP
ML Service (Python + Flask + TensorFlow)
```

| Layer | Tech | Deploy Target |
|-------|------|---------------|
| Frontend | React 18, Vite, TailwindCSS, Leaflet, react-i18next | Vercel |
| Backend | Node.js, Express, Sequelize, JWT, bcryptjs | Render |
| ML Service | Python, Flask, TensorFlow/Keras, MobileNetV2 | Render / GPU host |
| Database | SQLite (dev) / PostgreSQL (prod) | Render PostgreSQL |

## Folder Structure

```
KrishiRakshak/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── ml-service/
│   ├── app.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── plant_disease_model.keras   (after training)
│   │   └── class_names.json
│   ├── training/
│   │   └── KrishiRakshak_PlantVillage_Training.ipynb
│   └── .env.example
├── README.md
└── .gitignore
```

---

## 1. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (VITE_API_URL)
npm run dev
```

Runs on `http://localhost:5173` with API proxy to the backend.

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set JWT_SECRET, DATABASE_URL, ML_SERVICE_URL
npm run dev
```

Runs on `http://localhost:5000`.

## 3. ML Service Setup

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env if needed
python app.py
```

Runs on `http://localhost:5001`. Starts in **mock mode** by default.

## 4. Kaggle Training Instructions

The AI model is trained using the [PlantVillage dataset](https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset) on Kaggle's free GPU environment.

### Steps:

1. Go to [Kaggle](https://www.kaggle.com/) and create an account (free)
2. Upload the notebook `ml-service/training/KrishiRakshak_PlantVillage_Training.ipynb`
3. In the notebook editor, click **Add Data** → search for "PlantVillage" → add `abdallahalidev/plantvillage-dataset`
4. In notebook settings, enable **GPU** accelerator
5. Run **All Cells** top to bottom
6. After training completes (~15-30 min), go to the **Output** panel
7. Download these files:
   - `plant_disease_model.keras`
   - `class_names.json`
8. Place them in `ml-service/models/` in this project
9. Set `MODEL_MODE=real` in `ml-service/.env`
10. Restart the ML service

### What the notebook does:

- Uses TensorFlow/Keras with pretrained MobileNetV2 (ImageNet weights)
- Trains classification head for ~10 epochs
- Fine-tunes top 30 layers for ~5 epochs
- Generates accuracy, loss, confusion matrix, classification report
- Exports trained model + class mapping

## 5. Export Trained Model

After Kaggle training, download from the Kaggle Output panel:
- `plant_disease_model.keras` → place in `ml-service/models/`
- `class_names.json` → place in `ml-service/models/`

## 6. Environment Variables

### Backend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | DB connection string | `sqlite:///./krishirakshak.db` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `ML_SERVICE_URL` | Flask ML service URL | `http://localhost:5001` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |

### Frontend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

### ML Service (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_PORT` | Flask server port | `5001` |
| `MODEL_PATH` | Path to .keras model | `./models/plant_disease_model.keras` |
| `CLASS_NAMES_PATH` | Path to class names JSON | `./models/class_names.json` |
| `MODEL_MODE` | `mock` or `real` | `mock` |
| `CONFIDENCE_THRESHOLD` | Low confidence warning threshold | `0.5` |

## 7. Local Development

1. Start the ML service: `cd ml-service && python app.py`
2. Start the backend: `cd backend && npm run dev`
3. Start the frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173`

## 8. Production Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the repository
4. Set root directory to `frontend`
5. Set environment variable: `VITE_API_URL` = `https://your-backend.onrender.com/api`
6. Deploy

### Backend → Render

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Root directory: `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables from `.env.example`
8. Deploy

### ML Service → Render

1. Create a new Web Service on Render
2. Root directory: `ml-service`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Add environment variables
6. **Note:** TensorFlow model is ~30MB. Render's free tier has limited memory. Consider using a paid plan or a GPU-capable host for production inference.

### Database → PostgreSQL

For production, update `DATABASE_URL` in backend `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/krishirakshak
```

## 9. Guest vs Logged-In Behavior

| Feature | Guest | Logged In |
|---------|-------|-----------|
| AI diagnosis | ✅ | ✅ |
| View result & advisory | ✅ | ✅ |
| Save diagnosis history | ❌ | ✅ |
| Create community posts | ❌ | ✅ |
| Comment on posts | ❌ | ✅ |
| View own history | ❌ | ✅ |

Guests are prompted to sign up when trying to access restricted features.

## 10. Theme Support

- **Light Mode** — default white/green theme
- **Dark Mode** — comfortable dark background
- **System Mode** — follows OS preference automatically

Toggle is in the application header. Theme persists in localStorage.

## 11. Known Limitations

- The AI model is trained on PlantVillage (lab/controlled images). Real farmer field images may differ significantly in lighting, angle, and background.
- Mock mode is for development only — it returns random predictions.
- TensorFlow model may not run on Render's free tier due to memory constraints.
- No real-time weather integration yet.
- No expert verification system yet.

## 12. Future Roadmap

- Weather-based risk forecasting
- Pest trap / IoT sensor integration
- Geospatial disease hotspot analysis
- Expert verification workflow
- Multilingual audio advisories
- Field-level multi-point scanning
- Government / official dashboards
- Real-time notifications
- Offline-first PWA with sync

## License

This project is built for Smart India Hackathon 2026.

# SignBridge: Deaf and Mute Communication Platform

## Overview
SignBridge is an AI-powered full-stack web application designed to bridge the communication gap for the deaf and mute community. It detects hand gestures (ASL) via the webcam in real-time and converts them into text and speech, and inversely takes text input and generates animated signs.

## Architecture
- **Frontend**: React.js, Tailwind CSS, Framer Motion, `@mediapipe/tasks-vision`.
- **Backend**: Node.js, Express, SQLite3 for Authentication and Translation History.
- **Machine Learning**: Pre-trained MediaPipe Gesture Recognizer, with a robust custom-training pipeline built in `ml/`.

## Folder Structure
```
SignBridge/
├── backend/
│   ├── index.js      # Express API server for Auth & History
│   ├── db.js         # SQLite database schema setup
│   ├── package.json
├── frontend/
│   ├── public/       # Place compiled .task models and assets here
│   ├── src/
│   │   ├── components/ # Navbar, Auth forms
│   │   ├── pages/      # Home, Translator engine, History
│   │   ├── index.css   # Tailwind setup & Custom animations
│   │   ├── App.tsx     # Application router
│   ├── package.json
│   ├── tailwind.config.js
├── ml/
│   ├── train.py      # Transfer learning script via MediaPipe Model Maker
│   ├── README.md     # Instructions on dataset creation and custom training
```

## Installation & Deployment

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   node index.js
   ```
   *The SQLite database will automatically be initialized securely in `database.sqlite`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will now be accessible at `http://localhost:5173`.*

### 3. Model Training (Optional, >85% accuracy custom signs)
- Go to the `ml/` directory.
- Download the ASL Dataset from Kaggle.
- Run `python train.py` to generate the custom `gesture_recognizer.task` file.
- Move the `.task` file to `frontend/public/` and update the path in `src/pages/Translator.tsx`.

### 4. Deployment Check
- To deploy to production, simply run `npm run build` in the `frontend` directory. Deploy the output `dist/` folder using Vercel, Netlify, or Nginx.
- Deploy the backend using Heroku, Render, or a VPS with Node.js support. SQLite will handle persistent data across sessions using a local file buffer.

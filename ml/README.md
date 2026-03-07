# SignBridge ML Model Training Guide

## Dataset Suggestions
To train your own Custom ASL Alphabet or Common Signs model, you need a dataset of hands performing actions.
1. **ASL Alphabet Dataset**: 
   - [Kaggle ASL Alphabet Dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet) (87,000 images, 29 classes: A-Z, SPACE, DEL, NOTHING).
   - [Kaggle ASL Dataset by Ayuraj](https://www.kaggle.com/datasets/ayuraj/asl-dataset)
2. **Common Words / Dynamic Gestures**: For dynamic gestures (Hello, Thank You), you'll need video sequences or use an architecture like LSTMs on top of MediaPipe landmarks. But for static gestures (A-Z, Hello, Yes, No), image datasets are sufficient.

## Training Steps using MediaPipe Model Maker
MediaPipe provides an easy `Model Maker` library allowing you to train a lightweight `.task` model using Transfer Learning. This `.task` model can be loaded directly into our React frontend!

### Prerequisites
1. Install Python 3.8+
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install MediaPipe Model Maker:
   ```bash
   pip install mediapipe-model-maker
   ```

### 1. Structure your Dataset
Organize your downloaded ASL dataset into folders where the folder name is the gesture class:
```
dataset/
├── A/
│   ├── image1.jpg
│   └── ...
├── Hello/
│   ├── image1.jpg
│   └── ...
├── ThankYou/
│   ├── image1.jpg
│   └── ...
```

### 2. Run the Training Script
Run the `train.py` script provided in this directory.
```bash
python train.py
```
This script will leverage Transfer Learning to create a compressed `gesture_recognizer.task` model.

### 3. Integrate with Frontend
Copy the generated `exported_model/gesture_recognizer.task` to the `SignBridge/frontend/public/` folder.
Update `Translator.tsx` in frontend to use the local model:
```typescript
modelAssetPath: '/gesture_recognizer.task'
```

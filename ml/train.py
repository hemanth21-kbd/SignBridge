import os
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
import tensorflow as tf
from mediapipe_model_maker import gesture_recognizer

import urllib.request
import zipfile

# 1. Dataset Path
print("Setting up dataset...")
dataset_path = "dataset/archive (6)/asl_alphabet_train/reduced_dataset"
if not os.path.exists(dataset_path):
    print("Please download an ASL dataset and organize it in a 'dataset' folder.")
    print("Example: dataset/A/image1.jpg")
    exit(1)

# 2. Load the MediaPipe Gesture Recognizer Data
print("Loading dataset into Model Maker format...")
data = gesture_recognizer.Dataset.from_folder(
    dirname=dataset_path,
    hparams=gesture_recognizer.HandDataPreprocessingParams()
)

# 3. Split the data
print("Splitting train/validation data...")
train_data, rest_data = data.split(0.8)
validation_data, test_data = rest_data.split(0.5)

# 4. Set hyperparameters for Transfer Learning
print("Configuring hyperparameters...")
hparams = gesture_recognizer.HParams(export_dir="exported_model", epochs=10, batch_size=32)
options = gesture_recognizer.GestureRecognizerOptions(hparams=hparams)

# 5. Train the Model
print("Training the gesture recognizer model...")
model = gesture_recognizer.GestureRecognizer.create(
    train_data=train_data,
    validation_data=validation_data,
    options=options
)

# 6. Evaluate accuracy
print("Evaluating accuracy on test data...")
loss, acc = model.evaluate(test_data, batch_size=1)
print(f"Test loss: {loss}, Test accuracy: {acc}")

# 7. Export Model
print("Exporting the .task file for frontend usage...")
model.export_model()
print("Export complete! Find the model at exported_model/gesture_recognizer.task")
print("Move this to your frontend/public folder.")

import os
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import TensorBoard

# --------- HYPERPARAMETERS AND CONFIGURATION ---------
DATA_PATH = os.path.join('Dataset_Sequences') 

# Actions that you've recorded in collect_data.py
actions = np.array(['hello', 'how are you', 'what are you doing', 'i love you', 'goodbye'])

# Matches your collection script
no_sequences = 30
sequence_length = 30

label_map = {label:num for num, label in enumerate(actions)}
# -----------------------------------------------------

print(f"Loading sequence data for {len(actions)} actions...")
sequences, labels = [], []

# Load all numpy arrays into memory
for action in actions:
    for sequence in range(no_sequences):
        window = []
        for frame_num in range(sequence_length):
            try:
                # Load the 126 coordinate array
                res = np.load(os.path.join(DATA_PATH, action, str(sequence), "{}.npy".format(frame_num)))
                window.append(res)
            except Exception as e:
                pass
        
        # Ensures that a sequence isn't corrupted or empty
        if len(window) == sequence_length:
            sequences.append(window)
            labels.append(label_map[action])

# Format the variables into Neural Network shapes
X = np.array(sequences) 
y = to_categorical(labels).astype(int)

# 95% Training, 5% Testing split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.05)


print("\nBuilding LSTM Neural Network Architecture...")
log_dir = os.path.join('Logs')
tb_callback = TensorBoard(log_dir=log_dir)

model = Sequential()
# Input layers takes 30 frames worth of 126 keypoints
model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(sequence_length, 126)))
model.add(LSTM(128, return_sequences=True, activation='relu'))
model.add(LSTM(64, return_sequences=False, activation='relu'))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(actions.shape[0], activation='softmax')) # Softmax gives probabilities of each action

# Compile it!
model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])


print("\nStarting Model Training... This might take a few minutes!")
# Train using 200 epochs maximum, tensorboard helps track it
model.fit(X_train, y_train, epochs=200, callbacks=[tb_callback])

# Validate results
print("\nValidating results...")
res = model.evaluate(X_test, y_test)
print(f"Test Loss: {res[0]}, Neural Network Accuracy: {res[1] * 100:.2f}%")


print("\nSaving standard H5 Keras model...")
# Keras model output
model.save('SignBridge_LSTM_Model.h5')
print("Model created securely at ml/SignBridge_LSTM_Model.h5")

# INSTRUCTIONS FOR FRONTEND PORT:
print("\n" + "="*50)
print("TO EXPORT FOR SIGNBRIDGE WEB BROWSER FRONTEND:")
print("1. Set up Tensorflow.js converter:")
print("   pip install tensorflowjs")
print("2. Run this exact terminal command in your 'ml' folder:")
print("   tensorflowjs_converter --input_format keras SignBridge_LSTM_Model.h5 tfjs_model")
print("3. Move the 'tfjs_model' directory into your frontend/public folder.")
print("="*50 + "\n")

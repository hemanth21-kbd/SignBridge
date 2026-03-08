import os
import numpy as np

DATA_PATH = os.path.join('Dataset_Sequences') 
actions = np.array(['hello', 'how are you', 'what are you doing', 'i love you', 'goodbye'])
no_sequences = 30
sequence_length = 30

# Create dummy skeleton coordinate arrays (126 coordinates of all 0's)
dummy_skeleton = np.zeros(126)

for action in actions:
    for sequence in range(no_sequences):
        dir_path = os.path.join(DATA_PATH, action, str(sequence))
        os.makedirs(dir_path, exist_ok=True)
        for frame_num in range(sequence_length):
            # Create minor noise variations so the model converges without crashing during loss calculation
            noise = np.random.normal(0, 0.01, dummy_skeleton.shape)
            noisy_skeleton = dummy_skeleton + noise
            npy_path = os.path.join(dir_path, str(frame_num))
            np.save(npy_path, noisy_skeleton)

print("Dummy coordinate dataset generated.")

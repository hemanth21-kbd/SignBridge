import os
import shutil

try:
    import gdown
    from mediapipe_model_maker import gesture_recognizer
except ImportError:
    print("Dependencies are missing. Please install them by running:")
    print("pip install mediapipe-model-maker gdown")
    exit(1)

def download_dataset():
    data_dir = "asl_dataset"
    if os.path.exists(data_dir):
        print("Dataset already downloaded!")
        return os.path.join(data_dir, "asl_alphabet_train", "asl_alphabet_train")
        
    print("Downloading massive Hand Gesture Dataset (ASL Alphabet 87k+ images) ~1GB...")
    # This is a public ASL Kaggle dataset linked via reliable Google Drive ID
    file_id = '1R6mQ2O8Oq5G-oD458Zf6cnsgLqF3rUio'
    url = f'https://drive.google.com/uc?id={file_id}'
    
    zip_path = "dataset.zip"
    gdown.download(url, zip_path, quiet=False)
    
    print("Extracting images...")
    shutil.unpack_archive(zip_path, extract_dir=data_dir)
    os.remove(zip_path)
    # Adjust path if unpacking adds inner folders
    extracted_path = os.path.join(data_dir, "asl_alphabet_train", "asl_alphabet_train")
    if not os.path.exists(extracted_path):
        extracted_path = data_dir # fallback
    return extracted_path

def run_training():
    dataset_path = download_dataset()
    
    print(f"Loading data from {dataset_path} into MediaPipe pipeline...")
    # This automatically categorizes based on Folder Names (A, B, C...)
    try:
        data = gesture_recognizer.Dataset.from_folder(
            dirname=dataset_path,
            hparams=gesture_recognizer.HandDataPreprocessingParams()
        )
    except Exception as e:
        print(f"Error loading dataset: {e}")
        print(f"Please ensure the dataset path '{dataset_path}' contains folders named A, B, C, etc.")
        return
    
    # Split the 1 Lakh images: 80% to train the brain, 10% to test, 10% to validate
    train_data, rest_data = data.split(0.8)
    validation_data, test_data = rest_data.split(0.5)
    
    print("Beginning robust Neural Network Training... (This may take several hours on CPU!)")
    # Configuration Params: Batch sizes, epochs
    hparams = gesture_recognizer.HParams(export_dir="custom_model_output", epochs=15, batch_size=64)
    options = gesture_recognizer.GestureRecognizerOptions(hparams=hparams)
    
    # Actually compiles the Machine Learning logic!
    model = gesture_recognizer.GestureRecognizer.create(
        train_data=train_data,
        validation_data=validation_data,
        options=options
    )
    
    print("Evaluating Model Accuracy against Test Data:")
    loss, acc = model.evaluate(test_data, batch_size=1)
    print(f"Final Model Test accuracy: {acc * 100:.2f}%")
    
    print("Exporting custom model format...")
    # This generates your finished .task file
    model.export_model()
    print("Success! Your file 'gesture_recognizer.task' is located at ./custom_model_output/")
    print("Copy this file to your React frontend /public folder and update your modelAssetPath!")

if __name__ == "__main__":
    run_training()

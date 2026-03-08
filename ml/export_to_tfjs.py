import os
import tensorflow as tf

def convert():
    model_path = 'SignBridge_LSTM_Model.h5'
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found.")
        return

    print("Loading model...")
    model = tf.keras.models.load_model(model_path)
    
    print("Attempting to export to TFJS format...")
    try:
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, 'tfjs_model')
        print("Success! tfjs_model created.")
    except ImportError:
        print("tensorflowjs not found. Trying to use CLI via subprocess...")
        # Since I can't install it, I'll assume they might have it in another env
        import subprocess
        result = subprocess.run(['tensorflowjs_converter', '--input_format', 'keras', model_path, 'tfjs_model'], capture_output=True, text=True)
        if result.returncode == 0:
            print("Success! tfjs_model created via CLI.")
        else:
            print("Error: Could not convert model. Please install tensorflowjs.")
            print(result.stderr)

if __name__ == "__main__":
    convert()

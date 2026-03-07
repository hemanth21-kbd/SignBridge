@echo off
title SignBridge Gesture Training

echo ==============================================
echo    SignBridge Gesture Model Training
echo ==============================================
echo.
echo Please note: Local Windows training is currently 
echo unsupported due to Python 3.12 MediaPipe API restrictions.
echo.
echo ==============================================
echo 1. Google Colab will now open in your browser automatically.
echo 2. Please upload 'Train_SignBridge_Colab_v2.ipynb' to Google Colab.
echo 3. Click 'Runtime -^> Run All'
echo ==============================================
echo.

start https://colab.research.google.com/
pause

@echo off
echo =========================================
echo Vercel Deployment Terminal
echo =========================================
echo.
echo Step 1. We are logging you into Vercel...
echo Please use your browser to log in if asked.
vercel login
echo.
echo.
echo Step 2. Deploying your website live!
cd frontend
vercel --prod --yes
echo.
echo =========================================
echo DEPLOYMENT COMPLETE!
echo Make sure to copy the "Production" link above!
echo =========================================
pause

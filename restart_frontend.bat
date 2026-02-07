@echo off
echo ================================================
echo    Restarting Frontend to Apply Changes
echo ================================================
echo.

echo Stopping old React processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting React with new environment...
cd frontend
start "React Frontend" cmd /k "npm start"

echo.
echo ================================================
echo Done! React is restarting in a new window.
echo ================================================
echo.
echo The new React window will open shortly.
echo Once it says "Compiled successfully", refresh your browser.
echo.
pause

@echo off
REM Quick script to update ngrok URL and regenerate QR codes

echo ================================================
echo    QR Code URL Updater for ngrok
echo ================================================
echo.

REM Get the new ngrok URL from user
echo Enter your new ngrok URL (without trailing slash):
echo Example: https://terminably-untensible-paulina.ngrok-free.dev
echo.
set /p NGROK_URL="New URL: "

REM Validate input
if "%NGROK_URL%"=="" (
    echo Error: URL cannot be empty!
    pause
    exit /b 1
)

echo.
echo ================================================
echo Step 1: Updating .env file...
echo ================================================

REM Update the .env file
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=%NGROK_URL%' | Set-Content .env"

echo ✅ .env file updated!
echo.

echo ================================================
echo Step 2: Regenerating QR codes...
echo ================================================
echo.

REM Run the QR code regeneration script
python regenerate_qr_codes.py

echo.
echo ================================================
echo ✅ All done!
echo ================================================
echo.
echo IMPORTANT: You need to restart your Django server!
echo.
echo 1. Go to your Django terminal
echo 2. Press Ctrl+C to stop the server
echo 3. Run: python manage.py runserver
echo.
echo Students should refresh their dashboard to see the updated QR code.
echo.
pause

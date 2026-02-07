@echo off
echo ========================================
echo Copying Project to GitHub Repository
echo ========================================
echo.

REM Set source and destination
set SOURCE=C:\Users\Kenzu\Desktop\Earist OJT
set DEST=C:\Users\Kenzu\Documents\GitHub\EARIST-OJT-INTERN-SYSTEM-THESIS

echo Source: %SOURCE%
echo Destination: %DEST%
echo.

REM Check if destination exists
if not exist "%DEST%" (
    echo ERROR: Destination folder not found!
    echo Please check the path in GitHub Desktop
    echo Right-click repository and select "Show in Explorer"
    pause
    exit /b
)

echo Copying files...
echo.

REM Copy all files except .git, venv, node_modules
xcopy "%SOURCE%\*" "%DEST%\" /E /I /H /Y /EXCLUDE:%SOURCE%\exclude.txt

echo.
echo ========================================
echo Copy Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open GitHub Desktop
echo 2. You should see all the changes
echo 3. Add a commit message
echo 4. Click "Commit to main"
echo 5. Click "Push origin"
echo.
pause

@echo off
REM EARIST OJT System - Automated Backup Runner
REM This batch file runs the backup system

cd /d "%~dp0"
python backup_system.py >> backup_logs.txt 2>&1

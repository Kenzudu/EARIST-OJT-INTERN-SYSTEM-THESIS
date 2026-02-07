# EARIST OJT System - Simple Automated Backup Setup (No Admin Required)
# This script creates a Windows Task Scheduler task using schtasks command

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EARIST OJT - Automated Backup Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$batchFile = Join-Path $scriptPath "run_backup.bat"

# Check if batch file exists
if (-not (Test-Path $batchFile)) {
    Write-Host "ERROR: run_backup.bat not found!" -ForegroundColor Red
    Write-Host "Expected location: $batchFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "Batch file found: $batchFile" -ForegroundColor Green
Write-Host ""

# Task details
$taskName = "EARIST_OJT_Daily_Backup"
$taskDescription = "Automated daily backup of EARIST OJT database and media files"

# Check if task already exists
$existingTask = schtasks /query /TN $taskName 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Task '$taskName' already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to recreate it? (y/n)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        schtasks /delete /TN $taskName /F | Out-Null
        Write-Host "Existing task removed." -ForegroundColor Green
    } else {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Creating scheduled task..." -ForegroundColor Cyan

# Create the task using schtasks (no admin required for current user tasks)
$result = schtasks /create `
    /TN $taskName `
    /TR "`"$batchFile`"" `
    /SC DAILY `
    /ST 02:00 `
    /F `
    /RL HIGHEST

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Automated backup is now set up!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $taskName" -ForegroundColor White
    Write-Host "  Schedule: Daily at 2:00 AM" -ForegroundColor White
    Write-Host "  Script: $batchFile" -ForegroundColor White
    Write-Host ""
    Write-Host "To test the backup now, run:" -ForegroundColor Yellow
    Write-Host "  python backup_system.py" -ForegroundColor White
    Write-Host ""
    Write-Host "To view the task in Task Scheduler:" -ForegroundColor Yellow
    Write-Host "  taskschd.msc" -ForegroundColor White
    Write-Host ""
    Write-Host "To manually run the task now:" -ForegroundColor Yellow
    Write-Host "  schtasks /run /TN $taskName" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create scheduled task!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try running this script as Administrator." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell → Run as Administrator" -ForegroundColor Yellow
    exit 1
}

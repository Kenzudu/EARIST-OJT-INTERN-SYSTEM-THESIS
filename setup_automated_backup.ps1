# EARIST OJT System - Setup Automated Backup Task
# This script creates a Windows Task Scheduler task to run daily backups

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
$taskName = "EARIST OJT Daily Backup"
$taskDescription = "Automated daily backup of EARIST OJT database and media files"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Task '$taskName' already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to recreate it? (y/n)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Existing task removed." -ForegroundColor Green
    } else {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Creating scheduled task..." -ForegroundColor Cyan

# Create the action (what to run)
$action = New-ScheduledTaskAction -Execute $batchFile -WorkingDirectory $scriptPath

# Create the trigger (when to run) - Daily at 2:00 AM
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00"

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -DontStopOnIdleEnd

# Create the principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Description $taskDescription `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force | Out-Null
    
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
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to create scheduled task!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to run this script as Administrator." -ForegroundColor Yellow
    exit 1
}

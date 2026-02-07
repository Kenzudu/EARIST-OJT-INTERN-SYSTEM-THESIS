"""
EARIST OJT System - Backup Status Checker
==========================================

This script checks if your backups are running automatically.

Usage:
    python check_backups.py

Shows:
- Latest backup date/time
- Number of backups
- Backup sizes
- Whether backups are current (within 24 hours)
"""

import os
from pathlib import Path
from datetime import datetime, timedelta
import json

# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_DIR = Path(__file__).parent
BACKUP_DIR = BASE_DIR / "backups"

# ============================================================================
# CHECK FUNCTIONS
# ============================================================================

def check_backup_status():
    """Check the status of backups."""
    print("=" * 80)
    print("🔍 EARIST OJT System - Backup Status Check")
    print("=" * 80)
    print(f"Checked at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check if backup directory exists
    if not BACKUP_DIR.exists():
        print("❌ CRITICAL: Backup directory does not exist!")
        print(f"   Expected location: {BACKUP_DIR}")
        print()
        print("⚠️  ACTION REQUIRED: Run 'python backup_system.py' to create first backup")
        return
    
    # Find all database backups
    db_backups = sorted(BACKUP_DIR.glob("db_backup_*.sqlite3"), reverse=True)
    
    if not db_backups:
        print("❌ CRITICAL: No backups found!")
        print()
        print("⚠️  ACTION REQUIRED: Run 'python backup_system.py' to create first backup")
        return
    
    # Get latest backup
    latest_backup = db_backups[0]
    
    # Extract timestamp from filename
    try:
        timestamp_str = latest_backup.stem.replace("db_backup_", "")
        latest_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
    except:
        print("⚠️  Could not parse backup date")
        latest_date = datetime.fromtimestamp(latest_backup.stat().st_mtime)
    
    # Calculate age
    now = datetime.now()
    age = now - latest_date
    hours_old = age.total_seconds() / 3600
    
    # Status indicator
    print("📊 BACKUP STATUS")
    print("-" * 80)
    
    if hours_old < 24:
        status = "✅ GOOD"
        status_msg = "Backups are current"
    elif hours_old < 48:
        status = "⚠️  WARNING"
        status_msg = "Backup is older than 24 hours"
    else:
        status = "❌ CRITICAL"
        status_msg = "Backup is very old - automatic backups may not be running!"
    
    print(f"Status: {status}")
    print(f"Message: {status_msg}")
    print()
    
    # Latest backup details
    print("📦 LATEST BACKUP")
    print("-" * 80)
    print(f"Date/Time: {latest_date.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Age: {int(hours_old)} hours ago ({age.days} days, {int(hours_old % 24)} hours)")
    print()
    
    # Check for corresponding files
    media_file = BACKUP_DIR / f"media_backup_{timestamp_str}.zip"
    env_file = BACKUP_DIR / f"env_backup_{timestamp_str}.txt"
    info_file = BACKUP_DIR / f"backup_info_{timestamp_str}.json"
    
    # Database
    db_size = latest_backup.stat().st_size / (1024 * 1024)
    print(f"📊 Database: {db_size:.2f} MB")
    
    # Media
    if media_file.exists():
        media_size = media_file.stat().st_size / (1024 * 1024)
        print(f"📁 Media: {media_size:.2f} MB")
    else:
        print(f"📁 Media: ❌ Missing")
    
    # Environment
    if env_file.exists():
        print(f"⚙️  Environment: ✅ Available")
    else:
        print(f"⚙️  Environment: ❌ Missing")
    
    # Metadata
    if info_file.exists():
        try:
            with open(info_file, 'r') as f:
                metadata = json.load(f)
            files_count = metadata.get("files_backed_up", "Unknown")
            print(f"📄 Files backed up: {files_count}")
        except:
            pass
    
    print()
    
    # Backup history
    print("📅 BACKUP HISTORY (Last 7 Days)")
    print("-" * 80)
    
    # Group backups by day
    backups_by_day = {}
    for db_backup in db_backups:
        try:
            timestamp_str = db_backup.stem.replace("db_backup_", "")
            backup_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            day_key = backup_date.strftime("%Y-%m-%d")
            
            if day_key not in backups_by_day:
                backups_by_day[day_key] = []
            backups_by_day[day_key].append(backup_date)
        except:
            continue
    
    # Show last 7 days
    for i in range(7):
        check_date = now - timedelta(days=i)
        day_key = check_date.strftime("%Y-%m-%d")
        
        if day_key in backups_by_day:
            count = len(backups_by_day[day_key])
            times = [d.strftime("%H:%M") for d in backups_by_day[day_key]]
            print(f"  {day_key}: ✅ {count} backup(s) at {', '.join(times)}")
        else:
            if i == 0:
                print(f"  {day_key}: ⚠️  No backup today yet")
            else:
                print(f"  {day_key}: ❌ No backup")
    
    print()
    
    # Total backups
    print("📈 BACKUP STATISTICS")
    print("-" * 80)
    print(f"Total backups: {len(db_backups)}")
    
    # Calculate total size
    total_size = sum(f.stat().st_size for f in BACKUP_DIR.iterdir() if f.is_file())
    total_size_mb = total_size / (1024 * 1024)
    total_size_gb = total_size / (1024 * 1024 * 1024)
    
    if total_size_gb > 1:
        print(f"Total size: {total_size_gb:.2f} GB")
    else:
        print(f"Total size: {total_size_mb:.2f} MB")
    
    print()
    
    # Recommendations
    print("💡 RECOMMENDATIONS")
    print("-" * 80)
    
    if hours_old > 24:
        print("⚠️  Latest backup is older than 24 hours!")
        print("   ACTION: Check if Task Scheduler is set up correctly")
        print("   Run: taskschd.msc → Find 'EARIST OJT Daily Backup'")
        print()
    
    if len(db_backups) == 1:
        print("⚠️  Only one backup exists!")
        print("   ACTION: Set up automatic daily backups in Task Scheduler")
        print("   See: BACKUP_SYSTEM_GUIDE.md")
        print()
    
    if hours_old < 24 and len(db_backups) > 1:
        print("✅ Everything looks good!")
        print("   Your backups are running automatically.")
        print()
    
    # Next expected backup
    if hours_old < 24:
        # Assume daily backup at 2 AM
        next_backup = latest_date + timedelta(days=1)
        next_backup = next_backup.replace(hour=2, minute=0, second=0)
        
        if next_backup < now:
            next_backup += timedelta(days=1)
        
        time_until = next_backup - now
        hours_until = time_until.total_seconds() / 3600
        
        print(f"⏰ Next expected backup: {next_backup.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   In approximately {int(hours_until)} hours")
    
    print()
    print("=" * 80)

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    try:
        check_backup_status()
    except Exception as e:
        print(f"❌ Error checking backup status: {e}")
        import traceback
        traceback.print_exc()

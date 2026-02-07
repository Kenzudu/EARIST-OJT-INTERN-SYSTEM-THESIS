"""
EARIST OJT System - Automated Backup Script
============================================

This script creates automated backups of:
1. Database (SQLite)
2. Uploaded files (media folder)
3. Environment configuration

Backups are stored with timestamps and old backups are automatically cleaned.

Usage:
    python backup_system.py

Schedule this to run daily using Windows Task Scheduler.
"""

import os
import shutil
import datetime
import zipfile
import json
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================

# Paths
BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR / "backend"
DATABASE_FILE = BACKEND_DIR / "db.sqlite3"
MEDIA_DIR = BACKEND_DIR / "media"
ENV_FILE = BACKEND_DIR / ".env"

# Backup directory
BACKUP_DIR = BASE_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

# Retention policy
KEEP_DAILY_BACKUPS = 30      # Keep daily backups for 30 days
KEEP_WEEKLY_BACKUPS = 12     # Keep weekly backups for 12 weeks
KEEP_MONTHLY_BACKUPS = 12    # Keep monthly backups for 12 months

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================

def get_timestamp():
    """Get current timestamp for backup naming."""
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

def get_backup_info():
    """Get information about what's being backed up."""
    info = {
        "timestamp": datetime.datetime.now().isoformat(),
        "database_size": 0,
        "media_size": 0,
        "files_backed_up": 0
    }
    
    if DATABASE_FILE.exists():
        info["database_size"] = DATABASE_FILE.stat().st_size
    
    if MEDIA_DIR.exists():
        media_files = list(MEDIA_DIR.rglob("*"))
        info["files_backed_up"] = len([f for f in media_files if f.is_file()])
        info["media_size"] = sum(f.stat().st_size for f in media_files if f.is_file())
    
    return info

def backup_database(timestamp):
    """Backup the SQLite database."""
    if not DATABASE_FILE.exists():
        print(f"⚠️  Database not found: {DATABASE_FILE}")
        return None
    
    backup_file = BACKUP_DIR / f"db_backup_{timestamp}.sqlite3"
    
    try:
        shutil.copy2(DATABASE_FILE, backup_file)
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        print(f"✅ Database backed up: {backup_file.name} ({size_mb:.2f} MB)")
        return backup_file
    except Exception as e:
        print(f"❌ Database backup failed: {e}")
        return None

def backup_media(timestamp):
    """Backup uploaded media files."""
    if not MEDIA_DIR.exists():
        print(f"⚠️  Media directory not found: {MEDIA_DIR}")
        return None
    
    backup_file = BACKUP_DIR / f"media_backup_{timestamp}.zip"
    
    try:
        with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file in MEDIA_DIR.rglob("*"):
                if file.is_file():
                    arcname = file.relative_to(MEDIA_DIR)
                    zipf.write(file, arcname)
        
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        print(f"✅ Media files backed up: {backup_file.name} ({size_mb:.2f} MB)")
        return backup_file
    except Exception as e:
        print(f"❌ Media backup failed: {e}")
        return None

def backup_env(timestamp):
    """Backup environment configuration."""
    if not ENV_FILE.exists():
        print(f"⚠️  .env file not found: {ENV_FILE}")
        return None
    
    backup_file = BACKUP_DIR / f"env_backup_{timestamp}.txt"
    
    try:
        shutil.copy2(ENV_FILE, backup_file)
        print(f"✅ Environment config backed up: {backup_file.name}")
        return backup_file
    except Exception as e:
        print(f"❌ Environment backup failed: {e}")
        return None

def save_backup_metadata(timestamp, info):
    """Save metadata about the backup."""
    metadata_file = BACKUP_DIR / f"backup_info_{timestamp}.json"
    
    try:
        with open(metadata_file, 'w') as f:
            json.dump(info, f, indent=2)
        print(f"✅ Backup metadata saved: {metadata_file.name}")
    except Exception as e:
        print(f"⚠️  Could not save metadata: {e}")

def cleanup_old_backups():
    """Remove old backups according to retention policy."""
    now = datetime.datetime.now()
    
    # Get all backup files
    all_backups = {}
    for pattern in ["db_backup_*.sqlite3", "media_backup_*.zip", "env_backup_*.txt", "backup_info_*.json"]:
        for backup_file in BACKUP_DIR.glob(pattern):
            try:
                # Extract timestamp from filename
                timestamp_str = backup_file.stem.split('_')[-2] + backup_file.stem.split('_')[-1]
                backup_date = datetime.datetime.strptime(timestamp_str, "%Y%m%d%H%M%S")
                
                if backup_date not in all_backups:
                    all_backups[backup_date] = []
                all_backups[backup_date].append(backup_file)
            except:
                continue
    
    # Sort backups by date
    sorted_backups = sorted(all_backups.items(), key=lambda x: x[0], reverse=True)
    
    deleted_count = 0
    for backup_date, files in sorted_backups:
        age_days = (now - backup_date).days
        
        # Keep daily backups for 30 days
        if age_days <= KEEP_DAILY_BACKUPS:
            continue
        
        # Keep weekly backups (one per week) for 12 weeks
        if age_days <= KEEP_DAILY_BACKUPS + (KEEP_WEEKLY_BACKUPS * 7):
            # Keep if it's the first backup of the week
            week_number = backup_date.isocalendar()[1]
            if backup_date.weekday() == 0:  # Monday
                continue
        
        # Keep monthly backups (one per month) for 12 months
        if age_days <= 365:
            # Keep if it's the first backup of the month
            if backup_date.day == 1:
                continue
        
        # Delete old backups
        for file in files:
            try:
                file.unlink()
                deleted_count += 1
            except Exception as e:
                print(f"⚠️  Could not delete {file.name}: {e}")
    
    if deleted_count > 0:
        print(f"🗑️  Cleaned up {deleted_count} old backup files")

# ============================================================================
# MAIN BACKUP PROCESS
# ============================================================================

def run_backup():
    """Run the complete backup process."""
    print("=" * 70)
    print("🔄 EARIST OJT System - Automated Backup")
    print("=" * 70)
    print(f"Started: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get timestamp for this backup
    timestamp = get_timestamp()
    
    # Get backup info
    info = get_backup_info()
    print(f"📊 Backup Information:")
    print(f"   Database size: {info['database_size'] / (1024*1024):.2f} MB")
    print(f"   Media files: {info['files_backed_up']} files ({info['media_size'] / (1024*1024):.2f} MB)")
    print()
    
    # Perform backups
    print("📦 Creating backups...")
    db_backup = backup_database(timestamp)
    media_backup = backup_media(timestamp)
    env_backup = backup_env(timestamp)
    
    # Save metadata
    print()
    save_backup_metadata(timestamp, info)
    
    # Cleanup old backups
    print()
    print("🧹 Cleaning up old backups...")
    cleanup_old_backups()
    
    # Summary
    print()
    print("=" * 70)
    print("✅ Backup completed successfully!")
    print(f"Finished: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backup location: {BACKUP_DIR}")
    print("=" * 70)

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    try:
        run_backup()
    except KeyboardInterrupt:
        print("\n⚠️  Backup cancelled by user")
    except Exception as e:
        print(f"\n❌ Backup failed with error: {e}")
        import traceback
        traceback.print_exc()

"""
EARIST OJT System - Restore Script
===================================

This script restores backups created by backup_system.py

Usage:
    python restore_system.py

The script will show available backups and let you choose which one to restore.

⚠️  WARNING: This will OVERWRITE your current database and files!
    Make sure you have a backup of the current state before restoring.
"""

import os
import shutil
import zipfile
import json
from pathlib import Path
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR / "backend"
DATABASE_FILE = BACKEND_DIR / "db.sqlite3"
MEDIA_DIR = BACKEND_DIR / "media"
ENV_FILE = BACKEND_DIR / ".env"
BACKUP_DIR = BASE_DIR / "backups"

# ============================================================================
# RESTORE FUNCTIONS
# ============================================================================

def list_available_backups():
    """List all available backups."""
    if not BACKUP_DIR.exists():
        print("❌ No backups directory found!")
        return []
    
    # Find all database backups (use these as the primary backup identifier)
    db_backups = list(BACKUP_DIR.glob("db_backup_*.sqlite3"))
    
    if not db_backups:
        print("❌ No backups found!")
        return []
    
    backups = []
    for db_file in sorted(db_backups, reverse=True):
        # Extract timestamp
        timestamp_str = db_file.stem.replace("db_backup_", "")
        
        try:
            backup_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
        except:
            continue
        
        # Check for corresponding files
        media_file = BACKUP_DIR / f"media_backup_{timestamp_str}.zip"
        env_file = BACKUP_DIR / f"env_backup_{timestamp_str}.txt"
        info_file = BACKUP_DIR / f"backup_info_{timestamp_str}.json"
        
        # Load metadata if available
        metadata = {}
        if info_file.exists():
            try:
                with open(info_file, 'r') as f:
                    metadata = json.load(f)
            except:
                pass
        
        backup_info = {
            "timestamp": timestamp_str,
            "date": backup_date,
            "db_file": db_file,
            "media_file": media_file if media_file.exists() else None,
            "env_file": env_file if env_file.exists() else None,
            "metadata": metadata
        }
        
        backups.append(backup_info)
    
    return backups

def display_backups(backups):
    """Display available backups in a formatted table."""
    print("\n" + "=" * 80)
    print("📦 AVAILABLE BACKUPS")
    print("=" * 80)
    print()
    
    for i, backup in enumerate(backups, 1):
        date_str = backup["date"].strftime("%Y-%m-%d %H:%M:%S")
        age_days = (datetime.now() - backup["date"]).days
        
        print(f"[{i}] {date_str} ({age_days} days ago)")
        
        # Database info
        db_size = backup["db_file"].stat().st_size / (1024 * 1024)
        print(f"    📊 Database: {db_size:.2f} MB")
        
        # Media info
        if backup["media_file"]:
            media_size = backup["media_file"].stat().st_size / (1024 * 1024)
            print(f"    📁 Media: {media_size:.2f} MB")
        else:
            print(f"    📁 Media: Not available")
        
        # Environment config
        if backup["env_file"]:
            print(f"    ⚙️  Environment: Available")
        else:
            print(f"    ⚙️  Environment: Not available")
        
        # Metadata
        if backup["metadata"]:
            files_count = backup["metadata"].get("files_backed_up", "Unknown")
            print(f"    📄 Files backed up: {files_count}")
        
        print()

def restore_database(backup_file):
    """Restore database from backup."""
    print(f"🔄 Restoring database from {backup_file.name}...")
    
    # Backup current database first
    if DATABASE_FILE.exists():
        current_backup = DATABASE_FILE.parent / f"db_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sqlite3"
        shutil.copy2(DATABASE_FILE, current_backup)
        print(f"   ✅ Current database backed up to: {current_backup.name}")
    
    # Restore from backup
    try:
        shutil.copy2(backup_file, DATABASE_FILE)
        print(f"   ✅ Database restored successfully!")
        return True
    except Exception as e:
        print(f"   ❌ Failed to restore database: {e}")
        return False

def restore_media(backup_file):
    """Restore media files from backup."""
    print(f"🔄 Restoring media files from {backup_file.name}...")
    
    # Backup current media first
    if MEDIA_DIR.exists():
        current_backup = MEDIA_DIR.parent / f"media_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copytree(MEDIA_DIR, current_backup)
        print(f"   ✅ Current media backed up to: {current_backup.name}")
        
        # Clear current media
        shutil.rmtree(MEDIA_DIR)
    
    # Create media directory
    MEDIA_DIR.mkdir(exist_ok=True)
    
    # Extract backup
    try:
        with zipfile.ZipFile(backup_file, 'r') as zipf:
            zipf.extractall(MEDIA_DIR)
        print(f"   ✅ Media files restored successfully!")
        return True
    except Exception as e:
        print(f"   ❌ Failed to restore media: {e}")
        return False

def restore_env(backup_file):
    """Restore environment configuration from backup."""
    print(f"🔄 Restoring environment config from {backup_file.name}...")
    
    # Backup current .env first
    if ENV_FILE.exists():
        current_backup = ENV_FILE.parent / f".env_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(ENV_FILE, current_backup)
        print(f"   ✅ Current .env backed up to: {current_backup.name}")
    
    # Restore from backup
    try:
        shutil.copy2(backup_file, ENV_FILE)
        print(f"   ✅ Environment config restored successfully!")
        return True
    except Exception as e:
        print(f"   ❌ Failed to restore environment: {e}")
        return False

# ============================================================================
# MAIN RESTORE PROCESS
# ============================================================================

def run_restore():
    """Run the restore process."""
    print("=" * 80)
    print("🔄 EARIST OJT System - Restore from Backup")
    print("=" * 80)
    
    # List available backups
    backups = list_available_backups()
    
    if not backups:
        return
    
    # Display backups
    display_backups(backups)
    
    # Get user choice
    print("=" * 80)
    print("⚠️  WARNING: Restoring will OVERWRITE your current data!")
    print("   Your current database and files will be backed up first.")
    print("=" * 80)
    print()
    
    try:
        choice = input("Enter backup number to restore (or 'q' to quit): ").strip()
        
        if choice.lower() == 'q':
            print("❌ Restore cancelled.")
            return
        
        choice_num = int(choice)
        
        if choice_num < 1 or choice_num > len(backups):
            print("❌ Invalid backup number!")
            return
        
        selected_backup = backups[choice_num - 1]
        
    except ValueError:
        print("❌ Invalid input!")
        return
    except KeyboardInterrupt:
        print("\n❌ Restore cancelled.")
        return
    
    # Confirm restore
    print()
    date_str = selected_backup["date"].strftime("%Y-%m-%d %H:%M:%S")
    print(f"You selected backup from: {date_str}")
    confirm = input("Are you sure you want to restore this backup? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("❌ Restore cancelled.")
        return
    
    # Perform restore
    print()
    print("=" * 80)
    print("🔄 Starting restore process...")
    print("=" * 80)
    print()
    
    success = True
    
    # Restore database
    if not restore_database(selected_backup["db_file"]):
        success = False
    
    print()
    
    # Restore media
    if selected_backup["media_file"]:
        if not restore_media(selected_backup["media_file"]):
            success = False
    else:
        print("⚠️  No media backup available, skipping...")
    
    print()
    
    # Restore environment
    if selected_backup["env_file"]:
        if not restore_env(selected_backup["env_file"]):
            success = False
    else:
        print("⚠️  No environment backup available, skipping...")
    
    # Summary
    print()
    print("=" * 80)
    if success:
        print("✅ Restore completed successfully!")
        print()
        print("⚠️  IMPORTANT: Restart your Django server for changes to take effect:")
        print("   1. Stop the current server (Ctrl+C)")
        print("   2. Run: python manage.py runserver")
    else:
        print("⚠️  Restore completed with some errors. Please check the messages above.")
    print("=" * 80)

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    try:
        run_restore()
    except KeyboardInterrupt:
        print("\n❌ Restore cancelled by user")
    except Exception as e:
        print(f"\n❌ Restore failed with error: {e}")
        import traceback
        traceback.print_exc()

"""
Backup Status API Views
Provides backup monitoring endpoints for admin dashboard
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from pathlib import Path
from datetime import datetime, timedelta
import json
import os

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_backup_status(request):
    """Get current backup status for admin dashboard"""
    
    # Only admins can access
    if not request.user.is_staff:
        return Response(
            {"error": "Access denied"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get project root directory
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    BACKUP_DIR = BASE_DIR / "backups"
    
    # Check if backup directory exists
    if not BACKUP_DIR.exists():
        return Response({
            "status": "error",
            "message": "Backup directory not found",
            "latest_backup": None,
            "backup_count": 0,
            "total_size_mb": 0,
            "health": "critical",
            "last_7_days": []
        })
    
    # Find all database backups
    db_backups = sorted(BACKUP_DIR.glob("db_backup_*.sqlite3"), reverse=True)
    
    if not db_backups:
        return Response({
            "status": "warning",
            "message": "No backups found",
            "latest_backup": None,
            "backup_count": 0,
            "total_size_mb": 0,
            "health": "warning",
            "last_7_days": []
        })
    
    # Get latest backup
    latest_backup = db_backups[0]
    
    # Extract timestamp from filename
    try:
        timestamp_str = latest_backup.stem.replace("db_backup_", "")
        latest_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
    except:
        latest_date = datetime.fromtimestamp(latest_backup.stat().st_mtime)
    
    # Calculate age
    now = datetime.now()
    age = now - latest_date
    hours_old = age.total_seconds() / 3600
    
    # Determine health status
    if hours_old < 24:
        health = "good"
        health_message = "Backups are current"
    elif hours_old < 48:
        health = "warning"
        health_message = "Backup is older than 24 hours"
    else:
        health = "critical"
        health_message = "Backup is very old - automatic backups may not be running!"
    
    # Get corresponding files
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
    
    # Calculate sizes
    db_size_mb = latest_backup.stat().st_size / (1024 * 1024)
    media_size_mb = media_file.stat().st_size / (1024 * 1024) if media_file.exists() else 0
    
    # Calculate total backup directory size
    total_size = sum(f.stat().st_size for f in BACKUP_DIR.iterdir() if f.is_file())
    total_size_mb = total_size / (1024 * 1024)
    
    # Get last 7 days history
    last_7_days = []
    backups_by_day = {}
    
    for db_backup in db_backups:
        try:
            timestamp_str = db_backup.stem.replace("db_backup_", "")
            backup_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            day_key = backup_date.strftime("%Y-%m-%d")
            
            if day_key not in backups_by_day:
                backups_by_day[day_key] = []
            backups_by_day[day_key].append(backup_date.strftime("%H:%M"))
        except:
            continue
    
    # Build 7-day history
    for i in range(7):
        check_date = now - timedelta(days=i)
        day_key = check_date.strftime("%Y-%m-%d")
        
        if day_key in backups_by_day:
            last_7_days.append({
                "date": day_key,
                "has_backup": True,
                "count": len(backups_by_day[day_key]),
                "times": backups_by_day[day_key]
            })
        else:
            last_7_days.append({
                "date": day_key,
                "has_backup": False,
                "count": 0,
                "times": []
            })
    
    # Next expected backup (assume daily at 2 AM)
    next_backup = latest_date + timedelta(days=1)
    next_backup = next_backup.replace(hour=2, minute=0, second=0)
    
    if next_backup < now:
        next_backup += timedelta(days=1)
    
    time_until = next_backup - now
    hours_until = time_until.total_seconds() / 3600
    
    return Response({
        "status": "success",
        "health": health,
        "message": health_message,
        "latest_backup": {
            "date": latest_date.strftime("%Y-%m-%d %H:%M:%S"),
            "age_hours": int(hours_old),
            "age_days": age.days,
            "db_size_mb": round(db_size_mb, 2),
            "media_size_mb": round(media_size_mb, 2),
            "has_media": media_file.exists(),
            "has_env": env_file.exists(),
            "files_backed_up": metadata.get("files_backed_up", "Unknown")
        },
        "backup_count": len(db_backups),
        "total_size_mb": round(total_size_mb, 2),
        "last_7_days": last_7_days,
        "next_expected": {
            "date": next_backup.strftime("%Y-%m-%d %H:%M:%S"),
            "hours_until": int(hours_until)
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_manual_backup(request):
    """Trigger a manual backup"""
    
    # Only admins can trigger backups
    if not request.user.is_staff:
        return Response(
            {"error": "Access denied"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    import subprocess
    import sys
    
    # Get project root directory
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    backup_script = BASE_DIR / "backup_system.py"
    
    if not backup_script.exists():
        return Response({
            "error": "Backup script not found",
            "path": str(backup_script)
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Run backup script
        result = subprocess.run(
            [sys.executable, str(backup_script)],
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        if result.returncode == 0:
            return Response({
                "success": True,
                "message": "Backup completed successfully",
                "output": result.stdout
            })
        else:
            return Response({
                "success": False,
                "message": "Backup failed",
                "error": result.stderr
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except subprocess.TimeoutExpired:
        return Response({
            "success": False,
            "message": "Backup timed out (took longer than 2 minutes)"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "success": False,
            "message": f"Failed to run backup: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

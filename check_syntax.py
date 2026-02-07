import py_compile
import sys
import os

files_to_check = [
    'backend/core/views.py',
    'backend/core/email_notifications.py'
]

print("Checking syntax...")
for file_path in files_to_check:
    full_path = os.path.abspath(file_path)
    if not os.path.exists(full_path):
        print(f"❌ File not found: {file_path}")
        continue
        
    try:
        py_compile.compile(full_path, doraise=True)
        print(f"✅ Syntax OK: {file_path}")
    except py_compile.PyCompileError as e:
        print(f"❌ Syntax Error in {file_path}:")
        print(e)
    except Exception as e:
        print(f"❌ Error checking {file_path}: {e}")

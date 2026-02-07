import os
import sys
import subprocess

# Set the email password environment variable
# This is the App Password provided by the user
os.environ['EMAIL_PASSWORD'] = "qbjg eehu klno qsuq"

print("📧 Email Password configured successfully!")
print("🚀 Starting Django Server...")

# Run the Django server
try:
    subprocess.run([sys.executable, 'manage.py', 'runserver'])
except KeyboardInterrupt:
    print("\n🛑 Server stopped.")

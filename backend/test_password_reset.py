"""
Test the password reset functionality
"""
import requests
import json

# API endpoint
url = "http://localhost:8000/api/request-password-reset/"

# Test with a known user email
test_data = {
    "username": "admin1"  # or use email: "kenzudu@gmail.com"
}

print("\n" + "="*60)
print("TESTING PASSWORD RESET FUNCTIONALITY")
print("="*60 + "\n")

print(f"📤 Sending password reset request for: {test_data['username']}")
print(f"🌐 Endpoint: {url}\n")

try:
    response = requests.post(url, json=test_data)
    
    print(f"📊 Response Status: {response.status_code}")
    print(f"📨 Response Data:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        print("\n✅ Password reset request successful!")
        print("📬 Check the email inbox for the new password")
        print("📺 Also check the Django terminal for detailed logs")
    else:
        print(f"\n❌ Password reset failed with status {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("❌ Error: Could not connect to the server")
    print("💡 Make sure the Django server is running on http://localhost:8000")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "="*60 + "\n")

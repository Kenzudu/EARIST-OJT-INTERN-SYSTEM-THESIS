import requests

url = "http://localhost:8000/api/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

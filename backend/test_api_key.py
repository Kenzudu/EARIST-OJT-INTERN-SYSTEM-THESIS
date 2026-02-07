"""
Test Google Gemini API Key
This script verifies if the API key is valid and lists available models.
"""
import os
import sys

# Add the project to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.conf import settings
import google.generativeai as genai

print("=" * 60)
print("GOOGLE GEMINI API KEY VERIFICATION")
print("=" * 60)

# Get API key from settings
api_key = settings.GOOGLE_API_KEY
print(f"\n✓ API Key Found: {api_key[:20]}...{api_key[-10:]}")
print(f"  (Length: {len(api_key)} characters)")

# Configure the API
try:
    genai.configure(api_key=api_key)
    print("\n✓ API Key configured successfully")
except Exception as e:
    print(f"\n✗ Failed to configure API key: {e}")
    sys.exit(1)

# List available models
print("\n" + "=" * 60)
print("AVAILABLE MODELS")
print("=" * 60)

try:
    models = genai.list_models()
    
    generative_models = []
    for model in models:
        # Check if model supports generateContent
        if 'generateContent' in model.supported_generation_methods:
            generative_models.append(model.name)
            print(f"\n✓ {model.name}")
            print(f"  Display Name: {model.display_name}")
            print(f"  Description: {model.description[:100]}...")
            print(f"  Methods: {', '.join(model.supported_generation_methods)}")
    
    if not generative_models:
        print("\n✗ No models support generateContent method!")
    else:
        print("\n" + "=" * 60)
        print(f"TOTAL MODELS AVAILABLE: {len(generative_models)}")
        print("=" * 60)
        print("\nRecommended model names to use:")
        for model_name in generative_models[:3]:  # Show first 3
            print(f"  - {model_name}")
            
except Exception as e:
    print(f"\n✗ Error listing models: {e}")
    print("\nThis could mean:")
    print("  1. API key is invalid")
    print("  2. Gemini API is not enabled in Google Cloud")
    print("  3. Network/firewall issue")
    sys.exit(1)

# Test a simple generation
print("\n" + "=" * 60)
print("TESTING GENERATION")
print("=" * 60)

if generative_models:
    test_model_name = generative_models[0]
    print(f"\nTesting with model: {test_model_name}")
    
    try:
        model = genai.GenerativeModel(test_model_name)
        response = model.generate_content("Say 'Hello, API is working!'")
        print(f"\n✓ SUCCESS! Response:")
        print(f"  {response.text}")
        
        print("\n" + "=" * 60)
        print("✓✓✓ API KEY IS VALID AND WORKING! ✓✓✓")
        print("=" * 60)
        print(f"\nUse this model name in your code: {test_model_name}")
        
    except Exception as e:
        print(f"\n✗ Generation failed: {e}")
        print("\nThe API key is valid, but there might be quota limits.")
else:
    print("\n✗ Cannot test generation - no models available")

print("\n")

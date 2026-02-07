"""
Add Resend Code button to TwoFactorSetupPage.js
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the location to insert the button (after the verify button, before the "Choose different method" button)
# Look for the pattern in step 2 (email verification)
search_pattern = '''                        </form>

                        <button
                            className="btn-link"
                            onClick={() => setStep(1)}
                        >
                            ← Choose different method
                        </button>'''

replacement = '''                        </form>

                        <button
                            type="button"
                            className="btn-resend"
                            onClick={handleResendCode}
                            disabled={loading}
                        >
                            🔄 Resend Code
                        </button>

                        <button
                            className="btn-link"
                            onClick={() => setStep(1)}
                        >
                            ← Choose different method
                        </button>'''

if search_pattern in content:
    content = content.replace(search_pattern, replacement)
    
    # Write back
    with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully added Resend Code button!")
else:
    print("❌ Could not find the pattern to replace")
    print("Searching for partial match...")
    if '</form>' in content and 'Choose different method' in content:
        print("✓ Found form and button separately")
    else:
        print("✗ Pattern not found")

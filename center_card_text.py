"""
Center all text inside method cards
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Change text-align from left to center for method-card
content = content.replace(
    'text-align: left;',
    'text-align: center;',
    1  # Only replace the first occurrence (in .method-card)
)

# Write back
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Centered all text inside cards!")

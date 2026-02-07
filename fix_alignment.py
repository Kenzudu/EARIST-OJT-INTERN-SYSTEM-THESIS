"""
Fix method card alignment in TwoFactorSetupPage.css
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the method-card display property
content = content.replace(
    'display: flex;\n    flex-direction: column;',
    'display: block;'
)

# Make sure all child elements are block-level
replacements = [
    ('.method-icon {', '.method-icon {\n    display: block;'),
    ('.method-card h3 {', '.method-card h3 {\n    display: block;'),
    ('.method-description {', '.method-description {\n    display: block;'),
    ('.method-detail {', '.method-detail {\n    display: block;'),
    ('.method-warning {', '.method-warning {\n    display: block;'),
]

for old, new in replacements:
    if old in content and 'display: block;' not in content[content.find(old):content.find(old)+200]:
        content = content.replace(old, new, 1)

# Write back
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed method card alignment!")

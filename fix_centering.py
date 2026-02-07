"""
Fix 2FA setup page centering and footer placement
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the setup-container to properly center
old_container = '''.setup-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    padding: 2rem;
}'''

new_container = '''.setup-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    padding: 2rem;
}'''

content = content.replace(old_container, new_container)

# Fix the setup-footer to be inside the card styling
old_footer = '''/* Footer */
.setup-footer {
    text-align: center;
    margin-top: 1.5rem;
    color: #666;
    font-size: 0.85rem;
}

.setup-footer p {
    margin: 0;
}'''

new_footer = '''/* Footer */
.setup-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e0e0;
    color: #666;
    font-size: 0.85rem;
}

.setup-footer p {
    margin: 0;
}'''

content = content.replace(old_footer, new_footer)

# Write back
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed centering and footer placement!")

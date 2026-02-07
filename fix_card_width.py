"""
Fix method card width alignment
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the .method-card section and ensure it has consistent width
old_method_card = '''.method-card {
    background: #fafafa;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    display: block;
}'''

new_method_card = '''.method-card {
    background: #fafafa;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    display: block;
    width: 100%;
    box-sizing: border-box;
}'''

content = content.replace(old_method_card, new_method_card)

# Write back
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\TwoFactorSetupPage.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed card width alignment!")

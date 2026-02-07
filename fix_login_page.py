"""
Fix LoginPage.js by removing the window.confirm code
"""

import re

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\LoginPage.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the problematic section
# Pattern to match the entire window.confirm block
old_pattern = r'// Check if 2FA method choice is required \(first time admin login\)\s+if \(res\.data\.requires_2fa_choice\) \{[^}]*window\.confirm\([^)]*\);[^}]*\}\s+return;\s+\}'

new_code = '''// Check if 2FA method choice is required (first time admin login)
      if (res.data.requires_2fa_choice) {
        // Store credentials for setup page
        localStorage.setItem("temp_user", JSON.stringify({
          username,
          role: 'admin'
        }));
        localStorage.setItem("temp_password", password);
        localStorage.setItem("temp_email", res.data.email || '');
        
        setSuccess("Redirecting to 2FA setup...");
        setTimeout(() => {
          navigate("/2fa-setup");
        }, 1000);
        return;
      }'''

# Try to replace
if 'window.confirm' in content:
    print("Found window.confirm in file")
    
    # Find the start and end of the block manually
    start_marker = '// Check if 2FA method choice is required (first time admin login)'
    start_idx = content.find(start_marker)
    
    if start_idx != -1:
        # Find the matching closing brace and return
        # Count from the if statement
        if_start = content.find('if (res.data.requires_2fa_choice)', start_idx)
        
        # Find the end - look for "return;\n      }" after the window.confirm block
        search_from = if_start
        brace_count = 0
        in_if = False
        end_idx = -1
        
        for i in range(search_from, len(content)):
            if content[i] == '{':
                brace_count += 1
                in_if = True
            elif content[i] == '}':
                brace_count -= 1
                if in_if and brace_count == 0:
                    # Found the closing brace, now find the next line
                    end_idx = i + 1
                    # Skip whitespace and newlines
                    while end_idx < len(content) and content[end_idx] in ' \r\n':
                        end_idx += 1
                    break
        
        if end_idx != -1:
            # Extract and replace
            old_block = content[start_idx:end_idx]
            new_content = content[:start_idx] + new_code + content[end_idx:]
            
            # Write back
            with open(r'c:\Users\Kenzu\Desktop\Earist OJT\frontend\src\pages\LoginPage.js', 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print("✅ Successfully replaced the code!")
            print(f"Removed {len(old_block)} characters")
            print(f"Added {len(new_code)} characters")
        else:
            print("❌ Could not find end of block")
    else:
        print("❌ Could not find start marker")
else:
    print("✅ No window.confirm found - file may already be fixed")

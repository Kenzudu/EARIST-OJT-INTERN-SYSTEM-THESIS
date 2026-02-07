#!/usr/bin/env python3
"""
Script to remove emojis from coordinator UI files for a clean, professional look
"""
import re
import os

def remove_emojis(text):
    """Remove all emoji characters from text"""
    # Emoji pattern - covers most common emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"  # dingbats
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"  # supplemental symbols
        "\U0001FA70-\U0001FAFF"  # symbols and pictographs extended-a
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub('', text)

def clean_file(filepath):
    """Remove emojis from a file"""
    print(f"Processing: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        cleaned_content = remove_emojis(content)
        
        if original_content != cleaned_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)
            print(f"  ✓ Cleaned emojis from {os.path.basename(filepath)}")
            return True
        else:
            print(f"  - No emojis found in {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"  ✗ Error processing {filepath}: {e}")
        return False

def main():
    print("=" * 60)
    print("Emoji Removal Script for Coordinator UI")
    print("=" * 60)
    print()
    
    # Base path
    base_path = r"c:\Users\ian\OneDrive\Desktop\Earist OJT\frontend\src\pages"
    
    # Files to clean
    files_to_clean = [
        "CoordinatorDashboard.js",
        "CoordinatorMonitoring.js",
        "CoordinatorGrading.js",
        "CoordinatorSettings.js",
        "CoordinatorHeader.js",
        "CoordinatorStudents.js",
        "CoordinatorCompanies.js",
        "CoordinatorApplications.js",
        "CoordinatorDocuments.js",
        "CoordinatorReports.js"
    ]
    
    cleaned_count = 0
    
    for filename in files_to_clean:
        filepath = os.path.join(base_path, filename)
        if os.path.exists(filepath):
            if clean_file(filepath):
                cleaned_count += 1
        else:
            print(f"  ! File not found: {filename}")
    
    print()
    print("=" * 60)
    print(f"✓ Completed! Cleaned {cleaned_count} file(s)")
    print("=" * 60)

if __name__ == "__main__":
    main()

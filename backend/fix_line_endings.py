import os

print("Fixing line endings...")

# Read file in binary
with open('core/views.py', 'rb') as f:
    content = f.read()

print(f"Original size: {len(content)} bytes")

# Remove null bytes
content = content.replace(b'\x00', b'')

# Fix double carriage returns (\r\r\n -> \r\n)
content = content.replace(b'\r\r\n', b'\r\n')

# Also fix any remaining \r\n to just \n for consistency
content = content.replace(b'\r\n', b'\n')

print(f"After fixing line endings: {len(content)} bytes")

# Write back
with open('core/views.py', 'wb') as f:
    f.write(content)

print("✅ Line endings fixed!")
print("Now run: python manage.py check")

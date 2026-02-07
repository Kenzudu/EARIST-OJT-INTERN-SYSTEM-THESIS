with open('core/views.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find all function definitions
func_starts = []
for i, line in enumerate(lines):
    if 'def coordinator_generate_document' in line:
        func_starts.append(i)

print(f"Found {len(func_starts)} definitions at lines: {[x+1 for x in func_starts]}")

# We want to keep only the LAST one (at line 5449, index 5448)
# Delete the first two

# Find where first function ends (next @api_view or def at same indent level)
def find_function_end(start_idx):
    for i in range(start_idx + 1, len(lines)):
        line = lines[i]
        # Check if it's a new function definition at top level or decorator
        if line.startswith('@') or (line.startswith('def ') and not line.startswith('    ')):
            return i
    return len(lines)

# Delete functions in reverse order to preserve line numbers
functions_to_delete = func_starts[:-1]  # All except last one

for func_start in reversed(functions_to_delete):
    func_end = find_function_end(func_start)
    print(f"Deleting function from line {func_start+1} to {func_end}")
    del lines[func_start:func_end]

# Write back
with open('core/views.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Duplicate functions removed!")
print("Kept only the last definition")

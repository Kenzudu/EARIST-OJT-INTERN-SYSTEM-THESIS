"""
Fix the corrupted CoordinatorGrading.js file
"""

# Read the file
with open('frontend/src/pages/CoordinatorGrading.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The corrupted section starts at line 292 (0-indexed: 291)
# We need to insert the missing <tbody> and student mapping

# Find the line with </thead>
for i, line in enumerate(lines):
    if '</thead>' in line and i > 280:
        print(f"Found </thead> at line {i+1}")
        # Insert the missing tbody section after this line
        indent = ' ' * 40  # Match the indentation
        
        missing_section = [
            f"{indent}<tbody>\n",
            f"{indent}    {{students.map(student => {{\n",
            f"{indent}        const grade = grades[student.id];\n",
            f"{indent}        return (\n",
            f"{indent}            <tr key={{student.id}}>\n",
            f"{indent}                <td>{{student.student_profile?.student_id || student.username}}</td>\n",
            f"{indent}                <td><strong>{{student.first_name && student.last_name ? `${{student.first_name}} ${{student.last_name}}` : student.username}}</strong></td>\n",
            f"{indent}                <td>{{grade ? `${{grade.attendance_score}}%` : '—'}}</td>\n",
            f"{indent}                <td>{{grade ? `${{grade.supervisor_score}}%` : '—'}}</td>\n",
            f"{indent}                <td>\n",
            f"{indent}                    {{grade ? (\n",
            f"{indent}                        <span style={{{{\n",
            f"{indent}                            padding: '4px 12px',\n"
        ]
        
        # Remove the corrupted lines (lines after </thead> until we find </tbody>)
        end_idx = i + 1
        while end_idx < len(lines) and '</tbody>' not in lines[end_idx]:
            end_idx += 1
        
        # Now reconstruct
        new_lines = lines[:i+1] + missing_section
        
        # Add the rest of the span and table structure
        new_lines.extend([
            f"{indent}                            borderRadius: '12px',\n",
            f"{indent}                            backgroundColor: grade.final_grade <= 3.0 ? '#d4edda' : '#f8d7da',\n",
            f"{indent}                            color: grade.final_grade <= 3.0 ? '#155724' : '#721c24',\n",
            f"{indent}                            fontWeight: 'bold'\n",
            f"{indent}                        }}}}>\n",
            f"{indent}                            {{grade.final_grade}}\n",
            f"{indent}                        </span>\n",
            f"{indent}                    ) : '—'}}\n",
            f"{indent}                </td>\n",
            f"{indent}                <td>{{grade?.remarks || '—'}}</td>\n",
            f"{indent}                <td>\n",
            f"{indent}                    <button\n",
            f"{indent}                        onClick={{() => handleComputeGrade(student.id)}}\n",
            f"{indent}                        disabled={{computing[student.id]}}\n",
            f"{indent}                        className=\"grading-btn-small\"\n",
            f"{indent}                    >\n",
            f"{indent}                        {{computing[student.id] ? 'Computing...' : 'Compute'}}\n",
            f"{indent}                    </button>\n",
            f"{indent}                </td>\n",
            f"{indent}            </tr>\n",
            f"{indent}        );\n",
            f"{indent}    })}}\n",
        ])
        
        # Add the rest of the file from </tbody> onwards
        new_lines.extend(lines[end_idx:])
        
        # Write back
        with open('frontend/src/pages/CoordinatorGrading.js', 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        print(f"Fixed! Removed lines {i+2} to {end_idx}, inserted corrected tbody section")
        break

print("Done!")

"""
Fix the corrupted views.py file by properly completing the compute_student_grade function
"""

# Read the file
with open('backend/core/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the broken section - the incomplete return Response
broken_start = content.find("        return Response({\n            'student': student.username,\n            'attendance_score': round(attendance_percentage, 2),\n            'supervisor_score': round(supervisor_percentage, 2),\n            'final_grade': grade,\n        )\n\n        try:")

if broken_start == -1:
    print("Could not find the broken section!")
    exit(1)

print(f"Found broken section at position {broken_start}")

# Find where coordinator_analytics should start
analytics_start_marker = '    """Get analytics specific to coordinator\'s college"""'
analytics_pos = content.find(analytics_start_marker, broken_start)

if analytics_pos == -1:
    print("Could not find coordinator_analytics!")
    exit(1)

print(f"Found coordinator_analytics at position {analytics_pos}")

# The correct completion for compute_student_grade
correct_ending = """        return Response({
            'student': student.username,
            'attendance_score': round(attendance_percentage, 2),
            'supervisor_score': round(supervisor_percentage, 2),
            'final_grade': grade,
            'remarks': remarks
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print(f"Error computing grade for student {student_id}: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f'Failed to compute grade: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_analytics(request):
"""

# Replace the broken section
new_content = content[:broken_start] + correct_ending + content[analytics_pos:]

# Write back
with open('backend/core/views.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ File fixed successfully!")
print("The compute_student_grade function has been properly completed.")
print("Please restart the Django server.")

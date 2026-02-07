import os

# Read the corrupted file
with open('core/views.py', 'rb') as f:
    content = f.read()

# Remove null bytes
content_clean = content.replace(b'\x00', b'')

# Convert to string
content_str = content_clean.decode('utf-8', errors='ignore')

# Find where the original file should end (before the appended junk)
# Look for the last proper function definition before corruption
marker = "return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)"

# Find the last occurrence of this marker
last_pos = content_str.rfind(marker)

if last_pos != -1:
    # Keep everything up to and including this line
    end_pos = content_str.find('\n', last_pos) + 1
    clean_content = content_str[:end_pos]
    
    # Add the two new functions
    clean_content += """

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_users_list(request):
    \"\"\"Get list of students for coordinator's college\"\"\"
    from django.contrib.auth.models import User
    
    coordinator_college = None
    if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile.college:
        coordinator_college = request.user.coordinator_profile.college
    
    students = User.objects.filter(is_staff=False, is_superuser=False)
    
    if coordinator_college:
        students = students.filter(student_profile__college=coordinator_college)
    
    student_data = []
    for student in students:
        student_data.append({
            'id': student.id,
            'username': student.username,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.email,
            'full_name': f"{student.first_name} {student.last_name}".strip() or student.username
        })
    
    return Response(student_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def coordinator_generate_document(request):
    \"\"\"Generate documents for coordinators\"\"\"
    from django.contrib.auth.models import User
    from .models import Application
    import os
    from django.conf import settings
    from datetime import datetime
    
    document_type = request.data.get('document_type')
    student_id = request.data.get('student_id')
    
    if not request.user.is_staff and not hasattr(request.user, 'coordinator_profile'):
        if not (hasattr(request.user, 'user_role') and request.user.user_role.role == 'coordinator'):
            return Response({'error': 'Only coordinators can generate documents'}, 
                          status=status.HTTP_403_FORBIDDEN)
    
    student = None
    if student_id:
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if document_type == 'training_plan':
        if not student:
            return Response({'error': 'Student is required for training plan'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        student_name = f"{student.first_name} {student.last_name}"
        student_profile = getattr(student, 'student_profile', None)
        program = student_profile.course if student_profile and student_profile.course else "N/A"
        
        company_name = "N/A"
        supervisor_name = "N/A"
        
        active_app = Application.objects.filter(student=student, status='Accepted').first()
        
        if active_app:
            company_name = active_app.internship.company.name
            if active_app.internship.company.contact_person:
                supervisor_name = active_app.internship.company.contact_person
        
        content = f\"\"\"ON-THE-JOB TRAINING PLAN
{'='*70}

Name of Company: {company_name}
Name of OJT Supervisor: {supervisor_name}
Job Designation: Intern

Name of Student Trainee: {student_name}
Program: {program}
STI Campus: EARIST
Training Period: [To be filled]
Required no. of hours: 486 hours

{'='*70}
TRAINING SCHEDULE
{'='*70}

Period | Area/Topic | Specific Tasks | Expected Output | Hours
{'-'*70}
Week 1  | Orientation | Company policies | Understanding rules | 40
Week 2  | Basic Skills | Tools and systems | Familiarity | 40
Week 3-4 | Core Tasks | Primary responsibilities | Task completion | 80
Week 5-8 | Advanced | Complex projects | Project deliverables | 160
Week 9-12 | Final Projects | Independent work | Final output | 166

{'='*70}

Noted by:
_____________________          _____________________
OJT Adviser                    OJT Coordinator

_____________________          _____________________
Student Trainee                Date of Approval

{'='*70}
PT-APO-008-00 | OJT Training Plan Template | Page 1 of 1
\"\"\"
        
        docs_dir = os.path.join(settings.MEDIA_ROOT, 'generated_documents')
        os.makedirs(docs_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"training_plan_{student.username}_{timestamp}.txt"
        filepath = os.path.join(docs_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        download_url = f"/media/generated_documents/{filename}"
        
        return Response({
            'success': True,
            'download_url': download_url,
            'format': 'txt',
            'message': 'Training plan generated successfully'
        })
    
    return Response({
        'error': f'Document type {document_type} not yet implemented'
    }, status=status.HTTP_400_BAD_REQUEST)
"""
    
    # Write the fixed file
    with open('core/views.py', 'w', encoding='utf-8') as f:
        f.write(clean_content)
    
    print("✅ File fixed successfully!")
    print(f"Original size: {len(content)} bytes")
    print(f"Cleaned size: {len(clean_content.encode('utf-8'))} bytes")
else:
    print("❌ Could not find marker to fix file")

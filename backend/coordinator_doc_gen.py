# Append this to the end of core/views.py

# ========================================
# COORDINATOR DOCUMENT GENERATION
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def coordinator_generate_document(request):
    """Generate documents for coordinators"""
    from django.contrib.auth.models import User
    from .models import Application
    import os
    from django.conf import settings
    from datetime import datetime
    
    document_type = request.data.get('document_type')
    student_id = request.data.get('student_id')
    format_type = request.data.get('format', 'pdf')
    
    # Verify coordinator access
    if not request.user.is_staff and not hasattr(request.user, 'coordinator_profile'):
        if not (hasattr(request.user, 'user_role') and request.user.user_role.role == 'coordinator'):
            return Response({'error': 'Only coordinators can generate documents'}, 
                          status=status.HTTP_403_FORBIDDEN)
    
    # Get student if required
    student = None
    if student_id:
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Handle training plan generation
    if document_type == 'training_plan':
        if not student:
            return Response({'error': 'Student is required for training plan'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get student details
        student_name = f"{student.first_name} {student.last_name}"
        student_profile = getattr(student, 'student_profile', None)
        student_id_num = student_profile.student_id if student_profile else student.username
        program = student_profile.course if student_profile and student_profile.course else "N/A"
        
        # Get company and supervisor info
        company_name = "N/A"
        supervisor_name = "N/A"
        
        # Try to get from active application
        active_app = Application.objects.filter(
            student=student, 
            status='Accepted'
        ).first()
        
        if active_app:
            company_name = active_app.internship.company.name
            if active_app.internship.company.contact_person:
                supervisor_name = active_app.internship.company.contact_person
        
        # Generate simple text-based training plan
        content = f"""
ON-THE-JOB TRAINING PLAN
{'='*60}

Name of Company: {company_name}
Name of OJT Supervisor: {supervisor_name}
Job Designation: Intern

Name of Student Trainee: {student_name}
Program: {program}
STI Campus: EARIST
Training Period: [To be filled]
Required no. of hours: 486 hours

{'='*60}
TRAINING SCHEDULE
{'='*60}

Period | Area/Topic | Specific Tasks | Expected Output | No. of Hours Spent
{'-'*60}
Week 1 | Orientation | Company policies and procedures | Understanding of workplace rules | 40
Week 2 | Basic Skills | Introduction to tools and systems | Familiarity with work environment | 40
Week 3-4 | Core Tasks | Hands-on training in primary responsibilities | Completion of assigned tasks | 80
Week 5-8 | Advanced Training | Complex projects and problem-solving | Project deliverables | 160
Week 9-12 | Final Projects | Independent work and evaluation | Final output and presentation | 166

{'='*60}

Noted by:
_____________________          _____________________
OJT Adviser                    OJT Coordinator
STI College Munoz              STI College Munoz

_____________________          _____________________
Student Trainee                Date of Approval

{'='*60}
OUTCOME POLICY
PT-APO-008-00 | OJT Training Plan Template | Page 1 of 1
"""
        
        # Create generated_documents directory if it doesn't exist
        docs_dir = os.path.join(settings.MEDIA_ROOT, 'generated_documents')
        os.makedirs(docs_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"training_plan_{student.username}_{timestamp}.txt"
        filepath = os.path.join(docs_dir, filename)
        
        # Write content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Return download URL
        download_url = f"/media/generated_documents/{filename}"
        
        return Response({
            'success': True,
            'download_url': download_url,
            'format': 'txt',
            'message': 'Training plan generated successfully'
        })
    
    # Other document types
    return Response({
        'error': f'Document type {document_type} not yet implemented'
    }, status=status.HTTP_400_BAD_REQUEST)

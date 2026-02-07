
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_users_list(request):
    """Get list of students for coordinator's college"""
    from django.contrib.auth.models import User
    
    # Get coordinator's college
    coordinator_college = None
    if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile.college:
        coordinator_college = request.user.coordinator_profile.college
    
    # Get all students
    students = User.objects.filter(is_staff=False, is_superuser=False)
    
    # Filter by college if coordinator has a college
    if coordinator_college:
        students = students.filter(student_profile__college=coordinator_college)
    
    # Serialize student data
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

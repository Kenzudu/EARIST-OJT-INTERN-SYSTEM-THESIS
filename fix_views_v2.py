import os

# The correct content for the two functions
new_code = """@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def compute_student_grade(request, student_id):
    \"\"\"Compute final grade for a student based on criteria\"\"\"
    try:
        student = User.objects.get(id=student_id)
        
        # 1. Calculate Attendance Score
        # Assumption: 486 hours required (or fetch from settings)
        required_hours = 486 
        total_hours = DailyJournal.objects.filter(student=student, status='Approved').aggregate(total=models.Sum('hours_rendered'))['total'] or 0
        attendance_percentage = min((float(total_hours) / required_hours) * 100, 100)
        
        # 2. Calculate Supervisor Rating Score
        # Average of overall_rating (1-5). Convert to percentage: (Rating / 5) * 100
        avg_rating = PerformanceEvaluation.objects.filter(student=student).aggregate(avg=models.Avg('overall_rating'))['avg'] or 0
        supervisor_percentage = (float(avg_rating) / 5.0) * 100
        
        # 3. Requirements Score (Placeholder logic)
        requirements_percentage = 100 # Assume complete for now
        
        # 4. Final Grade Computation based on GradingCriteria
        criteria = GradingCriteria.objects.all()
        final_score = 0
        
        # Default weights if no criteria set
        if not criteria.exists():
            # Default: 30% Attendance, 50% Supervisor, 20% Requirements
            final_score = (attendance_percentage * 0.30) + (supervisor_percentage * 0.50) + (requirements_percentage * 0.20)
        else:
            for c in criteria:
                if 'Attendance' in c.name:
                    final_score += (attendance_percentage * float(c.weight) / 100)
                elif 'Supervisor' in c.name or 'Evaluation' in c.name:
                    final_score += (supervisor_percentage * float(c.weight) / 100)
                elif 'Requirement' in c.name or 'Document' in c.name:
                    final_score += (requirements_percentage * float(c.weight) / 100)
        
        # Convert Percentage to Grade (1.0 - 5.0)
        if final_score >= 98: grade = 1.00
        elif final_score >= 95: grade = 1.25
        elif final_score >= 92: grade = 1.50
        elif final_score >= 89: grade = 1.75
        elif final_score >= 86: grade = 2.00
        elif final_score >= 83: grade = 2.25
        elif final_score >= 80: grade = 2.50
        elif final_score >= 77: grade = 2.75
        elif final_score >= 75: grade = 3.00
        else: grade = 5.00
        
        remarks = 'Passed' if grade <= 3.0 else 'Failed'
        
        # Save
        obj, created = StudentFinalGrade.objects.update_or_create(
            student=student,
            defaults={
                'attendance_score': attendance_percentage,
                'supervisor_rating_score': supervisor_percentage,
                'requirements_score': requirements_percentage,
                'final_grade': grade,
                'remarks': remarks
            }
        )
        
        return Response({
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
        print(f"Error computing grade: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f'Failed to compute grade: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_analytics(request):
    \"\"\"Get analytics specific to coordinator's college\"\"\"
    try:
        # Get coordinator's college
        coordinator_college = None
        
        # Try to get from coordinator profile
        try:
            if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile:
                coordinator_college = request.user.coordinator_profile.college
        except Exception as e:
            print(f"Error getting coordinator profile: {e}")
        
        # If admin or no college found, return error with helpful message
        if not coordinator_college:
            return Response({
                'error': 'Coordinator college not found. Please ensure your profile has a college assigned.',
                'college': '',
                'total_students': 0,
                'total_applications': 0,
                'pending_applications': 0,
                'approved_applications': 0,
                'rejected_applications': 0,
                'active_internships': 0,
                'completed_students': 0,
                'completion_rate': 0,
                'total_hours_rendered': 0,
                'average_hours_per_student': 0,
                'companies_utilized': 0,
                'average_performance_rating': 0,
                'current_term_placements': 0,
                'top_companies': [],
                'program_breakdown': []
            })
        
        # Get students from coordinator's college
        college_students = User.objects.filter(
            user_role__role='student',
            student_profile__college=coordinator_college
        )
        
        total_students = college_students.count()
        
        # Get student IDs for filtering
        student_ids = list(college_students.values_list('id', flat=True))
        
        # Applications from college students
        total_applications = Application.objects.filter(student_id__in=student_ids).count()
        pending_applications = Application.objects.filter(student_id__in=student_ids, status="Pending").count()
        approved_applications = Application.objects.filter(student_id__in=student_ids, status="Approved").count()
        rejected_applications = Application.objects.filter(student_id__in=student_ids, status="Rejected").count()
        
        # Active internships (students with approved applications)
        active_internships = Application.objects.filter(
            student_id__in=student_ids,
            status="Approved"
        ).count()
        
        # Completion rate - students who have completed internships
        try:
            completed_students = college_students.filter(
                student_profile__internship_status='Completed'
            ).count()
        except Exception as e:
            print(f"Error getting completed students: {e}")
            completed_students = 0
        completion_rate = (completed_students / total_students * 100) if total_students > 0 else 0
        
        # Hours rendered - sum of all approved journal hours
        from django.db.models import Sum, Avg, Count
        try:
            total_hours = DailyJournal.objects.filter(
                student_id__in=student_ids,
                status='Approved'
            ).aggregate(total=Sum('hours_rendered'))['total'] or 0
        except Exception as e:
            print(f"Error getting total hours: {e}")
            total_hours = 0
        
        average_hours = (total_hours / total_students) if total_students > 0 else 0
        
        # Company utilization - unique companies where students are placed
        try:
            companies_used = Application.objects.filter(
                student_id__in=student_ids,
                status="Approved"
            ).values('company').distinct().count()
        except Exception as e:
            print(f"Error getting companies used: {e}")
            companies_used = 0
        
        # Performance statistics - average ratings from evaluations
        try:
            avg_performance = PerformanceEvaluation.objects.filter(
                student_id__in=student_ids
            ).aggregate(avg_rating=Avg('overall_rating'))['avg_rating'] or 0
        except Exception as e:
            print(f"Error getting avg performance: {e}")
            avg_performance = 0
        
        # Per-term placements (current academic year)
        from datetime import datetime
        current_year = datetime.now().year
        try:
            current_term_placements = Application.objects.filter(
                student_id__in=student_ids,
                status="Approved",
                applied_at__year=current_year
            ).count()
        except Exception as e:
            print(f"Error getting current term placements: {e}")
            current_term_placements = 0
        
        # Top companies by student count
        try:
            top_companies = Application.objects.filter(
                student_id__in=student_ids,
                status="Approved"
            ).values('company__name').annotate(
                student_count=Count('id')
            ).order_by('-student_count')[:5]
        except Exception as e:
            print(f"Error getting top companies: {e}")
            top_companies = []
        
        # Program breakdown
        try:
            program_stats = college_students.values('student_profile__course').annotate(
                count=Count('id')
            ).order_by('-count')
        except Exception as e:
            print(f"Error getting program stats: {e}")
            program_stats = []
        
        return Response({
            'college': coordinator_college,
            'total_students': total_students,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'approved_applications': approved_applications,
            'rejected_applications': rejected_applications,
            'active_internships': active_internships,
            'completed_students': completed_students,
            'completion_rate': round(completion_rate, 2),
            'total_hours_rendered': round(total_hours, 2),
            'average_hours_per_student': round(average_hours, 2),
            'companies_utilized': companies_used,
            'average_performance_rating': round(avg_performance, 2),
            'current_term_placements': current_term_placements,
            'top_companies': list(top_companies),
            'program_breakdown': list(program_stats)
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in coordinator_analytics: {str(e)}")
        print(f"Traceback: {error_details}")
        return Response({
            'error': f'Internal server error: {str(e)}',
            'details': error_details if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
"""

file_path = 'backend/core/views.py'

# Read existing content
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep lines up to 3466 (inclusive)
# Line 3467 is where compute_student_grade starts
kept_lines = lines[:3466]

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(kept_lines)
    f.write('\n')
    f.write(new_code)

print("✅ Successfully fixed views.py")

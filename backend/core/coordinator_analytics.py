@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_analytics(request):
    """Get analytics specific to coordinator's college"""
    try:
        # Get coordinator's college
        coordinator_college = None
        if hasattr(request.user, 'coordinator_profile'):
            coordinator_college = request.user.coordinator_profile.college
        
        if not coordinator_college:
            return Response({'error': 'Coordinator college not found'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        completed_students = college_students.filter(
            student_profile__internship_status='Completed'
        ).count()
        completion_rate = (completed_students / total_students * 100) if total_students > 0 else 0
        
        # Hours rendered - sum of all approved journal hours
        from django.db.models import Sum
        total_hours = DailyJournal.objects.filter(
            student_id__in=student_ids,
            status='Approved'
        ).aggregate(total=Sum('hours_rendered'))['total'] or 0
        
        average_hours = (total_hours / total_students) if total_students > 0 else 0
        
        # Company utilization - unique companies where students are placed
        # Applications link to Internship, which links to Company
        all_apps = Application.objects.filter(student_id__in=student_ids)
        approved_apps = all_apps.filter(status="Approved")
        approved_apps_with_company = approved_apps.filter(
            internship__isnull=False,
            internship__company__isnull=False
        )
        
        print(f"DEBUG: Total students in college: {len(student_ids)}")
        print(f"DEBUG: Total applications from these students: {all_apps.count()}")
        print(f"DEBUG: Approved applications: {approved_apps.count()}")
        print(f"DEBUG: Approved applications with internship & company: {approved_apps_with_company.count()}")
        
        # Print some sample data
        if approved_apps_with_company.exists():
            sample = approved_apps_with_company.first()
            print(f"DEBUG: Sample - Student: {sample.student.username}, Company: {sample.internship.company.name if sample.internship and sample.internship.company else 'None'}")
        
        companies_used = approved_apps_with_company.values('internship__company').distinct().count()
        print(f"DEBUG: Unique companies count: {companies_used}")
        
        # Performance statistics - average ratings from evaluations
        from django.db.models import Avg
        avg_performance = PerformanceEvaluation.objects.filter(
            student_id__in=student_ids
        ).aggregate(avg_rating=Avg('overall_rating'))['avg_rating'] or 0
        
        # Per-term placements (current academic year)
        from datetime import datetime
        current_year = datetime.now().year
        current_term_placements = Application.objects.filter(
            student_id__in=student_ids,
            status="Approved",
            applied_at__year=current_year
        ).count()
        
        # Top companies by student count
        top_companies = Application.objects.filter(
            student_id__in=student_ids,
            status="Approved",
            internship__isnull=False,
            internship__company__isnull=False
        ).values('internship__company__name').annotate(
            student_count=Count('id')
        ).order_by('-student_count')[:5]
        
        # Program breakdown
        program_stats = college_students.values('student_profile__course').annotate(
            count=Count('id')
        ).order_by('-count')
        
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
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

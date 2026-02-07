
# Statistics endpoint for admin dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_statistics(request):
    """Get user statistics by role"""
    try:
        # Count users by role
        from .models import UserRole
        
        total_users = User.objects.count()
        total_admins = UserRole.objects.filter(role='admin').count()
        total_coordinators = UserRole.objects.filter(role='coordinator').count()
        total_supervisors = UserRole.objects.filter(role='supervisor').count()
        total_students = UserRole.objects.filter(role='student').count()
        
        # Also count users without roles (legacy)
        users_without_role = User.objects.filter(user_role__isnull=True).count()
        
        return Response({
            'total_users': total_users,
            'total_admins': total_admins,
            'total_coordinators': total_coordinators,
            'total_supervisors': total_supervisors,
            'total_students': total_students,
            'users_without_role': users_without_role
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

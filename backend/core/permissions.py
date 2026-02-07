"""
Role-based permission decorators for the internship management system.
Based on adviser requirements document.
"""

from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from core.models import UserRole


def role_required(allowed_roles):
    """
    Decorator to check if user has one of the required roles.
    
    Usage:
        @role_required([UserRole.ADMIN, UserRole.COORDINATOR])
        def my_view(request):
            # Only Admin and Coordinator can access
            pass
    
    Args:
        allowed_roles: List of role constants (e.g., [UserRole.ADMIN])
    
    Returns:
        Decorated function that checks user role before execution
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user has a role assigned
            if not hasattr(request.user, 'user_role'):
                return Response(
                    {'error': 'No role assigned to this user'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user's role is in allowed roles
            if request.user.user_role.role not in allowed_roles:
                return Response(
                    {
                        'error': 'Insufficient permissions',
                        'required_roles': allowed_roles,
                        'your_role': request.user.user_role.role
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # User has required role, proceed with view
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def admin_only(view_func):
    """Shortcut decorator for admin-only views"""
    return role_required([UserRole.ADMIN])(view_func)


def coordinator_or_admin(view_func):
    """Shortcut decorator for coordinator or admin views"""
    return role_required([UserRole.ADMIN, UserRole.COORDINATOR])(view_func)


def supervisor_only(view_func):
    """Shortcut decorator for supervisor-only views"""
    return role_required([UserRole.SUPERVISOR])(view_func)


def student_only(view_func):
    """Shortcut decorator for student-only views"""
    return role_required([UserRole.STUDENT])(view_func)

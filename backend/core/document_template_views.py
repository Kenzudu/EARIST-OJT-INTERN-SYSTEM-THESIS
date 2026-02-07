"""
Document Template Management Views
Handles CRUD operations for system-wide document templates
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import DocumentTemplate, UserRole
from .serializers import DocumentTemplateSerializer
from django.contrib.auth.models import User


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def document_templates_list(request):
    """
    GET: List all document templates
    POST: Create a new document template (Admin/Coordinator only)
    """
    
    if request.method == 'GET':
        # All authenticated users can view templates
        templates = DocumentTemplate.objects.filter(is_active=True).order_by('-created_at')
        serializer = DocumentTemplateSerializer(templates, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Allow Staff OR Admin Role OR Coordinator Role
        has_permission = request.user.is_staff
        if not has_permission and hasattr(request.user, 'user_role'):
             has_permission = request.user.user_role.role in [UserRole.ADMIN, UserRole.COORDINATOR]

        if not has_permission:
            return Response(
                {"error": "Only administrators can upload document templates"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create template with uploaded_by field
        data = request.data.copy()
        
        serializer = DocumentTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def document_template_detail(request, pk):
    """
    GET: Retrieve a specific template
    PUT: Update a template (Admin only)
    DELETE: Delete a template (Admin only)
    """
    
    try:
        template = DocumentTemplate.objects.get(pk=pk)
    except DocumentTemplate.DoesNotExist:
        return Response(
            {"error": "Template not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = DocumentTemplateSerializer(template)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Allow Staff OR Admin Role OR Coordinator Role
        has_permission = request.user.is_staff
        if not has_permission and hasattr(request.user, 'user_role'):
             has_permission = request.user.user_role.role in [UserRole.ADMIN, UserRole.COORDINATOR]

        if not has_permission:
            return Response(
                {"error": "Only administrators can update document templates"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = DocumentTemplateSerializer(template, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Allow Staff OR Admin Role OR Coordinator Role
        has_permission = request.user.is_staff
        if not has_permission and hasattr(request.user, 'user_role'):
             has_permission = request.user.user_role.role in [UserRole.ADMIN, UserRole.COORDINATOR]

        if not has_permission:
            return Response(
                {"error": "Only administrators can delete document templates"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Soft delete by setting is_active to False
        template.is_active = False
        template.save()
        
        return Response(
            {"message": "Template deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

from rest_framework.views import APIView
from rest_framework.response import Response
from authman.permissions import IsAdminOrReadOnly
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework import generics
from django.utils import timezone
from rest_framework.generics import RetrieveAPIView
from core.models import Project, ProjectTimeline, FileAttachment, Phase
from core.serializers import ProjectSerializer, ProjectListSerializer, ProjectDetailSerializer
from core.models import Project

import logging


logger = logging.getLogger(__name__)


class ProjectDetailAPIView(RetrieveAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrReadOnly]  # Adjust permissions as needed


class ProjectCreateAPIView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def post(self, request):
        serializer = ProjectSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            project = serializer.save(author=request.user)  # Save the project

            # Return success response
            return Response({
                'status': 'success',
                'message': f"Project '{project.title}' created successfully",
                'data': {
                    'id': project.id,
                    'title': project.title,
                    'description': project.description,
                    'note': project.note,
                    'author': project.author.username,
                    'target_end_time': project.target_end_time,
                    'phase': project.phase.name,
                    'create_time': project.create_time
                }},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', "message": "Project 'title' cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST)


class ProjectAPIView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            permission_classes = [IsAdminOrReadOnly]  # Permission for POST method
        elif self.request.method == 'PUT':
            permission_classes = [IsAdminOrReadOnly]  # Permission for PUT method
        elif self.request.method == 'DELETE':
            permission_classes = [IsAdminOrReadOnly]  # Permission for DEL method
        else:
            permission_classes = [IsAuthenticated]  # Default permission (e.g., for GET)
        return [permission() for permission in permission_classes]

    def put(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        title = request.data.get('title')
        target_end_time = request.data.get('target_end_time')

        if title and '<script>' not in title and project.title != title:
            if not Project.objects.filter(title=title):
                project.title = title
            else:
                return Response({
                    'status': 'error',
                    'message': f'project with title "{title}" already exist.'
                }, status=status.HTTP_400_BAD_REQUEST)

        if target_end_time:
            if target_end_time <= str(timezone.now().date()):
                return Response({
                    'status': 'error', 'message': 'Target End Time must be in the future.'
                }, status=status.HTTP_400_BAD_REQUEST)
            project.target_end_time = target_end_time

        description = request.data.get('description')
        if isinstance(description, str):
            project.description = description

        note = request.data.get('note')
        if isinstance(note, str):
            project.note = note

        project.save()

        # Track event in ProjectTimeline for the update
        title = project.title
        self.add_timeline_entry(
            request.user, project, f"Project '{title}' updated.", "update"
        )

        return Response({
            'status': 'success', 'message': 'Project updated successfully.'
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({
                'status': 'error', 'message': 'Project not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        if project.phase.name != 'Backlog':
            return Response({
                'status': 'error',
                'message': 'Project can only be deleted if its state is Backlog'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachments_count = FileAttachment.objects.filter(project=project).count()
        if attachments_count > 0:
            return Response({
                'status': 'error',
                'message': 'Cannot delete project with attachments'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Track event in ProjectTimeline for the deletion
        self.add_timeline_entry(
            request.user, project, f"Project '{project.title}' deleted.", "delete"
        )
        project.delete()

        return Response({
            'status': 'success',
            'message':'Project deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    @staticmethod
    def add_timeline_entry(user, project, change_note, event_type):
        timeline = ProjectTimeline(project=project, user=user, change_note=change_note, status=event_type)
        timeline.save()


class ProjectListView(generics.ListCreateAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        projects = Project.objects.all()
        return projects


class ProjectDetailView(generics.RetrieveAPIView):
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Add input validation and sanitization here if needed

            # Rate limiting and throttling can be applied using Django REST Framework's built-in classes

            serializer = self.get_serializer(instance)
            logger.info(f"Project detail retrieved for Project ID: {instance.id} by user: {request.user.username}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            logger.error(f"Requested project does not exist")
            return Response({"status": "error", "message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error retrieving project detail: {str(e)}")
            return Response({"message": "Error retrieving project detail"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Override finalize_response to add security headers, content security policy, etc.
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        # Add security headers (e.g., X-Content-Type-Options, X-Frame-Options, X-XSS-Protection) to the response
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["X-XSS-Protection"] = "1; mode=block"

        # Implement Content Security Policy (CSP) headers to mitigate XSS attacks
        # Example:
        # response["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"

        return response
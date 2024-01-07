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
                'message': f"Project '{project.title}' created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(
            {'status': 'error'},
            serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectUpdateAPIView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def put(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({
                'status': 'error', 'message': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProjectSerializer(project, data=request.data, context={'request': request})

        if serializer.is_valid():
            validated_data = serializer.validated_data

            phase_id = validated_data.get('phase')
            if not phase_id or not Phase.objects.filter(id=phase_id).exists():
                return Response({
                    'status': 'error', 'message': 'Invalid phase provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            target_end_time = validated_data.get('target_end_time')
            if target_end_time and target_end_time <= timezone.now():
                return Response({
                    'status': 'error', 'message': 'Target End Time must be in the future.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            project = serializer.save()  # Save the updated project

            # Track event in ProjectTimeline for the update
            title = project.title
            self.add_timeline_entry(request.user, title, f"Project '{title}' updated.")

            return Response({
                'status': 'success', 'message': 'Project updated successfully.'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def add_timeline_entry(user, project, change_note):
        timeline = ProjectTimeline(project=project, user=user, change_note=change_note, status="update")
        timeline.save()


class ProjectDeleteAPIView(APIView):
    permission_classes = [IsAdminOrReadOnly]

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

        project_title = project.title
        project.delete()

        # Track event in ProjectTimeline for the deletion
        self.add_timeline_entry(request.user, project_title, f"Project '{project_title}' deleted.")

        return Response({
            'status': 'success',
            'message':'Project deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    @staticmethod
    def add_timeline_entry(user, project, change_note):
        timeline = ProjectTimeline(project=project, user=user, change_note=change_note, status="delete")
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
    # You may add authentication and permissions here based on your requirements
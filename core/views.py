from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .permissions import IsAdminOrReadOnly


class ProjectCreateAPIView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def post(self, request):
        # Logic for creating a project
        return Response("Project created successfully")


class PhaseAssignmentAPIView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        # Logic for assigning a phase
        return Response("Phase assigned successfully")

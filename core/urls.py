from django.urls import path
from core.views import (
    ProjectCreateAPIView,
    ProjectListView,
    ProjectAPIView,
    AddRemoveAttachmentAPIView,
    FileUploadStatusAPIView,
    AssignProjectPhaseView,
    PhaseStatusUpdateView
)

urlpatterns = [
    path('api/projects/create/', ProjectCreateAPIView.as_view(), name='create-project'),
    path('api/projects/', ProjectListView.as_view(), name='projects'),
    path('api/projects/<int:pk>/', ProjectAPIView.as_view(), name='project'),
    path('api/projects/<int:project_id>/attachments/', AddRemoveAttachmentAPIView.as_view(), name='add-attachments'),
    path(
        'api/projects/<int:project_id>/attachments/<str:file_id>/',
        AddRemoveAttachmentAPIView.as_view(), name='delete-attachments'
    ),
    path(
        'api/projects/<int:project_id>/attachments/<int:file_id>/upload-status/',
        FileUploadStatusAPIView.as_view(), name='file-upload-status'
    ),
    path('api/projects/<int:pk>/phase/', AssignProjectPhaseView.as_view(), name='assign_phase'),
    path('api/projects/<int:pk>/<str:phase_status>/', PhaseStatusUpdateView.as_view(), name='update-phase-status'),
]

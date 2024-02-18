from django.urls import path
from core.views import (
    ProjectCreateAPIView,
    ProjectListView,
    ProjectAPIView,
    AddRemoveAttachmentAPIView,
    FileUploadStatusAPIView,
    AssignProjectPhaseView,
    PhaseStatusUpdateView,
    DownloadFileAPIView,
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
<<<<<<< HEAD
    path('api/projects/<int:pk>/phase/', AssignProjectPhaseView.as_view(), name='assign_phase'),
    path('api/projects/<int:pk>/<str:phase_status>/', PhaseStatusUpdateView.as_view(), name='update-phase-status'),
=======
    path('projects/<int:pk>/phase/', AssignProjectPhaseView.as_view(), name='assign_phase'),
    path('projects/<int:pk>/<str:phase_status>/', PhaseStatusUpdateView.as_view(), name='update-phase-status'),
    path('download-file/<int:file_id>/', DownloadFileAPIView.as_view(), name='download_file'),
>>>>>>> bd03604f935b200dfa7328863750b92a5a15c6cf
]

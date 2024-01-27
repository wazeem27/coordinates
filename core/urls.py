from django.urls import path
from core.views import (
    ProjectCreateAPIView,
    ProjectListView,
    ProjectAPIView,
    AddRemoveAttachmentAPIView,
    FileUploadStatusAPIView,
    AssignProjectPhaseView
)

urlpatterns = [
    path('projects/create/', ProjectCreateAPIView.as_view(), name='create-project'),
    path('projects/', ProjectListView.as_view(), name='projects'),
    path('projects/<int:pk>/', ProjectAPIView.as_view(), name='project'),
    path('projects/<int:project_id>/attachments/', AddRemoveAttachmentAPIView.as_view(), name='add-attachments'),
    path(
        'projects/<int:project_id>/attachments/<str:file_id>/',
        AddRemoveAttachmentAPIView.as_view(), name='delete-attachments'
    ),
    path(
        'projects/<int:project_id>/attachments/<int:file_id>/upload-status/',
        FileUploadStatusAPIView.as_view(), name='file-upload-status'
    ),
    path('projects/<int:pk>/phase/', AssignProjectPhaseView.as_view(), name='assign_phase'),
]

from django.urls import path
from core.views import (
    ProjectCreateAPIView,
    ProjectUpdateAPIView,
    ProjectDeleteAPIView,
    ProjectDetailAPIView,
    ProjectListView,
)

urlpatterns = [
    path('projects/create/', ProjectCreateAPIView.as_view(), name='create-project'),
    path('projects/', ProjectListView.as_view(), name='projects'),
    path('projects/<int:pk>/update/', ProjectUpdateAPIView.as_view(), name='update-project'),
    path('projects/<int:pk>/delete/', ProjectDeleteAPIView.as_view(), name='delete-project'),
    path('projects/<int:pk>/', ProjectDetailAPIView.as_view(), name='project-detail'),
]

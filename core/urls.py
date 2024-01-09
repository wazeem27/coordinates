from django.urls import path
from core.views import (
    ProjectCreateAPIView,
    ProjectListView,
    ProjectAPIView,
)

urlpatterns = [
    path('projects/create/', ProjectCreateAPIView.as_view(), name='create-project'),
    path('projects/', ProjectListView.as_view(), name='projects'),
    path('projects/<int:pk>/', ProjectAPIView.as_view(), name='project'),
]

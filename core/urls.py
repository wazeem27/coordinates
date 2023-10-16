from django.urls import path, include
from django.views.generic import TemplateView
from . views import (
    ProjectCreateView, ProjectDetailView, AddRemoveAttachmentView,
    download_file, BacklogList, ProductionList, QCList, DeliveryList,
    CompletedList, delete_model_object, edit_phase_assignments,
    DashboardView
)


urlpatterns = [
    path('', DashboardView.as_view(), name='core-dashboard'),
    path('projects/', ProjectCreateView.as_view(template_name='core/project.html'), name='core-projects'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('project/<int:project_id>/add_remove_attachment/', AddRemoveAttachmentView.as_view(), name='add_remove_attachment'),
    path('download-file/<int:file_id>/', download_file, name='download_file'),
    path('backlog_list/', BacklogList.as_view(), name='core-backlog'),
    path('production_list/', ProductionList.as_view(), name='core-production'),
    path('qc_list/', QCList.as_view(), name='core-qc'),
    path('delivery_list/', DeliveryList.as_view(), name='core-delivery'),
    path('completed_list/', CompletedList.as_view(), name='core-completed'),
    #path('edit_phase_assignments/<int:pk>/', edit_phase_assignments, name='edit_phase_assignments'),
    path('project/<int:pk>/delete/', delete_model_object, name='delete_project'),
]
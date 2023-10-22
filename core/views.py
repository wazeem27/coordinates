import datetime

from django.shortcuts import render, redirect, get_object_or_404, reverse
from django.http import HttpResponseRedirect
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.http import HttpResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.views.generic.edit import CreateView, FormView, DeleteView, View
from django.views.generic import TemplateView, DetailView
from django.contrib import messages
from .models import Project, FileAttachment, Tag, PhaseAssignment
from .forms import ProjectForm, FileAttachmentForm, PhaseAssignmentForm
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import shutil
from django.http import JsonResponse
import os
import json
import boto3
from coordinates import settings


class ProjectCreateView(LoginRequiredMixin, CreateView):
    model = Project
    form_class = ProjectForm

    def get(self, request):
        project_count = {
            "Backlog": 0, "Production":0, "QC": 0, "Delivery": 0, "Completed": 0
        }
        form = self.form_class()
        projects_objects = self.model.objects.all()
        for project in projects_objects:
            phase_name = project.phase.name
            current_count = project_count.get(phase_name, 0)  # Get the current count or 0 if not found
            project_count[phase_name] = current_count + 1 
        project_data = [{
            "identity": data.id,
            "title": data.title, "description": data.description,
            "note": data.note, "create_time": data.create_time.date(),
            "completion_date": data.completion_date,
            "phase": data.phase.name,
            "target_end_time": data.target_end_time.date(),
            "author": data.author, "phase": data.phase }
            for data in projects_objects ]
        return render(request, self.template_name, {'form': form, 'projects': project_data, 'count': project_count})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            title = form.cleaned_data['title']
            project = form.save(commit=False)
            project.author = self.request.user
            project.save()
            messages.success(request, f'Project "{title}" created successfully.')
            return redirect('core-projects')  # Redirect to a success view
        return render(request, self.template_name, {'form': form})


class ProjectDetailView(LoginRequiredMixin, DetailView):
    model = Project
    template_name = 'core/backlog_detail.html' 
    context_object_name = 'project'

    def get(self, request, *args, **kwargs):
        # Override the get method to handle any additional logic
        # For example, you can perform custom actions here before rendering the detail view
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        obj = self.get_object()
        # Add the additional form to the context
        context['attachment_form'] = FileAttachmentForm()  # Initialize the additional form
        tags = Tag.objects.all()
        all_tags = [{"name": tag.name, "id": tag.id} for tag in tags]
        context['tags'] = all_tags
        user_list = PhaseAssignment.objects.filter(id=obj.id)
        assigned_to = ",".join([user.username for user in user_list])
        context["AssignedTo"] = "Nil" if not assigned_to else assigned_to
        
        attachments = FileAttachment.objects.filter(project=obj.id)
        existing_attachments = [
            {"file_id": file_obj.id,
             "file_name": file_obj.file_name, "tag": file_obj.tag.name,
             "uploaded_by": file_obj.uploaded_by.username,
             "uploaded_at": file_obj.create_time} for file_obj in attachments]
        context['existing_attachments'] = existing_attachments
        return context


@login_required
def delete_model_object(request, pk):
    obj = get_object_or_404(Project, pk=pk)
    if obj:
        files = FileAttachment.objects.filter(project=obj)
        if files:
            messages.error(request,
                f'Project "{obj.title}" cannot be deleted. '
                'It has Attachments, (delete the attachments first if you really want to delete it.)'
            )
            return redirect('core-projects')
        elif not obj.phase.name == 'Backlog':
            messages.error(request,
                f'Project "{obj.title}" is not in backlog Phase. '
                'In Progress project cannot be deleted.'
            )
            return redirect('core-projects')
        else:
            obj.delete()
            messages.success(request,
                f'Project "{obj.title}" has been deleted successfully.'
            )
            return redirect('core-projects')


class AddRemoveAttachmentView(LoginRequiredMixin, View):
    template_name = 'core/backlog_detail.html' 
    form_class = FileAttachmentForm
    success_url = '/coordinates/'  # Customize the success URL as needed

    def post(self, request, project_id):
        # Check if the 'delete' query parameter is present in the URL
        action = request.POST.get("action")
        project = Project.objects.get(id=self.kwargs.get('project_id'))
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        if action == "delete":
            # Handle delete logic here
            file_path = request.POST.get('file_path', '')
            attachments_to_delete = FileAttachment.objects.filter(file_name=file_path)
            for attachment in attachments_to_delete:
                # Delete the attachment file from storage
                attachment.delete()
                s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_path)
            message = f'Attchment deleted successfully from "{project.title}".'
            redirect_url = f"{reverse('project-detail', kwargs={'pk': project.id})}?message={message}"
            return redirect(redirect_url)
        else:
            tag_id = int(self.request.POST.get('tag'))
            file = self.request.FILES['file']          

            # Get the associated tag for the attachment
            if tag_id and file:
                tag = Tag.objects.get(pk=tag_id)
                file_path = f"{project.title}/{tag.name}/{file.name}"
                file_name = default_storage.save(file_path, ContentFile(file.read()))
                # Create a model instance and populate it with form data
                attachment_instance = FileAttachment(
                    project=project,
                    tag=tag,
                    file_name=file_path,
                    uploaded_by=request.user,
                    # Populate other model fields as needed
                )
                attachment_instance.save()  # Save the model instance to the database
                message = f'Added {file.name} attchment to "{project.title}" successfully.'
                redirect_url = f"{reverse('project-detail', kwargs={'pk': project.id})}?message={message}"
                return redirect(redirect_url)
            else:
                messages.error(
                    self.request, 'File & Tag are required fields for adding attachment.'
                )
        return redirect(redirect_url)

    def get_success_url(self):
        # Redirect to the same view with the project_id and 'delete' query parameter
        project_id = self.kwargs['project_id']
        return reverse('project-detail', args=[project_id]) + '?delete=true'

@login_required
def download_file(request, file_id):
    if file_id is not None:
        # Initialize AWS S3 client
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        file_name = FileAttachment.objects.get(id=int(file_id)).file_name
        try:
            # Retrieve the file from S3
            s3_response = s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_name)

            # Create an HTTP response with the file content
            response = HttpResponse(s3_response['Body'].read())
            response['Content-Type'] = s3_response['ContentType']
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'

            return response
        except Exception as e:
            return HttpResponse(f'Error: {str(e)}', status=500)

    return HttpResponse('Invalid request', status=400)


class BacklogList(LoginRequiredMixin, View):
    template_name = 'core/backlog_list.html' 

    def get(self, request):
        # Add the additional form to the context
        backlog_items = Project.objects.filter(phase__name="Backlog")
        return render(request, self.template_name, {'backlogs': backlog_items})

class ProductionList(LoginRequiredMixin, View):
    template_name = 'core/production_list.html' 

    def get(self, request):
        # Add the additional form to the context
        production_list = Project.objects.filter(phase__name="Production")
        return render(request, self.template_name, {'production_list': production_list})

class QCList(LoginRequiredMixin, View):
    template_name = 'core/qc_list.html' 

    def get(self, request):
        # Add the additional form to the context
        qc_items = Project.objects.filter(phase__name="QC")
        return render(request, self.template_name, {'qc_items': qc_items})


class DeliveryList(LoginRequiredMixin, View):
    template_name = 'core/delivery_list.html' 

    def get(self, request):
        # Add the additional form to the context
        delivery_items = Project.objects.filter(phase__name="Delivery")
        return render(request, self.template_name, {'delivery_items': delivery_items})


class CompletedList(LoginRequiredMixin, View):
    template_name = 'core/completed_list.html' 

    def get(self, request):
        # Add the additional form to the context
        completed_items = Project.objects.filter(phase__name="Completed")
        return render(request, self.template_name, {'completed_items': completed_items})


@login_required
def edit_phase_assignments(request, project_pk):
    project = Project.objects.get(pk=project_pk)  # Get the project based on the pk
    #phase = Phase.objects.get(...)  # Get the appropriate Phase
    assigned_by = request.user  # Use the current user as the assigned_by

    if request.method == 'POST':
        form = PhaseAssignmentForm(request.POST)
        if form.is_valid():
            assigned_users = form.cleaned_data['assigned_users']

            # Create a PhaseAssignment instance with the manually handled fields
            PhaseAssignment.objects.create(
                project=project,
                phase=phase,
                assigned_by=assigned_by,
                assigned_users=assigned_users
            )

            return redirect('phase_assignments_list')  # Redirect to the list view
    else:
        form = PhaseAssignmentForm()

    return render(request, 'edit_phase_assignments.html', {'form': form})


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'core/dashboard.html'  # Specify the template name

    def get(self, request, *args, **kwargs):
        projects = Project.objects.all()
        data = {"production": 0, "qc": 0, "delivery": 0, "completed": 0}
        for project in projects:
            if project.phase.name.lower() == "production":
                data["production"] += 1
            elif project.phase.name.lower() == "qc":
                data["qc"] += 1
            elif project.phase.name.lower() == "validating":
                data["delivery"] += 1
            elif project.phase.name.lower() == "completed":
                data["completed"] += 1
            else:
                continue
        return render(request, 'core/dashboard.html', data)

class Development(LoginRequiredMixin, TemplateView):
    template_name = 'core/development.html'  # Specify the template name

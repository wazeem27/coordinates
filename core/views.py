from rest_framework.views import APIView
from rest_framework.response import Response
from authman.permissions import IsAdminOrReadOnly
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework import generics
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
import boto3
from django.contrib.auth.models import User
from botocore.exceptions import ClientError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import RetrieveAPIView
from core.models import Project, ProjectTimeline, FileAttachment, Phase, Tag
from core.serializers import (
    ProjectSerializer, ProjectListSerializer, ProjectDetailSerializer)
from core.models import PhaseAssignment, PhaseStatus, AssignmentDetail
from coordinates import settings
from core.utils import (
    handle_uploaded_file, initiate_s3_multipart_upload, upload_s3_multipart_part,
    complete_s3_multipart_upload, delete_s3_file
)

import logging


logger = logging.getLogger(__name__)



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
    
    def get(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProjectDetailSerializer(project)
        serialized_data = serializer.data

        return Response(serialized_data, status=status.HTTP_200_OK)

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


class AddRemoveAttachmentAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        try:
            file = request.data.get('file')
            tag_id = request.data.get('tag', '')
            logger.info(f"Tag ID form request is --> {tag_id}")
            logger.info(f"Input File is ---> {file}")

            if not (tag_id != '' and file):
                return Response(
                    {
                        "status": "error",
                        "message": "Tags and file are required for uploading attachments."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            tag_id = int(tag_id)  # convert it to integer

            if project.phase.name == 'Backlog' and not request.user.is_staff:
                raise Response(
                    {
                        "status": "error",
                        "message": "You do not have permission to add attachments to Backlog phase."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            tag = get_object_or_404(Tag, pk=tag_id)
            file_path = f"{project.title}/{project.phase.name}/{tag.name}/{file.name}"
            logger.info(f"File path to be stored is {file_path}.")

            # Initiating S3 Multipart Upload
            upload_id = initiate_s3_multipart_upload(file_path)
            logger.info(f"Upload ID generated is {upload_id}")

            # Uploading file parts to S3
            upload_parts = []
            for part_number, part_data in enumerate(file.chunks(), start=1):
                part_etag = upload_s3_multipart_part(file_path, upload_id, part_number, part_data)
                upload_parts.append({'PartNumber': part_number, 'ETag': part_etag})

            # Completing S3 Multipart Upload
            complete_s3_multipart_upload(file_path, upload_id, upload_parts)

            # Saving FileAttachment instance in the database
            attachment_instance = FileAttachment(
                project=project,
                tag=tag,
                file_name=file_path,
                uploaded_by=request.user,
                phase=project.phase
                # Populate other model fields as needed
            )
            attachment_instance.save()
            logger.info(f"Attachment detail is stored successfully in db {attachment_instance}")

            message = f'Added {file.name} attachment to "{project.title}" successfully.'
            timeline = ProjectTimeline(
                project=project, user=request.user,
                change_note=f"File Attachment '{file.name}' Added.",
                status="add"
            )
            timeline.save()
            logger.info(f"")

            return Response(
                {
                    "status": "success",
                    "message": message,
                    "attachment": {"id": attachment_instance.id, "file_name": file_path}
                },
                status=status.HTTP_201_CREATED
            )

        except ClientError as ce:
            return Response(
                {
                    "status": "error",
                    "message": f"Failed to handle the file upload: {str(ce)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception as e:
            return Response({"status": "error", "message": f"An unexpected error occurred: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, project_id, file_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "message": f"Project with id {project_id} not found."
                }, status=status.HTTP_404_NOT_FOUND
            )

        try:
            attachment = FileAttachment.objects.get(id=file_id)
        except FileAttachment.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "message": "No attachment found."
                }, status=status.HTTP_404_NOT_FOUND
            )

        try:
            if project.phase.name == 'Backlog' and not request.user.is_staff:
                raise PermissionError("You do not have permission to delete attachments in Backlog phase.")

            file_path = attachment.file_name

            # Deleting file from S3
            delete_s3_file(file_path)

            # Deleting FileAttachment instance from the database
            attachment.delete()

            message = f'Attachment deleted successfully from "{project.title}".'
            timeline = ProjectTimeline(
                project=project, user=request.user,
                change_note=f"File Attachment '{file_path}' deleted.",
                status="delete"
            )
            timeline.save()

            return Response({"status": "success", "message": message}, status=status.HTTP_200_OK)

        except PermissionError as pe:
            return Response({"status": "error", "message": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        except ClientError as ce:
            return Response({"status": "error", "message": f"Failed to delete the file: {str(ce)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"status": "error", "message": f"An unexpected error occurred: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileUploadStatusAPIView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, project_id, file_id):
        project = get_object_or_404(Project, id=project_id)
        file_attachment = get_object_or_404(FileAttachment, project=project, id=file_id)

        try:
            upload_id = file_attachment.id
            if not upload_id:
                return Response({"status": "error", "message": "Multipart upload not initiated for this file."},
                                status=status.HTTP_400_BAD_REQUEST)

            s3 = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )

            # Get the list of parts uploaded
            response = s3.list_parts(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_attachment.file_name, UploadId=upload_id)
            parts = response.get('Parts', [])

            total_parts = len(parts)
            completed_parts = len([part for part in parts if part.get('ETag') is not None])

            if total_parts == 0:
                percentage_completed = 0
            else:
                percentage_completed = (completed_parts / total_parts) * 100

            return Response({"status": "success", "percentage_completed": percentage_completed},
                            status=status.HTTP_200_OK)

        except ClientError as ce:
            return Response({"status": "error", "message": f"Failed to get upload status: {str(ce)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"status": "error", "message": f"An unexpected error occurred: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssignProjectPhaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            project = Project.objects.get(id=pk)
        except Exception as error:
            logger.error(f"project with id {pk} does not exist.")
            return Response(
                {
                    'status': 'error',
                    'message': 'Project Not found'
                }, status=status.HTTP_404_NOT_FOUND 
            )
        user_to_be_assigned = request.data.getlist('user_ids')
        phase_to_assign = request.data.get('phase_to_assign')
        phase_note = request.data.get('phase_note', '')
        phase_end_date = request.data.get('phase_end_date')
        user_queryset = User.objects.filter(id__in=user_to_be_assigned)
        

        # base case if current phase is backlog and users list is [] (empty) throw error
        if project.phase.name =='Backlog' and not user_to_be_assigned:
            return Response(
                {
                    'status': 'error', 'message': 'Add atleast one user in assign list.'
                }, status=status.HTTP_400_BAD_REQUEST
            )
        elif project.phase.name =='Backlog' and not FileAttachment.objects.filter(project=project):
            return Response(
                {
                    'status': 'error',
                    'message': 'Add atleast one attachmnt before assigning phase to User'
                }, status=status.HTTP_400_BAD_REQUEST
            )
        elif phase_to_assign.title() not in ['Production', 'QC', 'Delivery']:
            return Response(
                {
                    'status': 'error', 'message': f'Invalid phase "{phase_to_assign}"'
                }, status=status.HTTP_400_BAD_REQUEST
            )

        elif phase_to_assign and user_to_be_assigned:
            user_queryset = User.objects.filter(id__in=user_to_be_assigned)
            if len(user_queryset) != len(user_to_be_assigned):
                # Check if all user IDs were found in the queryset
                found_user_ids = {str(user.id) for user in user_queryset}
                missing_user_ids = set(user_to_be_assigned) - found_user_ids
                return Response(
                    {
                        'status': 'error',
                        'message': f'Users with IDs {", ".join(missing_user_ids)} not found'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif phase_to_assign == 'Production' and not user_to_be_assigned:
                previous_phase = PhaseAssignment.objects.filter(project=project, phase__name='Production')
                previous_phase.delete()
                backlog_phase = Phase.object.get(name='Backlog')
                project.phase = backlog_phase
                project.save()
                msg = "Project Moved back to backlog phase. Since all assignees are removed from Production phase."
                logger.info(msg)
                return Respose(
                    {
                        'status': 'success',
                        'message': msg,
                        'detail': {
                            'id': project.id,
                            'title': project.title,
                            'description': project.description,
                            'note': project.note
                        }
                    }
                )
            
            elif project.phase.name == 'Backlog' and phase_to_assign.title() == 'Production' and user_queryset:
                assign_phase = PhaseAssignment.objects.create(
                    project=project, phase=Phase.objects.get(name='Production'), assigned_by=request.user,
                    status='Open'
                )
                project.phase = Phase.objects.get(name='Production')
                project.save()
            elif project.phase.name == 'QC' and phase_to_assign.title() == 'QC':
                assign_phase = PhaseAssignment.objects.create(
                    project=project, phase=Phase.objects.get(name='QC'), assigned_by=request.user,
                    status='Open'
                )
                project.phase = Phase.objects.get(name='QC')
                project.save()
            elif project.phase.name == 'Delivery' and phase_to_assign.title() == 'Delivery':
                assign_phase = PhaseAssignment.objects.create(
                    project=project, phase=Phase.objects.get(name='Delivery'), assigned_by=request.user,
                    status='Open'
                )
                project.phase = Phase.objects.get(name='Delivery')
                project.save()
            # Assign Phase to user
            assign_phase.assigned_to.set([user for user in user_queryset])
            assign_phase.save()
            # Add assignment details
            assign_detail = AssignmentDetail.objects.create(
                assignment=assign_phase, note=phase_note,
            )
            if phase_end_date:
                assign_detail.end_date = datetime.strptime(phase_end_date, '%b %d %Y %I:%M%p')
                assign_detail.save()
            logger.info(f"Save Project Phase assignment.")
            assignee_names = ', '.join([usr.username for usr in user_queryset])
            timeline = ProjectTimeline(
                project=project, user=request.user,
                change_note=f"Assigned project Phase {project.phase.name} to user {assignee_names}",
                status="add"
            )
            timeline.save()
            logger.info("Saved Timeline detail in db.")
            return Response({
                'status': 'success', 'message': f'Assigned users [{assignee_names}] to project phase',
                'detail': {
                    'project': {'id': project.id, 'title': project.title,
                        'phase': {
                            'id': assign_phase.phase.id, 'name': assign_phase.phase.name,
                            'assigned_by': assign_phase.assigned_by.username,
                            'status': assign_phase.status,
                            'assigned_date': assign_phase.assigned_date,
                            'note': assign_detail.note,
                            'phase_end_date': assign_detail.end_date,
                            'assignees': [{'username': usr.username, 'id': usr.id} for usr in user_queryset]
                        }
                    }

                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response({
                'status': 'error',
                'message': 'Invalid phase.'
            })

    def put(self, request, pk, phase_name):
        user_to_be_assigned = request.data.getlist('user_ids')
        project = Project.objects.get(id=pk)
        try:
            if phase_name.lower() not in ['production', 'qc', 'delivery']:
                pass
            elif phase_name.lower() == 'completed':
                return Response(
                    {
                        'status': 'error',
                        'message': 'Cannot update completed Project Phase.'
                    }, status=status.HTTP_400_BAD_REQUEST
                )
            elif phase_name.lower() == 'backlog':
                return Response(
                    {
                        'status': 'error',
                        'message': 'Phase details can be updated only when its moved to Production or higher phase.'
                    }, status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as error:
            pass
            




        

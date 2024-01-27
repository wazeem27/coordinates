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
        project = get_object_or_404(Project, id=pk)
        user_ids = list(set(request.data.getlist('user_ids', [])))
        phase_to_assign = request.data.get('phase_to_assign', '').title()
        phase_note = request.data.get('phase_note', '')
        phase_end_date = request.data.get('phase_end_date', '')

        logger.debug(f"Assignee list: {user_ids}")
        logger.debug(f"Phase to assign: {phase_to_assign}")
        logger.debug(f"Phase Note: {phase_note}")
        logger.debug(f"Phase end date: {phase_end_date}")

        # validate incoming assignee_ids
        try:
            is_valid_users = list(map(lambda x: int(x), user_ids))
        except Exception as error:
            return Response(
                {
                    'status': 'error', 'message': f"Invalid user ID's given {user_ids}"
                }, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            end_date = datetime.strptime(phase_end_date, '%b %d %Y %I:%M%p') if phase_end_date else None
        except ValueError as error:
            logger.error(f"Invalid End Date time given: {phase_end_date}")
            return Response({'status': 'error', 'message': 'Invalid End Date time'}, status=status.HTTP_400_BAD_REQUEST)

        valid_phase_names = [choice[0].title() for choice in Phase.PHASE_CHOICES]
        if phase_to_assign not in valid_phase_names:
            logger.error(f"Invalid phase: {phase_to_assign}")
            return Response({'status': 'error', 'message': 'Invalid phase'}, status=status.HTTP_400_BAD_REQUEST)

        elif phase_to_assign.title() == 'Backlog':
            return Response(
                {
                    'status': 'error',
                    'message': (
                        'You are trying to move Project Phase from Backlog to Backlog '
                        'which is Invalid.')
                }, status=status.HTTP_400_BAD_REQUEST
            )
        
        # handle phase cannot be moved from one to another except backlog
        if project.phase.name == 'Backlog' and phase_to_assign.title() != 'Production':
            return Response(
                {
                    'status': 'error',
                    'message': (
                        'You are tryng to move Project phase form backlog to QC '
                        'which is not allowed')
                }, status=status.HTTP_400_BAD_REQUEST
            )
        if project.phase.name != 'Backlog' and project.phase.name.title() != phase_to_assign.title():
            return Response(
                {
                    'status': 'error',
                    'message': (
                        'Project cannot be moved from one phase to another '
                        'before current phase is marked as completed'
                    )
                }, status=status.HTTP_400_BAD_REQUEST
            )
            

        def move_to_backlog():
            previous_phase = PhaseAssignment.objects.filter(project=project, phase__name=phase_to_assign)
            previous_phase.delete()
            timeline = ProjectTimeline.objects.create(
                project=project, user=self.request.user,
                change_note=f"Moved project Phase from 'Production' to 'Backlog",
                status="update"
            )
            backlog_phase = Phase.objects.get(name='Backlog')
            project.phase = backlog_phase
            project.save()
            msg = "Project moved back to backlog phase. All assignees are removed from the Production phase."
            logger.info(msg)
            return Response({
                'status': 'success',
                'message': msg,
                'data': {
                    'project': {
                        'title': project.title, 'description': project.description,
                        'note': project.note, 'phase': project.phase.name,
                        'phases': []
                    }
                }
            })

        if project.phase.name == 'Backlog' and not user_ids:
            logger.warning("No users provided for assignment.")
            return Response({'status': 'error', 'message': 'Add at least one user in the assign list.'}, status=status.HTTP_400_BAD_REQUEST)

        elif project.phase.name == 'Backlog' and not project.fileattachment_set.exists():
            logger.warning("No attachments found before assigning phase.")
            return Response({'status': 'error', 'message': 'Add at least one attachment before assigning phase to a user'}, status=status.HTTP_400_BAD_REQUEST)
        
        elif ((project.phase.name not in ['Backlog'] and
                project.phase.name.title() == phase_to_assign.title()) or
                (project.phase.name == 'Production' and user_ids)):
            if phase_to_assign.upper() == 'QC':
                phase_to_assign = 'QC'
            # Handle if phase_to_assign is upper or lower phase but not Backlog
            # then throw error that current phase has to be marked as completed
            if project.phase.name.title() != phase_to_assign.title():
                return Response(
                    {
                        'status': 'error',
                        'message': (
                            'Project cannot be moved from one phase to another '
                            'before current phase is marked as completed'
                        )
                    }
                )
            # Update the Phase Assignment details instead of creating a new object
            # For production we have to move the phase back to Backlog for a scenario
            phase_assignment = PhaseAssignment.objects.get(project=project)
            existing_assigned_users = [usr.id for usr in phase_assignment.assigned_to.all()]
            if set(user_ids) != set(existing_assigned_users):
                phase_assignment.assigned_to.set(user_ids)
                phase_assignment.save()

                # add event in Project timeline
                usernames = [usr.username for usr in User.objects.filter(id__in=set(user_ids))]
                timeline = ProjectTimeline.objects.create(
                    project=project, user=self.request.user,
                    change_note=f"Assigned project Phase {project.phase.name} to user(s) {usernames}",
                    status="update"
                )
            assignment_detail = AssignmentDetail.objects.get(assignment=phase_assignment)
            phase_note_and_date_event = False
            if assignment_detail.note != phase_note:
                phase_note_and_date_event = True
                assignment_detail.note = phase_note
                assignment_detail.save()
            if (phase_end_date and
                    assignment_detail.end_date != datetime.strptime(phase_end_date, '%b %d %Y %I:%M%p')):
                
                phase_note_and_date_event = True
                assignment_detail.end_date =  datetime.strptime(phase_end_date, '%b %d %Y %I:%M%p')
                assignment_detail.save()
            
            # Update event in project timeline
            if phase_note_and_date_event:
                timeline = ProjectTimeline.objects.create(
                    project=project, user=self.request.user,
                    change_note=f"Updated assignment note & Phase End Date.",
                    status="update"
                )
            return Response({
                'status': 'success', 'message': 'Succesffully updated Phase details',
                'data': self.get_project_detail(project, phase_assignment, assignment_detail)
            })

        elif phase_to_assign == 'Production' and not user_ids:
            return move_to_backlog()

        phase_assignment, project_detail = self.assign_phase_to_user(project, phase_to_assign, user_ids, phase_note, end_date)
        return Response({
            'status': 'success',
            'message': f'Assigned users [{", ".join(user_ids)}] to project phase',
            'data': project_detail
        }, status=status.HTTP_200_OK)

    def assign_phase_to_user(self, project, phase_to_assign, user_ids, phase_note, end_date):
        if phase_to_assign.upper() == 'QC':
            phase_to_assign = 'QC'
        assign_phase = PhaseAssignment.objects.create(
            project=project, phase=Phase.objects.get(name=phase_to_assign), assigned_by=self.request.user, status='Open'
        )
        project.phase = Phase.objects.get(name=phase_to_assign)
        project.save()

        # Assign Phase to user
        assign_phase.assigned_to.set(user_ids)
        assign_phase.save()

        # Add assignment details
        assign_detail = AssignmentDetail.objects.create(
            assignment=assign_phase, note=phase_note, end_date=end_date
        )

        logger.info(f"Saved Project Phase assignment for project ID {project.id}.")

        assignee_names = ', '.join([usr.username for usr in assign_phase.assigned_to.all()])
        timeline = ProjectTimeline.objects.create(
            project=project, user=self.request.user,
            change_note=f"Assigned project Phase {project.phase.name} to user(s) {assignee_names}",
            status="add"
        )

        logger.info(f"Saved Timeline detail in the database for project ID {project.id}.")

        return assign_phase, self.get_project_detail(project, assign_phase, assign_detail)

    def get_project_detail(self, project, assigned_phase, assign_detail={}):
        return {
            'project': {
                'id': project.id,
                'title': project.title,
                'description': project.description,
                'note': project.note,
                'phase': {
                    'id': assigned_phase.id,
                    'name': project.phase.name,
                    'assigned_by': assigned_phase.assigned_by.username,
                    'status': assigned_phase.status,
                    'assigned_date': assigned_phase.assigned_date,
                    'note': assigned_phase.assignmentdetail_set.last().note,
                    'phase_end_date': assigned_phase.assignmentdetail_set.last().end_date,
                    'assignees': [{'username': usr.username, 'id': usr.id} for usr in assigned_phase.assigned_to.all()]
                }
            }
        }

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
            




        

# utils.py
import boto3
from botocore.exceptions import ClientError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from coordinates import settings
from core.models import (
    FileAttachment, Phase, PhaseAssignment, PhaseStatus, AssignmentDetail
)


def handle_uploaded_file(file, file_path):
    with default_storage.open(file_path, 'wb') as destination:
        for chunk in file.chunks():
            destination.write(chunk)


def initiate_s3_multipart_upload(file_path):
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    response = s3.create_multipart_upload(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=file_path
    )

    return response['UploadId']

def upload_s3_multipart_part(file_path, upload_id, part_number, part_data):
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    response = s3.upload_part(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=file_path,
        PartNumber=part_number,
        UploadId=upload_id,
        Body=part_data
    )

    return response['ETag']

def complete_s3_multipart_upload(file_path, upload_id, upload_parts):
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    response = s3.complete_multipart_upload(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=file_path,
        UploadId=upload_id,
        MultipartUpload={'Parts': upload_parts}
    )

def delete_s3_file(file_path):
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_path)


def get_project_detail(project):
    data = {
        "id": project.id, "title": project.title, "author": project.author.username,
        "description": project.description, "note": project.note,
        "create_time": project.create_time, "completion_date": project.completion_date,
        "target_end_time": project.target_end_time, "current_phase": project.phase.name,
        "phases": [], "attachments": []
    }
    attachments_data = []
    try:
        attachments = FileAttachment.objects.filter(project=project.id)
    except Exception as error:
        print(error)
        return data
    for attachment in attachments:
        attacht_data = {
            "id": attachment.id, "file_name": attachment.file_name,
            "create_time": attachment.create_time, "tag": attachment.tag.name,
            "uploaded_by": attachment.uploaded_by.username, "phase": attachment.phase.name
        }
        attachments_data.append(attacht_data)
    data["attachments"] = sorted(attachments_data, key=lambda x: x["phase"])

    try:
        phase_assignments = PhaseAssignment.objects.filter(project=project.id)
        if not phase_assignments:
            return data
        for phase_assgt in phase_assignments:
            assignment_detail = AssignmentDetail.objects.get(assignment=phase_assgt.id)
            phase_assgt_dict = {
                "id": phase_assgt.id, "phase": phase_assgt.phase.name,
                "assigned_date": phase_assgt.assigned_date,
                "assignees": [usr.username for usr in phase_assgt.assigned_to.all()],
                "assigned_by": phase_assgt.assigned_by.username, "status": phase_assgt.status,
                "assignment_details": {
                    "note": assignment_detail.note, "end_date": assignment_detail.end_date
                },
                "phase_status_detail": {}
            }
            data["phases"].append(phase_assgt_dict)
            try:
                status_details = PhaseStatus.objects.get(project=project, phase=phase_assgt.phase.id)
                phase_assgt_dict["phase_status_detail"]["start_date"] = status_details.start_date
                phase_assgt_dict["phase_status_detail"]["end_date"] = status_details.end_date
                phase_assgt_dict["phase_status_detail"]["is_completed"] = status_details.is_completed
            except Exception as error:
                continue
        if project.phase.name not in ["Backlog", "Completed"]:
            if project.phase.name not in [detail['phase'] for detail in data["phases"]]:
                data["phases"].append(
                    {"id": 78, "phase": project.phase.name, "status": "Open", "assignees": []}
                )
        return data
    except Exception as error:
        print(error)
        return data
            





        
            

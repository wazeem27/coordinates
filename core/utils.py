# utils.py
import boto3
from botocore.exceptions import ClientError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from coordinates import settings


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
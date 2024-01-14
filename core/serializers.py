from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth.models import User
from core.models import (
    Project, Phase, Tag, FileAttachment, PhaseAssignment, AssignmentDetail,
    ProjectTimeline
)


class DateOnlyField(serializers.DateField):
    def to_internal_value(self, value):
        # Parse the input value as a date
        date_value = super().to_internal_value(value)
        return date_value


class ProjectSerializer(serializers.ModelSerializer):
    target_end_time = DateOnlyField(input_formats=['%Y-%m-%d'], required=False)

    class Meta:
        model = Project
        fields = ('title', 'description', 'note', 'target_end_time')
        extra_kwargs = {
            'description': {'required': False},
            'note': {'required': False}
        }

    def validate_target_end_time(self, value):
        if value and value <= timezone.now().date():
            raise serializers.ValidationError("target_end_time must be in the future")
        return value

    def validate(self, data):
        title = data.get('title', '')

        # Ensure title is not empty
        if not title:
            raise serializers.ValidationError("Title cannot be empty.")

        # Additional validation to prevent common attacks
        if '<script>' in title:
            raise serializers.ValidationError("Input contains potentially malicious content.")

        return data

    def create(self, validated_data):
        title = validated_data['title']
        existing_project = Project.objects.filter(title__iexact=title).exists()

        if existing_project:
            raise serializers.ValidationError("A project with the same name already exists.")

        default_phase = Phase.objects.get(name='Backlog')
        validated_data['phase'] = default_phase  # Set phase as 'Backlog' by default

        # Create the project
        project = Project.objects.create(**validated_data)

        # Track event in ProjectTimeline
        title = validated_data.get('title')
        self.add_timeline_entry(self.context['request'].user, project, f"Project '{title}' created.")

        return project

    @staticmethod
    def add_timeline_entry(user, project, change_note):
        timeline = ProjectTimeline(project=project, user=user, change_note=change_note, status="add")
        timeline.save()


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username',)


class PhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Phase
        fields = ('id', 'name', 'description')


class ProjectListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer()
    phase = PhaseSerializer()
    class Meta:
        model = Project
        fields = '__all__'  # Add or remove fields as needed


######################### Project detail serializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name')


class AssignmentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentDetail
        fields = ('note', 'end_date', 'status', 'assigned_to')

class PhaseAssignmentSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True)
    assignment_details = AssignmentDetailSerializer(many=True)

    class Meta:
        model = PhaseAssignment
        fields = ('id', 'phase', 'assigned_date', 'assigned_by', 'status', 'assigned_to', 'assignment_details')


class FileAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.SerializerMethodField()
    phase_name = serializers.SerializerMethodField()

    class Meta:
        model = FileAttachment
        fields = ('id', 'file_name', 'create_time', 'tag', 'uploaded_by', 'phase_name')
    
    def get_uploaded_by(self, obj):
        return obj.uploaded_by.username if obj.uploaded_by else None
    
    def get_phase_name(self, obj):
        return obj.phase.name if obj.phase else None


class ProjectDetailSerializer(serializers.ModelSerializer):
    attachments = serializers.SerializerMethodField()
    phases = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    phase = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ('id', 'title', 'attachments', 'phase', 'phases', 'description', 'note', 'create_time', 'target_end_time', 'completion_date', 'author')

    def get_attachments(self, obj):
        attachments = FileAttachment.objects.filter(project=obj)
        serializer = FileAttachmentSerializer(attachments, many=True)
        return serializer.data

    def get_phases(self, obj):
        phase_assignments = PhaseAssignment.objects.filter(project=obj)
        serializer = PhaseAssignmentSerializer(phase_assignments, many=True)
        return {f'phase{assignment.phase_id}': serializer.data[index] for index, assignment in enumerate(phase_assignments)}
    
    def get_author(self, obj):
        return obj.author.username if obj.author else None
    
    def get_phase(self, obj):
        return obj.phase.name

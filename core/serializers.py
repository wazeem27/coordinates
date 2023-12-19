from rest_framework import serializers
from django.utils import timezone
from core.models import Project, ProjectTimeline, Phase

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
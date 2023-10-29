from django.db import models
from django.contrib.auth.models import User
from multiselectfield import MultiSelectField
# Create your models here.



class Phase(models.Model):
    PHASE_CHOICES = (
        ("Backlog", "Backlog"),
        ("Production", "Production"),
        ("QC", "QC"),
        ("Validating", "Validating"),
        ("Completed", "Completed")
    )
    name = models.CharField(max_length=30, choices=PHASE_CHOICES, unique=True)
    description = models.TextField()


class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    note = models.CharField(max_length=255)
    create_time = models.DateTimeField(auto_now_add=True)
    target_end_time = models.DateTimeField(null=True)
    completion_date = models.DateTimeField(null=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the default phase to 'Production' when creatng a new project
        if not self.phase_id:
            self.phase = Phase.objects.get(name='Backlog')


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)


class FileAttachment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=100)
    create_time = models.DateTimeField(auto_now_add=True)
    tag = models.ForeignKey(
        Tag, on_delete=models.CASCADE, related_name='attachments',
        null=True, blank=True
    )
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE)


class PhaseAssignment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE)
    assigned_date = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_to = MultiSelectField(
        choices=[(user.id, user.username) for user in User.objects.all()],
        max_choices=3,
        max_length=3
        )
    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('In-Progress', 'In-Progress'),
        ('Done', 'Done')
    )
    status = models.CharField(max_length=25, choices=STATUS_CHOICES)


class AssignmentDetail(models.Model):
    assignment = models.ForeignKey(PhaseAssignment, on_delete=models.CASCADE)
    note = models.TextField()
    end_date = models.DateTimeField()


class ProjectTimeline(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date_time = models.DateTimeField(auto_now_add=True)
    change_note = models.TextField()
    CHANGE_STATE = (
        ('add', 'add'),
        ('delete', 'delete'),
        ('update', 'update')
    )
    status = models.CharField(max_length=25, choices=CHANGE_STATE)

from django import forms
from .models import Project, Tag, FileAttachment, User, PhaseAssignment
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Submit
from tempus_dominus.widgets import DatePicker, TimePicker, DateTimePicker


class ProjectForm(forms.ModelForm):
    # Add a field to specify the tag for the project
    class Meta:
        model = Project
        fields = ['title', 'description', 'note', 'target_end_time']


class FileAttachmentForm(forms.Form):
    # Add a field to specify the tag for the attachment
    tag = forms.ModelChoiceField(queryset=Tag.objects.all(), required=False, label='Tag')
    file = forms.FileField()


class PhaseAssignmentForm(forms.ModelForm):
    class Meta:
        model = PhaseAssignment
        fields = ['assigned_users']

    assigned_users = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(),
        widget=forms.CheckboxSelectMultiple
    )
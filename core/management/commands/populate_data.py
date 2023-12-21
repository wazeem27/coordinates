# your_app/management/commands/populate_data.py

from django.core.management.base import BaseCommand
from core.models import Phase, Tag

"""
Module to define a management command for populating initial data for Phase and Tag models.
"""


class Command(BaseCommand):
    """
    Management command to populate initial data for Phase and Tag models.
    """

    help = 'Populate initial data for Phase and Tag models'

    def handle(self, *args, **kwargs):
        """
        Handle function to execute data population for Phase and Tag models.
        """
        self.stdout.write(self.style.NOTICE('Starting data population process...'))

        phases_data = [
            {"name": "Backlog", "description": "Tasks that are yet to be scheduled or prioritized."},
            {"name": "Production", "description": "Tasks under active development."},
            {"name": "QC", "description": "Tasks under quality control."},
            {"name": "Validating", "description": "Tasks being reviewed or validated."},
            {"name": "Completed", "description": "Tasks that are finished."},
        ]

        tag_names = ["Raw", "Smooth", "Doc"]

        try:
            for phase_data in phases_data:
                phase, created = Phase.objects.get_or_create(**phase_data)
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Phase "{phase.name}" created.'))

            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name)
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Tag "{tag.name}" created.'))

            self.stdout.write(self.style.SUCCESS('Data populated successfully'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'An error occurred: {e}'))

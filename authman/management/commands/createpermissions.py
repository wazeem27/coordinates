"""
Management command to create permissions and assign them to groups.
"""

from django.core.management.base import BaseCommand
from authman.permissions import create_permissions, create_groups

class Command(BaseCommand):
    """
    Management command to create permissions and assign them to groups.
    """

    def handle(self, *args, **options):
        """
        Handle function to execute permission and group creation.
        """
        admin_group, employee_group = create_groups()
        self.stdout.write(self.style.SUCCESS('Admin and Employee groups created successfully!'))

        permissions = create_permissions()

        for perm in permissions['admin']:
            admin_group.permissions.add(perm)
            self.stdout.write(self.style.SUCCESS(f'Permission "{perm}" assigned to Admin Group'))

        for perm in permissions['employee']:
            employee_group.permissions.add(perm)
            self.stdout.write(self.style.SUCCESS(f'Permission "{perm}" assigned to Employee Group'))

        self.stdout.write(self.style.SUCCESS('Permissions assigned to groups successfully!'))

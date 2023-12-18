"""
Module to manage permissions and groups in the application.
"""

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Group
from rest_framework import permissions

from core.models import Project, Phase  # Import necessary models

def create_permissions():
    """
    Create permissions for project and phase actions.

    Returns:
        dict: Permissions for admin and employee groups.
    """
    project_content_type = ContentType.objects.get_for_model(Project)
    phase_content_type = ContentType.objects.get_for_model(Phase)

    project_perm_admin, _ = Permission.objects.get_or_create(
        codename='can_create_project',
        name='Can create Project',
        content_type=project_content_type,
    )

    phase_perm_admin, _ = Permission.objects.get_or_create(
        codename='can_assign_user_to_a_project_phase',
        name='Can assign User to a Project Phase',
        content_type=phase_content_type,
    )

    phase_perm_employee, _ = Permission.objects.get_or_create(
        codename='can_assign_user_to_a_project_phase',
        name='Can assign User to a Project Phase',
        content_type=phase_content_type,
    )

    return {
        'admin': (project_perm_admin, phase_perm_admin),
        'employee': (phase_perm_employee,)
    }


def create_groups():
    """
    Create admin and employee groups.

    Returns:
        tuple: Admin and employee groups.
    """
    admin_group, _ = Group.objects.get_or_create(name='Admin Group')
    employee_group, _ = Group.objects.get_or_create(name='Employee Group')

    return admin_group, employee_group


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only admin users to create projects.
    """

    def has_permission(self, request, view):
        """
        Check if the user is an admin.

        Args:
            request: Request object.
            view: View object.

        Returns:
            bool: True if the user is an admin; False otherwise.
        """
        return request.user and request.user.is_staff

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import UpdateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.views import PasswordResetView
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash
from core.models import ProjectTimeline, PhaseAssignment, Project, Phase
from datetime import datetime, timedelta
import logging

from .serializers import (
    UserCreateSerializer, UserUpdateSerializer, UserPasswordUpdateSerializer
)



logger = logging.getLogger(__name__)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)

        if user:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            # Get user groups
            groups = user.groups.values_list('name', flat=True)
            role = ''
            if user.is_superuser:
                role = 'superuser'
            elif groups:
                role = groups[0].split(' ')[0].lower()
            return Response({
                'status': 'success',
                'data': {
                    'token': token.key,
                    'username': username,
                    'role': role
                }
            })
        else:
            return Response({'status': 'error', 'message': 'Invalid credentials'}, status=401)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        request.auth.delete()
        return Response({
            'status': 'success', 'message': 'Logged out successfully'
        })


class CreateUserView(APIView):
    permission_classes = [IsAdminUser]  # Only accessible by superuser

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if (not request.data.get('username') or not request.data.get('first_name') or 
                not request.data.get('last_name') or not request.data.get('email')):
            return Response(
                {
                    'status': 'error',
                    'message': 'Please fill [username, first_name, last_name, email, password]'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        if not serializer.is_valid():
            field_errors = ""
            for field, error_detail in serializer.errors.items():
                if field in ['username', 'email', 'first_name', 'last_name']:
                    field_errors += error_detail[0] + " "
                elif field in ['non_field_errors']:
                    field_errors += error_detail[0] + " "
            return Response({
                'status': 'error', 'message': field_errors
            }, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        is_admin = serializer.validated_data.get('is_admin', False)
        is_employee = serializer.validated_data.get('is_employee', False)
        first_name = serializer.validated_data['first_name']
        last_name = serializer.validated_data['last_name']

        try:
            validate_password(password)  # Validate password strength

            if is_admin and is_employee:
                return Response(
                    {
                        'status': 'error',
                        'message': 'User cannot have both admin & employee role.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif not is_admin and not is_employee:
                # role should be either admin or employee
                return Response(
                    {
                        'status': 'error',
                        'message': 'User should be either admin/employee.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if User.objects.filter(username=username):
                return Response(
                    {'status': 'error', 'message': f'User with username "{username}" already exist.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user = User.objects.create_user(
                username=username, email=email, password=password,
                first_name=first_name, last_name=last_name
            )

            if is_admin:
                admin_group = Group.objects.get(name='Admin Group')
                user.groups.add(admin_group)

            elif is_employee:
                employee_group = Group.objects.get(name='Employee Group')
                user.groups.add(employee_group)

            user.save()
            return Response(
                {
                    'message': f'User "{username}" created successfully',
                    'data': {
                        'username': username,
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'role': 'admin' if is_admin else 'employee'
                    }
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as error:
            return Response({
                'status': 'error', 'message': str(error)
            }, status=status.HTTP_400_BAD_REQUEST)


class CustomPasswordResetView(PasswordResetView):
    def post(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)  # Delegate to Django's PasswordResetView


class UserListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = User.objects.all()
        content = []
        for user in queryset:
            user_data = {}
            user_data['id'] = user.id
            user_data['username'] = user.username
            user_data['email'] = user.email
            user_data['first_name'] = user.first_name
            user_data['last_name'] = user.first_name
            groups = user.groups.values_list('name', flat=True)
            #if request.user.is_superuser:
            if groups:
                user_data['role'] = groups[0].split(' ')[0].lower()
            elif user.is_superuser:
                user_data['role'] = 'superuser'
            else:
                user_data['role'] = ''
            if user_data['username'] == request.user.username and request.user.is_superuser:
                user_data['role'] = 'superuser'
            user_data['flag'] = 'active' if user.is_active else 'deactivated'
            content.append(user_data)
        return Response({'status': 'success', 'data': content})


class UserDeactivateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]  # Only accessible by superuser

    def delete(self, request, user_id):
        try:
            requesting_user = request.user

            if not requesting_user.is_superuser:
                return Response(
                    {
                        'status': 'error',
                        'message': 'Only superadmins can deactivate users.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            user = User.objects.get(pk=user_id)
            if user.is_superuser:
                return Response(
                    {
                        'status': 'error',
                        'message': 'Cannot deactivate a superuser.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.is_active = False  # Deactivate user by setting is_active to False
            user.save()

            # Log the deactivation action
            logger.info(f'User "{requesting_user.username}" deactivated user "{user.username}"')

            return Response(
                {
                    'status': 'success',
                    'message': f'User "{user.username}" deactivated successfully'
                },
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {
                    'status': 'error',
                    'message': 'User not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )


class UserUpdateView(UpdateAPIView):
    queryset = User.objects.all()
    user_info_serializer_class = UserUpdateSerializer
    password_serializer_class = UserPasswordUpdateSerializer
    authentication_classes = [TokenAuthentication]

    def get_serializer_class(self):
        if 'password' in self.request.data:
            return self.password_serializer_class
        return self.user_info_serializer_class

    def update(self, request, *args, **kwargs):
        try:
            user_instance = self.get_object()

            if request.user.is_superuser or request.user == user_instance:
                message = ""
                serializer_class = self.get_serializer_class()
                serializer = serializer_class(user_instance, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                if 'password' in self.request.data:
                    message = f"Successfully updated password for user '{user_instance.username}'."
                else:
                    message = f"Successfully updated profile for user '{user_instance.username}'."
                return Response(
                    {
                        'status': 'success',
                        'message': message
                    }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {
                        'status': 'error',
                        'message': 'Unauthorized access'},
                        status=status.HTTP_401_UNAUTHORIZED
                )
            # str(error.detail['username'][0])
        except Exception as error:
            error_message = "\n".join([str(err[0]) for err in  error.detail.values()])
            logger.exception("An error occurred while updating user details")
            return Response(
                {
                    'status': 'error',
                    'message': error_message
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangePasswordView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()

        # Ensure old_password, new_password, and retype_password are provided
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password1")
        retype_password = request.data.get("new_password2")

        if not (old_password and new_password and retype_password):
            return Response(
                {"status": "error", "message": "All password fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the old password is correct
        if not self.object.check_password(old_password):
            return Response(
                {"status": "error", "message": "Incorrect old password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the new password and retype_password match
        if new_password != retype_password:
            return Response(
                {"status": "error", "message": "New password and retype password do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the new password is different from the old one
        if old_password == new_password:
            return Response(
                {
                    "status": "error",
                    "message": "New password should be different from the old password."
                }, status=status.HTTP_400_BAD_REQUEST
            )

        # Use Django's PasswordChangeForm for additional security checks
        form = PasswordChangeForm(user=self.object, data=request.data)

        if form.is_valid():
            # The form handles password updating and validation
            form.save()

            # Ensure the user stays logged in after password change
            update_session_auth_hash(request, self.object)

            return Response(
                {"status": "success", "message": "Password updated successfully."},
                status=status.HTTP_200_OK
            )
        else:
            # Handle form errors
            return Response(
                {"status": "error", "message": form.errors.get('new_password2', ['Use Strong password.'])[0]},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserReactivateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]  # Only accessible by superuser

    def put(self, request, user_id):
        try:
            requesting_user = request.user

            if not requesting_user.is_superuser:
                return Response(
                    {
                        'status': 'error',
                        'message': 'Only superadmins can reactivate users.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            user = User.objects.get(pk=user_id)
            if user.is_active:
                return Response(
                    {
                        'status': 'error',
                        'message': 'User is already active.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.is_active = True  # Reactivate user by setting is_active to True
            user.save()

            # Log the reactivation action
            logger.info(f'User "{requesting_user.username}" reactivated user "{user.username}"')

            return Response(
                {
                    'status': 'success',
                    'message': f'User "{user.username}" reactivated successfully'
                },
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {
                    'status': 'error',
                    'message': 'User not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )


class UserProfileView(APIView):
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        groups = request.user.groups.values_list('name', flat=True)
        
        role = ''
        if request.user.is_superuser:
            role = 'superuser'
        elif groups:
            role = groups[0].split(' ')[0].lower()
        data = {
            'id': request.user.id,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'role': role
            }
        return Response({'status': 'success', 'data': data}, status=status.HTTP_200_OK)

class UserDashboardView(APIView):
    authentication_classes = [TokenAuthentication]

    def get_last_week_data(self, phase_name):
        last_week_start = datetime.now() - timedelta(days=7)
        last_week_end = datetime.now()

        projects_last_week = (
            Project.objects.filter(
                phase__name=phase_name,
                create_time__gte=last_week_start,
                create_time__lt=last_week_end
            ).count()
        )
        return projects_last_week

    def get_project_data(self, phase_name):
        projects = Project.objects.filter(phase__name=phase_name)
        data = []
        for project in projects:
            proj_detail = {
                'id': project.id,
                'title': project.title,
                'description': project.description,
                'create_time': project.create_time,
                'target_end_time': str(project.target_end_time)+ " (Target End Date)" if phase_name != "Completed" else project.completion_date.date(),
                'author': project.author.username,
                'current_phase': project.phase.name
            }
            data.append(proj_detail)
        return data

    def get(self, request):
        phases = ['Backlog', 'Production', 'QC', 'Delivery', 'Completed']
        if request.user.is_superuser:
            data = {
                'backlog': {
                    'count': Phase.objects.get(name='Backlog').project_set.all().count(),
                    'data': self.get_project_data('Backlog')
                },
                'production': {
                    'count': Phase.objects.get(name='Production').project_set.all().count(),
                    'data': self.get_project_data('Production')
                },
                'qc': {
                    'count': Phase.objects.get(name='QC').project_set.all().count(),
                    'data': self.get_project_data('QC')
                },
                'delivery': {
                    'count': Phase.objects.get(name='Delivery').project_set.all().count(),
                    'data': self.get_project_data('Delivery')
                },
                'completed': {
                    'count': Phase.objects.get(name='Completed').project_set.all().count(),
                    'data': self.get_project_data('Completed')
                }
            }
        else:
            data = {
                'backlog': {
                    'count': Phase.objects.get(name='Backlog').project_set.all().count(),
                    'data': self.get_project_data('Backlog')
                },
                'production': {
                    'count': Phase.objects.get(name='Production').project_set.all().count(),
                    'data': self.get_project_data('Production')
                },
                'qc': {
                    'count': Phase.objects.get(name='QC').project_set.all().count(),
                    'data': self.get_project_data('QC')
                },
                'delivery': {
                    'count': Phase.objects.get(name='Delivery').project_set.all().count(),
                    'data': self.get_project_data('Delivery')
                },
                'completed': {
                    'count': Phase.objects.get(name='Completed').project_set.all().count(),
                    'data': self.get_project_data('Completed')
                }
            }
        # for phase_name in phases:
        #     current_count = Phase.objects.get(name=phase_name).project_set.all().count()
        #     last_week_count = self.get_last_week_data(phase_name)

        #     # Calculate percentage change
        #     if last_week_count == 0:
        #         percentage_change = 100 if current_count > 0 else 0
        #     else:
        #         percentage_change = ((current_count - last_week_count) / last_week_count) * 100
        #     data["rate_of_change_"+phase_name.lower()] = round(percentage_change, 2)
        return Response({'status': 'success', 'data': data}, status=status.HTTP_200_OK)


class UserDetailView(APIView):
    authentication_classes = [TokenAuthentication]

    def get(self, request, pk):
        try:
            user_obj = User.objects.get(id=pk)
        except Exception as error:
            logger.error(f"User with ID {pk} not found")
            return Response(
                {
                    'status': 'error',
                    'message': f'User with ID {pk} not found.'
                }, status=status.HTTP_404_NOT_FOUND
            )
        if user_obj.groups.filter(name='Admin Group').exists():
            role = 'admin'
        elif user_obj.groups.filter(name='Employee Group').exists():
            role = 'employee'
        elif user_obj.is_superuser:
            role = 'superuser'
        else:
            role = 'unknown'

        usr_involved_proj = []
        if role == 'superuser':
            projects_timelines = ProjectTimeline.objects.all().order_by('-date_time')
            for timeline in projects_timelines:
                if len(usr_involved_proj) == 5:
                    break
                elif timeline.project not in usr_involved_proj:
                    usr_involved_proj.append(timeline.project)


        else:
            projects_timelines = ProjectTimeline.objects.all().order_by('-date_time')
            for timeline in projects_timelines:
                if len(usr_involved_proj) == 5:
                    break
                elif timeline.project not in usr_involved_proj:
                    usr_involved_proj.append(timeline.project)
        data = {
            'id': user_obj.id,
            'username': user_obj.username,
            'first_name': user_obj.first_name,
            'last_name': user_obj.last_name,
            'email': user_obj.email,
            'role': role,
            'recentprojects': [
                {'id': proj.id, 'title': proj.title, 'current_phase': proj.phase.name, 'description': proj.description} for proj in usr_involved_proj
            ]
        }
        return Response({'status': 'success', 'data': data}, status=status.HTTP_200_OK)

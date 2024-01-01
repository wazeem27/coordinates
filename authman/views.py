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

import logging

from .serializers import UserCreateSerializer, UserUpdateSerializer, UserPasswordUpdateSerializer



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
        return Response({'status': 'success', 'message': 'Logged out successfully'})


class CreateUserView(APIView):
    permission_classes = [IsAdminUser]  # Only accessible by superuser

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        is_admin = serializer.validated_data.get('is_admin', False)
        is_employee = serializer.validated_data.get('is_employee', False)

        try:
            validate_password(password)  # Validate password strength
            user = User.objects.create_user(username=username, email=email, password=password)
            if is_admin and is_employee:
                return Response(
                    {
                        'status': 'error',
                        'message': 'User cannot have both admin & employee role.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
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
                        'role': 'admin' if is_admin else 'employee'
                    }
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
            if request.user.is_superuser:
                groups = user.groups.values_list('name', flat=True)
                if user_data['username'] == request.user.username:
                    user_data['role'] = 'superuser'
                elif groups:
                    user_data['role'] = groups[0].split(' ')[0].lower()
                else:
                    user_data['role'] = ''
                user_data['flag'] = 'active' if user.is_active else 'deactivate'
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
        
        except Exception as e:
            logger.exception("An error occurred while updating user details")
            return Response(
                {
                    'status': 'error',
                    'message': 'An error occurred while processing your request'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
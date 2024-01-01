from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.views import PasswordResetView

from .serializers import UserCreateSerializer


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
                'status': 'success', 'token': token.key,
                'username': username, 'role': role
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=401)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        request.auth.delete()
        return Response({'success': 'Logged out successfully'})


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
            if is_admin:
                admin_group = Group.objects.get(name='Admin Group')
                user.groups.add(admin_group)

            elif is_employee:
                employee_group = Group.objects.get(name='Employee Group')
                user.groups.add(employee_group)

            user.save()
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomPasswordResetView(PasswordResetView):
    def post(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)  # Delegate to Django's PasswordResetView

from django.contrib.auth.models import User
from rest_framework import serializers


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True, required=True, max_length=150)
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    is_admin = serializers.BooleanField(required=False, default=False)
    is_employee = serializers.BooleanField(required=False, default=False)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError("Passwords do not match.")
        return data


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']  # Fields for user info update


class UserPasswordUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    retype_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['password', 'retype_password']  # Fields for password update

    def validate(self, data):
        password = data.get('password')
        retype_password = data.get('retype_password')

        if password and not retype_password:
            raise serializers.ValidationError("Please re-enter the password.")
        
        if password != retype_password:
            errors = {'non_field_errors': [
                'Passwords do not match.',
                'Please re-enter the password.'
            ]}
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance, validated_data):
        password = validated_data.get('password')

        if password:
            instance.set_password(password)
            instance.save()
        
        return instance

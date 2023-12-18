from rest_framework import serializers


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True, required=True, max_length=150)
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    is_admin = serializers.BooleanField(required=False, default=False)
    is_employee = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError("Passwords do not match.")
        return data
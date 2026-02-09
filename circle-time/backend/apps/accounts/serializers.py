from rest_framework import serializers

from .models import User


class LoginSerializer(serializers.Serializer):
    """Validate login request body."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class RefreshSerializer(serializers.Serializer):
    """Validate token refresh request body."""

    refresh = serializers.CharField(required=True)


class UserSerializer(serializers.ModelSerializer):
    """
    Serialize a user for API responses.

    Matches the contract shape:
        { id, name, email, role, department }
    """

    id = serializers.CharField()  # UUID rendered as string

    class Meta:
        model = User
        fields = ["id", "name", "email", "role", "department"]
        read_only_fields = fields

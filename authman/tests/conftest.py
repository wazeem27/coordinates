"""Conftest contains fixtures"""

import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def created_user():
    # Create a test user
    user = User.objects.create_user(username='testuser', password='testpassword')
    yield user
    # Perform cleanup after the test is done
    user.delete()

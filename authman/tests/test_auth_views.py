"""test_auth_views.py"""

import pytest
from rest_framework.test import APIClient
from rest_framework.status import HTTP_401_UNAUTHORIZED


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_valid_login(api_client, created_user):
    # Attempt login with correct credentials
    response = api_client.post('/login/', {'username': 'testuser', 'password': 'testpassword'})

    # Check response status and content
    assert response.status_code == 200
    assert 'token' in response.data


@pytest.mark.django_db
def test_invalid_login(api_client, created_user):
    # Attempt login with incorrect credentials
    response = api_client.post('/login/', {'username': 'testuser', 'password': 'wrongpassword'})

    # Check response status and content
    assert response.status_code == HTTP_401_UNAUTHORIZED
    assert 'error' in response.data


@pytest.mark.django_db
def test_user_not_authenticated(api_client):
    # Attempt login without providing any credentials
    response = api_client.post('/login/')

    # Check response status and content
    assert response.status_code == HTTP_401_UNAUTHORIZED
    assert 'error' in response.data


# Security Scenarios

@pytest.mark.django_db
def test_xss_protection(api_client):
    # Attempt login with username containing XSS payload
    response = api_client.post('/login/', {'username': '<script>alert("XSS Attack")</script>', 'password': 'password'})

    # Check response content
    assert '<script>' not in response.content.decode()


@pytest.mark.django_db
def test_sql_injection(api_client):
    # Attempt SQL injection in username field
    response = api_client.post('/login/', {'username': "' OR 1=1 --", 'password': 'password'})

    # Check response status
    assert response.status_code == HTTP_401_UNAUTHORIZED

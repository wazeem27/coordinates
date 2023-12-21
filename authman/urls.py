# urls.py

from django.urls import path
from .views import CreateUserView


urlpatterns = [
    path('create-user/', CreateUserView.as_view(), name='create-user'),
    # Django's built-in password reset URLs
    # path('api/password-reset/', include('django.contrib.auth.urls')),
]

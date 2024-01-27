# urls.py

from django.urls import path
from .views import (
    CreateUserView, UserListView, UserDeactivateView,
    UserUpdateView, UserReactivateView, ChangePasswordView,
    UserProfileView, UserDashboardView, UserDetailView
)


urlpatterns = [
    path('create-user/', CreateUserView.as_view(), name='create-user'),
    path('users/', UserListView.as_view(), name='list-user'),
    path('users/<int:user_id>/deactivate/', UserDeactivateView.as_view(), name='user-deactivate'),
    path('users/<int:user_id>/activate/', UserReactivateView.as_view(), name='user-activate'),
    path('users/<int:pk>/update/', UserUpdateView.as_view(), name='user-update'),
    path('update/password/', ChangePasswordView.as_view(), name='password-update'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('dashboard/', UserDashboardView.as_view(), name='dashboard'),
    # admin view only
    path('profile/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    # Django's built-in password reset URLs
    # path('api/password-reset/', include('django.contrib.auth.urls')),
]

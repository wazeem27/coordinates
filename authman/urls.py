# urls.py

from django.urls import path
from .views import CreateUserView, UserListView, UserDeactivateView, UserUpdateView, UserReactivateView


urlpatterns = [
    path('create-user/', CreateUserView.as_view(), name='create-user'),
    path('users/', UserListView.as_view(), name='list-user'),
    path('users/<int:user_id>/deactivate/', UserDeactivateView.as_view(), name='user-deactivate'),
    path('users/<int:user_id>/activate/', UserReactivateView.as_view(), name='user-activate'),
    path('users/<int:pk>/update/', UserUpdateView.as_view(), name='user-update'),
    # Django's built-in password reset URLs
    # path('api/password-reset/', include('django.contrib.auth.urls')),
]

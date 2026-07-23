from django.contrib import admin
from django.urls import include, path
from store.views import DashboardView, SettingsView
from config.auth_views import LoginView, LogoutView, MeView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/settings/", SettingsView.as_view(), name="settings"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/", include("store.urls")),
]

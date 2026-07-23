from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    """Only the super admin may manage employee accounts and view the activity log."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)

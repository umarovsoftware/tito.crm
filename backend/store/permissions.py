from rest_framework.permissions import BasePermission
from .roles import role_can

ACTION_CAPABILITY = {
    "list": "view",
    "retrieve": "view",
    "create": "add",
    "update": "change",
    "partial_update": "change",
    "destroy": "delete",
}


class IsSuperUser(BasePermission):
    """Only the super admin may manage employee accounts and view the activity log."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class ModulePermission(BasePermission):
    """Checks the acting user's role against the ROLE_PERMISSIONS matrix for the view's
    declared `module`. Superusers bypass this entirely. Any DRF action not explicitly
    mapped (e.g. custom @action endpoints like `payment`) is treated as `change`, since
    those always mutate state."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        module = getattr(view, "module", None)
        if not module:
            return False
        profile = getattr(request.user, "profile", None)
        role = profile.role if profile else None
        action = getattr(view, "action", None)
        if action:
            capability = ACTION_CAPABILITY.get(action, "change")
        else:
            # Plain APIViews (Settings, Dashboard) have no DRF `action` — derive from method.
            capability = "view" if request.method in ("GET", "HEAD", "OPTIONS") else "change"
        return role_can(role, module, capability)

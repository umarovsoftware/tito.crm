from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView


def _user_role(user):
    if user.is_superuser:
        return None
    profile = getattr(user, "profile", None)
    return profile.role if profile else None


class LoginSerializer(TokenObtainPairSerializer):
    username_field = "username"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        token["role"] = _user_role(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id, "username": self.user.username, "first_name": self.user.first_name,
            "last_name": self.user.last_name, "email": self.user.email, "is_staff": self.user.is_staff,
            "is_superuser": self.user.is_superuser, "role": _user_role(self.user),
        }
        return data


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)


class MyProfileSerializer(serializers.Serializer):
    """Self-service profile edit — deliberately excludes username, role, is_staff and
    is_superuser so a user can never elevate or rename their own account through this endpoint."""
    ism = serializers.CharField(source="first_name", required=False, allow_blank=True, max_length=150)
    familiya = serializers.CharField(source="last_name", required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    parol = serializers.CharField(source="password", required=False, min_length=8, write_only=True)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id, "username": user.username, "first_name": user.first_name, "last_name": user.last_name,
            "email": user.email, "is_staff": user.is_staff, "is_superuser": user.is_superuser,
            "role": _user_role(user),
        })

    def patch(self, request):
        serializer = MyProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "id": user.id, "username": user.username, "first_name": user.first_name, "last_name": user.last_name,
            "email": user.email, "is_staff": user.is_staff, "is_superuser": user.is_superuser,
            "role": _user_role(user),
        })


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except Exception:
                pass
        return Response(status=status.HTTP_205_RESET_CONTENT)

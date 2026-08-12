from django.db import migrations


def backfill_manager_profiles(apps, schema_editor):
    """Existing non-superuser accounts had unrestricted access before roles existed —
    default them to 'manager' (full access) so nobody is silently locked out on deploy."""
    User = apps.get_model("auth", "User")
    Profile = apps.get_model("store", "Profile")
    for user in User.objects.filter(is_superuser=False, profile__isnull=True):
        Profile.objects.create(user=user, role="manager")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0005_profile"),
    ]

    operations = [
        migrations.RunPython(backfill_manager_profiles, noop),
    ]

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion
import uuid


def create_legacy_sale_items(apps, schema_editor):
    Sale = apps.get_model("store", "Sale")
    SaleItem = apps.get_model("store", "SaleItem")
    SaleItem.objects.bulk_create([
        SaleItem(sale_id=sale.id, product_id=sale.product_id, quantity=sale.quantity, unit_price=sale.unit_price)
        for sale in Sale.objects.all().iterator()
    ])


class Migration(migrations.Migration):
    dependencies = [("store", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="SaleItem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("quantity", models.PositiveIntegerField(validators=[MinValueValidator(1)])),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sale_items", to="store.product")),
                ("sale", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="store.sale")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.AddConstraint(
            model_name="saleitem",
            constraint=models.UniqueConstraint(fields=("sale", "product"), name="unique_product_per_sale"),
        ),
        migrations.RunPython(create_legacy_sale_items, migrations.RunPython.noop),
    ]

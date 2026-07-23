from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import migrations, models


def backfill_purchase_price(apps, schema_editor):
    """Historical sale items have no recorded cost basis; approximate it with the product's
    current purchase price so old reports don't suddenly show 100% profit. New sales going
    forward will always freeze the true price at the time of sale."""
    SaleItem = apps.get_model("store", "SaleItem")
    for item in SaleItem.objects.select_related("product").iterator():
        item.purchase_price = item.product.purchase_price
        item.save(update_fields=["purchase_price"])


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0003_activitylog"),
    ]

    operations = [
        migrations.AddField(
            model_name="saleitem",
            name="purchase_price",
            field=models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=14, validators=[MinValueValidator(Decimal("0"))]),
        ),
        migrations.RunPython(backfill_purchase_price, migrations.RunPython.noop),
    ]

import uuid
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Product(TimeStampedModel):
    class Category(models.TextChoices):
        MEN = "men", "Erkaklar"
        WOMEN = "women", "Ayollar"
        UNISEX = "unisex", "Unisex"

    brand_name = models.CharField(max_length=120)
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=10, choices=Category.choices)
    volume_ml = models.PositiveIntegerField()
    barcode = models.CharField(max_length=64, unique=True)
    purchase_price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    sale_price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    quantity = models.IntegerField(default=0)
    minimum_quantity = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.brand_name} {self.name}"


class Customer(TimeStampedModel):
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=32, blank=True)
    address = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.full_name


class StockReceipt(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="stock_receipts")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    purchase_price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    supplier = models.CharField(max_length=160)
    received_on = models.DateField(default=timezone.localdate)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-received_on", "-created_at"]


class Sale(TimeStampedModel):
    class SaleType(models.TextChoices):
        REGULAR = "regular", "Doimiy mijoz"
        GUEST = "guest", "Tasodifiy xaridor"
    class PaymentType(models.TextChoices):
        CASH = "cash", "Naqd"
        CARD = "card", "Karta"
        TRANSFER = "transfer", "O'tkazma"
        DEBT = "debt", "Qarz"

    code = models.CharField(max_length=40, unique=True)
    sale_type = models.CharField(max_length=10, choices=SaleType.choices, default=SaleType.REGULAR)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sales")
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, null=True, blank=True, related_name="sales")
    guest_code = models.CharField(max_length=40, blank=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    payment_type = models.CharField(max_length=10, choices=PaymentType.choices)
    wholesale = models.BooleanField(default=False)
    delivery = models.BooleanField(default=False)
    delivery_address = models.CharField(max_length=255, blank=True)
    sold_on = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ["-sold_on", "-created_at"]

    @property
    def total(self):
        items = list(self.items.all()) if hasattr(self, "items") else []
        return sum((item.total for item in items), start=Decimal("0")) if items else self.quantity * self.unit_price


class SaleItem(TimeStampedModel):
    """A product line within a single customer purchase."""
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])

    class Meta:
        ordering = ["created_at"]
        constraints = [models.UniqueConstraint(fields=["sale", "product"], name="unique_product_per_sale")]

    @property
    def total(self):
        return self.quantity * self.unit_price


class CustomerDebt(TimeStampedModel):
    customer = models.OneToOneField(Customer, on_delete=models.PROTECT, related_name="debt")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    due_date = models.DateField()

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount

    @property
    def status(self):
        if self.remaining_amount <= 0:
            return "closed"
        if self.due_date < timezone.localdate():
            return "overdue"
        if self.paid_amount > 0:
            return "partial"
        return "open"


class CustomerDebtEntry(TimeStampedModel):
    class EntryType(models.TextChoices):
        CHARGE = "charge", "Qarz qo'shildi"
        PAYMENT = "payment", "To'lov"
    debt = models.ForeignKey(CustomerDebt, on_delete=models.CASCADE, related_name="entries")
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    date = models.DateField(default=timezone.localdate)
    note = models.TextField(blank=True)
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, null=True, blank=True, related_name="debt_entry")

    class Meta:
        ordering = ["-date", "-created_at"]


class Payable(TimeStampedModel):
    supplier = models.CharField(max_length=160)
    phone = models.CharField(max_length=32, blank=True)
    category = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    due_date = models.DateField()
    note = models.TextField(blank=True)

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount

    @property
    def status(self):
        if self.remaining_amount <= 0: return "closed"
        if self.due_date < timezone.localdate(): return "overdue"
        if self.paid_amount > 0: return "partial"
        return "open"


class PayableEntry(TimeStampedModel):
    class EntryType(models.TextChoices):
        CHARGE = "charge", "Qarz qo'shildi"
        PAYMENT = "payment", "To'lov"
    payable = models.ForeignKey(Payable, on_delete=models.CASCADE, related_name="entries")
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(default=timezone.localdate)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-date", "-created_at"]


class Income(TimeStampedModel):
    category = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    date = models.DateField(default=timezone.localdate)
    note = models.TextField(blank=True)
    source = models.CharField(max_length=60, blank=True, editable=False)

    class Meta:
        ordering = ["-date", "-created_at"]


class Expense(TimeStampedModel):
    category = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    date = models.DateField(default=timezone.localdate)
    note = models.TextField(blank=True)
    source = models.CharField(max_length=60, blank=True, editable=False)

    class Meta:
        ordering = ["-date", "-created_at"]


class ShopSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    shop_name = models.CharField(max_length=150, default="Aroma House")
    phone = models.CharField(max_length=32, blank=True)
    address = models.CharField(max_length=255, blank=True)
    currency = models.CharField(max_length=16, default="so'm")
    dark_mode = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        self.pk = 1
        return super().save(*args, **kwargs)

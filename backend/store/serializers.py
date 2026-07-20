from datetime import timedelta
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import Customer, CustomerDebt, CustomerDebtEntry, Expense, Income, Payable, PayableEntry, Product, Sale, ShopSettings, StockReceipt


class FrontendChoiceField(serializers.ChoiceField):
    """Stores compact database values while exposing the frontend label."""
    def __init__(self, *, choices, **kwargs):
        self.label_to_value = dict(choices)
        self.value_to_label = {value: label for label, value in choices}
        super().__init__(choices=list(self.label_to_value), **kwargs)

    def to_internal_value(self, data):
        if data in self.label_to_value:
            return self.label_to_value[data]
        self.fail("invalid_choice", input=data)

    def to_representation(self, value):
        return self.value_to_label.get(value, value)


CATEGORY_CHOICES = [("Erkaklar", "men"), ("Ayollar", "women"), ("Unisex", "unisex")]
SALE_TYPE_CHOICES = [("Doimiy mijoz", "regular"), ("Tasodifiy xaridor", "guest")]
PAYMENT_CHOICES = [("Naqd", "cash"), ("Karta", "card"), ("O‘tkazma", "transfer"), ("Qarz", "debt")]
STATUS_CHOICES = [("Qarzdor", "open"), ("Qisman to‘langan", "partial"), ("Qarz yopilgan", "closed"), ("Muddati o‘tgan", "overdue")]
ENTRY_TYPE_CHOICES = [("Qarz qo‘shildi", "charge"), ("To‘lov", "payment")]


class ProductSerializer(serializers.ModelSerializer):
    firmaNomi = serializers.CharField(source="brand_name")
    tovarNomi = serializers.CharField(source="name")
    kategoriya = FrontendChoiceField(source="category", choices=CATEGORY_CHOICES)
    hajmiMl = serializers.IntegerField(source="volume_ml", min_value=1)
    kelishNarxi = serializers.DecimalField(source="purchase_price", max_digits=14, decimal_places=2, min_value=Decimal("0"))
    sotuvNarxi = serializers.DecimalField(source="sale_price", max_digits=14, decimal_places=2, min_value=Decimal("0"))
    qoldiq = serializers.IntegerField(source="quantity", min_value=0)
    minimalQoldiq = serializers.IntegerField(source="minimum_quantity", min_value=0)
    rasm = serializers.URLField(source="image_url", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Product
        fields = ("id", "firmaNomi", "tovarNomi", "kategoriya", "hajmiMl", "barcode", "kelishNarxi", "sotuvNarxi", "qoldiq", "minimalQoldiq", "rasm", "createdAt")
        read_only_fields = ("id", "createdAt")


class CustomerSerializer(serializers.ModelSerializer):
    ism = serializers.CharField(source="full_name")
    telefon = serializers.CharField(source="phone", required=False, allow_blank=True)
    manzil = serializers.CharField(source="address", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Customer
        fields = ("id", "ism", "telefon", "manzil", "createdAt")
        read_only_fields = ("id", "createdAt")


class StockReceiptSerializer(serializers.ModelSerializer):
    perfumeId = serializers.PrimaryKeyRelatedField(source="product", queryset=Product.objects.all())
    miqdor = serializers.IntegerField(source="quantity", min_value=1)
    kelishNarxi = serializers.DecimalField(source="purchase_price", max_digits=14, decimal_places=2, min_value=Decimal("0"))
    yetkazibBeruvchi = serializers.CharField(source="supplier")
    sana = serializers.DateField(source="received_on")
    izoh = serializers.CharField(source="note", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = StockReceipt
        fields = ("id", "perfumeId", "miqdor", "kelishNarxi", "yetkazibBeruvchi", "sana", "izoh", "createdAt")
        read_only_fields = ("id", "createdAt")

    @transaction.atomic
    def create(self, validated_data):
        product = Product.objects.select_for_update().get(pk=validated_data["product"].pk)
        receipt = StockReceipt.objects.create(**validated_data)
        product.quantity += receipt.quantity
        product.purchase_price = receipt.purchase_price
        product.save(update_fields=["quantity", "purchase_price", "updated_at"])
        Expense.objects.create(category="Tovar xaridi", amount=receipt.quantity * receipt.purchase_price, date=receipt.received_on, note=f"{receipt.supplier}dan tovar xaridi", source=f"stock:{receipt.id}")
        return receipt

    @transaction.atomic
    def update(self, instance, validated_data):
        old_product = Product.objects.select_for_update().get(pk=instance.product_id)
        if old_product.quantity < instance.quantity:
            raise serializers.ValidationError("Qoldiq ishlatilgani uchun bu kirimni tahrirlab bo'lmaydi.")
        old_product.quantity -= instance.quantity
        old_product.save(update_fields=["quantity", "updated_at"])
        receipt = super().update(instance, validated_data)
        product = Product.objects.select_for_update().get(pk=receipt.product_id)
        product.quantity += receipt.quantity
        product.purchase_price = receipt.purchase_price
        product.save(update_fields=["quantity", "purchase_price", "updated_at"])
        Expense.objects.filter(source=f"stock:{receipt.id}").delete()
        Expense.objects.create(category="Tovar xaridi", amount=receipt.quantity * receipt.purchase_price, date=receipt.received_on, note=f"{receipt.supplier}dan tovar xaridi", source=f"stock:{receipt.id}")
        return receipt


class SaleSerializer(serializers.ModelSerializer):
    sotuvKodi = serializers.CharField(source="code", read_only=True)
    saleTuri = FrontendChoiceField(source="sale_type", choices=SALE_TYPE_CHOICES)
    perfumeId = serializers.PrimaryKeyRelatedField(source="product", queryset=Product.objects.all())
    customerId = serializers.PrimaryKeyRelatedField(source="customer", queryset=Customer.objects.all(), required=False, allow_null=True)
    xaridorKodi = serializers.CharField(source="guest_code", read_only=True)
    miqdor = serializers.IntegerField(source="quantity", min_value=1)
    sotuvNarxi = serializers.DecimalField(source="unit_price", max_digits=14, decimal_places=2, min_value=Decimal("0"))
    tolovTuri = FrontendChoiceField(source="payment_type", choices=PAYMENT_CHOICES)
    ulgurjiSavdo = serializers.BooleanField(source="wholesale", required=False)
    yetkazibBerish = serializers.BooleanField(source="delivery", required=False)
    yetkazibBerishManzili = serializers.CharField(source="delivery_address", required=False, allow_blank=True)
    sana = serializers.DateField(source="sold_on")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Sale
        fields = ("id", "sotuvKodi", "saleTuri", "perfumeId", "customerId", "xaridorKodi", "miqdor", "sotuvNarxi", "tolovTuri", "ulgurjiSavdo", "yetkazibBerish", "yetkazibBerishManzili", "sana", "createdAt")
        read_only_fields = ("id", "sotuvKodi", "xaridorKodi", "createdAt")

    def validate(self, attrs):
        if attrs.get("sale_type") == Sale.SaleType.REGULAR and not attrs.get("customer"):
            raise serializers.ValidationError({"customerId": "Doimiy mijoz uchun mijoz tanlanishi kerak."})
        if attrs.get("sale_type") == Sale.SaleType.GUEST and attrs.get("payment_type") == Sale.PaymentType.DEBT:
            raise serializers.ValidationError({"tolovTuri": "Tasodifiy xaridorga qarzga sotuv mumkin emas."})
        if attrs.get("delivery") and not attrs.get("delivery_address", "").strip():
            raise serializers.ValidationError({"yetkazibBerishManzili": "Yetkazib berish manzilini kiriting."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        product = Product.objects.select_for_update().get(pk=validated_data["product"].pk)
        if validated_data["quantity"] > product.quantity:
            raise serializers.ValidationError({"miqdor": f"Qoldiq yetarli emas. Mavjud: {product.quantity} dona."})
        sold_on = validated_data["sold_on"]
        token = timezone.now().strftime("%H%M%S%f")[-8:]
        validated_data["code"] = f"STV-{sold_on:%Y%m%d}-{token}"
        if validated_data["sale_type"] == Sale.SaleType.GUEST:
            validated_data.update(customer=None, guest_code=f"TX-{sold_on:%Y%m%d}-{token}", wholesale=False, delivery=False, delivery_address="")
        sale = Sale.objects.create(**validated_data)
        product.quantity -= sale.quantity
        product.save(update_fields=["quantity", "updated_at"])
        if sale.payment_type == Sale.PaymentType.DEBT:
            debt, _ = CustomerDebt.objects.select_for_update().get_or_create(customer=sale.customer, defaults={"total_amount": 0, "paid_amount": 0, "due_date": sold_on + timedelta(days=30)})
            debt.total_amount += sale.total
            debt.due_date = sold_on + timedelta(days=30)
            debt.save(update_fields=["total_amount", "due_date", "updated_at"])
            CustomerDebtEntry.objects.create(debt=debt, entry_type="charge", amount=sale.total, date=sold_on, note=str(product), sale=sale)
        else:
            buyer = sale.customer.full_name if sale.customer else sale.guest_code
            Income.objects.create(category="Sotuv", amount=sale.total, date=sold_on, note=f"{sale.code} · {buyer} · {product}", source=f"sale:{sale.id}")
        return sale

    @transaction.atomic
    def update(self, instance, validated_data):
        old_product = Product.objects.select_for_update().get(pk=instance.product_id)
        old_product.quantity += instance.quantity
        old_product.save(update_fields=["quantity", "updated_at"])
        Income.objects.filter(source=f"sale:{instance.id}").delete()
        try:
            old_entry = instance.debt_entry
        except CustomerDebtEntry.DoesNotExist:
            old_entry = None
        if old_entry:
            old_debt = CustomerDebt.objects.select_for_update().get(pk=old_entry.debt_id)
            old_debt.total_amount -= old_entry.amount
            old_debt.save(update_fields=["total_amount", "updated_at"])
            old_entry.delete()
        sale = super().update(instance, validated_data)
        product = Product.objects.select_for_update().get(pk=sale.product_id)
        if sale.quantity > product.quantity:
            raise serializers.ValidationError({"miqdor": f"Qoldiq yetarli emas. Mavjud: {product.quantity} dona."})
        if sale.sale_type == Sale.SaleType.GUEST:
            sale.customer = None
            sale.wholesale = False
            sale.delivery = False
            sale.delivery_address = ""
            if not sale.guest_code:
                sale.guest_code = f"TX-{sale.sold_on:%Y%m%d}-{timezone.now():%H%M%S}"
            sale.save()
        product.quantity -= sale.quantity
        product.save(update_fields=["quantity", "updated_at"])
        if sale.payment_type == Sale.PaymentType.DEBT:
            debt, _ = CustomerDebt.objects.select_for_update().get_or_create(customer=sale.customer, defaults={"total_amount": 0, "paid_amount": 0, "due_date": sale.sold_on + timedelta(days=30)})
            debt.total_amount += sale.total
            debt.due_date = sale.sold_on + timedelta(days=30)
            debt.save(update_fields=["total_amount", "due_date", "updated_at"])
            CustomerDebtEntry.objects.create(debt=debt, entry_type="charge", amount=sale.total, date=sale.sold_on, note=str(product), sale=sale)
        else:
            buyer = sale.customer.full_name if sale.customer else sale.guest_code
            Income.objects.create(category="Sotuv", amount=sale.total, date=sale.sold_on, note=f"{sale.code} · {buyer} · {product}", source=f"sale:{sale.id}")
        return sale


class CustomerDebtEntrySerializer(serializers.ModelSerializer):
    sana = serializers.DateField(source="date")
    summa = serializers.DecimalField(source="amount", max_digits=14, decimal_places=2)
    izoh = serializers.CharField(source="note")
    turi = FrontendChoiceField(source="entry_type", choices=ENTRY_TYPE_CHOICES)

    class Meta:
        model = CustomerDebtEntry
        fields = ("id", "sana", "summa", "izoh", "turi")


class CustomerDebtSerializer(serializers.ModelSerializer):
    mijozId = serializers.UUIDField(source="customer_id", read_only=True)
    mijozNomi = serializers.CharField(source="customer.full_name", read_only=True)
    telefon = serializers.CharField(source="customer.phone", read_only=True)
    jamiQarz = serializers.DecimalField(source="total_amount", max_digits=14, decimal_places=2, read_only=True)
    tolangan = serializers.DecimalField(source="paid_amount", max_digits=14, decimal_places=2, read_only=True)
    qolganQarz = serializers.DecimalField(source="remaining_amount", max_digits=14, decimal_places=2, read_only=True)
    muddat = serializers.DateField(source="due_date")
    holat = FrontendChoiceField(source="status", choices=STATUS_CHOICES, read_only=True)
    tarix = CustomerDebtEntrySerializer(source="entries", many=True, read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = CustomerDebt
        fields = ("id", "mijozId", "mijozNomi", "telefon", "jamiQarz", "tolangan", "qolganQarz", "muddat", "holat", "tarix", "createdAt")
        read_only_fields = ("id", "mijozId", "mijozNomi", "telefon", "jamiQarz", "tolangan", "qolganQarz", "holat", "tarix", "createdAt")


class PayableEntrySerializer(serializers.ModelSerializer):
    sana = serializers.DateField(source="date")
    summa = serializers.DecimalField(source="amount", max_digits=14, decimal_places=2)
    izoh = serializers.CharField(source="note")
    turi = FrontendChoiceField(source="entry_type", choices=ENTRY_TYPE_CHOICES)

    class Meta:
        model = PayableEntry
        fields = ("id", "sana", "summa", "izoh", "turi")


class PayableSerializer(serializers.ModelSerializer):
    yetkazibBeruvchi = serializers.CharField(source="supplier")
    telefon = serializers.CharField(source="phone", required=False, allow_blank=True)
    kategoriya = serializers.CharField(source="category")
    jamiQarz = serializers.DecimalField(source="total_amount", max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    tolangan = serializers.DecimalField(source="paid_amount", max_digits=14, decimal_places=2, read_only=True)
    qolganQarz = serializers.DecimalField(source="remaining_amount", max_digits=14, decimal_places=2, read_only=True)
    muddat = serializers.DateField(source="due_date")
    holat = FrontendChoiceField(source="status", choices=STATUS_CHOICES, read_only=True)
    izoh = serializers.CharField(source="note", required=False, allow_blank=True)
    sana = serializers.DateField(write_only=True, required=False)
    tarix = PayableEntrySerializer(source="entries", many=True, read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Payable
        fields = ("id", "yetkazibBeruvchi", "telefon", "kategoriya", "jamiQarz", "tolangan", "qolganQarz", "muddat", "holat", "izoh", "sana", "tarix", "createdAt")
        read_only_fields = ("id", "tolangan", "qolganQarz", "holat", "tarix", "createdAt")

    @transaction.atomic
    def create(self, validated_data):
        opening_date = validated_data.pop("sana", timezone.localdate())
        payable = Payable.objects.create(**validated_data)
        PayableEntry.objects.create(payable=payable, entry_type="charge", amount=payable.total_amount, date=opening_date, note=payable.note)
        return payable

    @transaction.atomic
    def update(self, instance, validated_data):
        opening_date = validated_data.pop("sana", None)
        if "total_amount" in validated_data and validated_data["total_amount"] < instance.paid_amount:
            raise serializers.ValidationError({"jamiQarz": "Jami qarz to'langan summadan kam bo'la olmaydi."})
        instance = super().update(instance, validated_data)
        opening = instance.entries.filter(entry_type="charge").first()
        if opening:
            opening.amount = instance.total_amount
            opening.note = instance.note
            if opening_date: opening.date = opening_date
            opening.save()
        return instance


class PaymentSerializer(serializers.Serializer):
    summa = serializers.DecimalField(source="amount", max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    sana = serializers.DateField(source="date")
    izoh = serializers.CharField(source="note", required=False, allow_blank=True)


class IncomeSerializer(serializers.ModelSerializer):
    kategoriya = serializers.CharField(source="category")
    summa = serializers.DecimalField(source="amount", max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    sana = serializers.DateField(source="date")
    izoh = serializers.CharField(source="note", required=False, allow_blank=True)
    sourceId = serializers.CharField(source="source", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    class Meta:
        model = Income
        fields = ("id", "kategoriya", "summa", "sana", "izoh", "sourceId", "createdAt")
        read_only_fields = ("id", "sourceId", "createdAt")


class ExpenseSerializer(serializers.ModelSerializer):
    kategoriya = serializers.CharField(source="category")
    summa = serializers.DecimalField(source="amount", max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    sana = serializers.DateField(source="date")
    izoh = serializers.CharField(source="note", required=False, allow_blank=True)
    sourceId = serializers.CharField(source="source", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    class Meta:
        model = Expense
        fields = ("id", "kategoriya", "summa", "sana", "izoh", "sourceId", "createdAt")
        read_only_fields = ("id", "sourceId", "createdAt")


class ShopSettingsSerializer(serializers.ModelSerializer):
    dokonNomi = serializers.CharField(source="shop_name")
    telefon = serializers.CharField(source="phone", required=False, allow_blank=True)
    manzil = serializers.CharField(source="address", required=False, allow_blank=True)
    valyuta = serializers.CharField(source="currency")
    darkMode = serializers.BooleanField(source="dark_mode")
    class Meta:
        model = ShopSettings
        fields = ("dokonNomi", "telefon", "manzil", "valyuta", "darkMode")

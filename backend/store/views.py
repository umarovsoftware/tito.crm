from datetime import date
from django.db import transaction
from django.db.models import F, Sum
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Customer, CustomerDebt, CustomerDebtEntry, Expense, Income, Payable, PayableEntry, Product, Sale, SaleItem, ShopSettings, StockReceipt
from .serializers import (
    CustomerDebtSerializer, CustomerSerializer, ExpenseSerializer, IncomeSerializer,
    PayableSerializer, PaymentSerializer, ProductSerializer, SaleSerializer,
    ShopSettingsSerializer, StockReceiptSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    search_fields = ("brand_name", "name", "barcode")
    ordering_fields = ("brand_name", "name", "quantity", "created_at")

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError("Bu mahsulotda operatsiyalar bor, uni o'chirib bo'lmaydi.")


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ("full_name", "phone")

    @action(detail=True, methods=["get"])
    def debt(self, request, pk=None):
        customer = self.get_object()
        try:
            debt = customer.debt
        except CustomerDebt.DoesNotExist:
            return Response({"detail": "Mijozning qarzi yo'q."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CustomerDebtSerializer(debt).data)


class DebtViewSet(viewsets.ModelViewSet):
    queryset = CustomerDebt.objects.select_related("customer").prefetch_related("entries")
    serializer_class = CustomerDebtSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    @action(detail=True, methods=["post"], url_path="payment")
    @transaction.atomic
    def debt_payment(self, request, pk=None):
        debt = CustomerDebt.objects.select_for_update().select_related("customer").get(pk=pk)
        customer = debt.customer
        payload = PaymentSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        amount = payload.validated_data["amount"]
        if amount > debt.remaining_amount:
            raise ValidationError({"amount": f"To'lov qolgan qarzdan katta bo'lishi mumkin emas: {debt.remaining_amount}"})
        debt.paid_amount += amount
        debt.save(update_fields=["paid_amount", "updated_at"])
        entry = CustomerDebtEntry.objects.create(
            debt=debt, entry_type=CustomerDebtEntry.EntryType.PAYMENT, amount=amount,
            date=payload.validated_data["date"], note=payload.validated_data.get("note", ""),
        )
        Income.objects.create(
            category="Qarz to'lovi", amount=amount, date=entry.date,
            note=f"{customer.full_name}: {entry.note or 'qarz to’lovi'}", source=f"debt-payment:{entry.id}",
        )
        return Response(CustomerDebtSerializer(debt).data)


class StockReceiptViewSet(viewsets.ModelViewSet):
    queryset = StockReceipt.objects.select_related("product")
    serializer_class = StockReceiptSerializer
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    @transaction.atomic
    def perform_destroy(self, instance):
        product = Product.objects.select_for_update().get(pk=instance.product_id)
        if product.quantity < instance.quantity:
            raise ValidationError("Qoldiq ishlatilgani uchun bu kirimni o'chirib bo'lmaydi.")
        product.quantity -= instance.quantity
        product.save(update_fields=["quantity", "updated_at"])
        Expense.objects.filter(source=f"stock:{instance.id}").delete()
        instance.delete()


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related("customer").prefetch_related("items__product")
    serializer_class = SaleSerializer
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    search_fields = ("code", "guest_code", "customer__full_name", "items__product__name")

    @transaction.atomic
    def perform_destroy(self, instance):
        for item in instance.items.select_related("product").all():
            product = Product.objects.select_for_update().get(pk=item.product_id)
            product.quantity += item.quantity
            product.save(update_fields=["quantity", "updated_at"])
        Income.objects.filter(source=f"sale:{instance.id}").delete()
        try:
            entry = instance.debt_entry
        except CustomerDebtEntry.DoesNotExist:
            entry = None
        if entry:
            debt = CustomerDebt.objects.select_for_update().get(pk=entry.debt_id)
            debt.total_amount -= entry.amount
            debt.save(update_fields=["total_amount", "updated_at"])
        instance.delete()


class PayableViewSet(viewsets.ModelViewSet):
    queryset = Payable.objects.all()
    serializer_class = PayableSerializer
    search_fields = ("supplier", "phone")

    def perform_destroy(self, instance):
        payment_ids = list(instance.entries.filter(entry_type="payment").values_list("id", flat=True))
        Expense.objects.filter(source__in=[f"payable-payment:{entry_id}" for entry_id in payment_ids]).delete()
        instance.delete()

    @action(detail=True, methods=["post"], url_path="payment")
    @transaction.atomic
    def payment(self, request, pk=None):
        payable = Payable.objects.select_for_update().get(pk=pk)
        payload = PaymentSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        amount = payload.validated_data["amount"]
        if amount > payable.remaining_amount:
            raise ValidationError({"amount": f"To'lov qolgan qarzdan katta bo'lishi mumkin emas: {payable.remaining_amount}"})
        payable.paid_amount += amount
        payable.save(update_fields=["paid_amount", "updated_at"])
        entry = PayableEntry.objects.create(
            payable=payable, entry_type=PayableEntry.EntryType.PAYMENT, amount=amount,
            date=payload.validated_data["date"], note=payload.validated_data.get("note", ""),
        )
        Expense.objects.create(
            category=payable.category, amount=amount, date=entry.date,
            note=f"{payable.supplier}: {entry.note or 'qarz to’lovi'}", source=f"payable-payment:{entry.id}",
        )
        return Response(PayableSerializer(payable).data)


class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    search_fields = ("category", "note")

    def perform_update(self, serializer):
        if serializer.instance.source:
            raise ValidationError("Avtomatik kirimni tahrirlab bo'lmaydi.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.source:
            raise ValidationError("Avtomatik kirim manba operatsiyasi bilan bog'langan.")
        instance.delete()


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    search_fields = ("category", "note")

    def perform_update(self, serializer):
        if serializer.instance.source:
            raise ValidationError("Avtomatik chiqimni tahrirlab bo'lmaydi.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.source:
            raise ValidationError("Bu chiqim manba operatsiyasi bilan bog'langan.")
        instance.delete()


class SettingsView(APIView):
    def get_object(self):
        return ShopSettings.objects.get_or_create(pk=1)[0]

    def get(self, request):
        return Response(ShopSettingsSerializer(self.get_object()).data)

    def put(self, request):
        serializer = ShopSettingsSerializer(self.get_object(), data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DemoResetView(APIView):
    """Development-only demo reset used by the existing settings screen."""
    @transaction.atomic
    def post(self, request):
        CustomerDebtEntry.objects.all().delete()
        PayableEntry.objects.all().delete()
        Sale.objects.all().delete()
        StockReceipt.objects.all().delete()
        Income.objects.all().delete()
        Expense.objects.all().delete()
        CustomerDebt.objects.all().delete()
        Payable.objects.all().delete()
        Customer.objects.all().delete()
        Product.objects.all().delete()
        samples = [
            ("Dior", "Sauvage Elixir", "men", 60, "100000000001", 1450000, 1890000, 12, 4),
            ("Chanel", "Coco Mademoiselle", "women", 100, "100000000002", 1650000, 2160000, 8, 4),
            ("Lattafa", "Khamrah", "unisex", 100, "100000000003", 320000, 490000, 28, 8),
        ]
        Product.objects.bulk_create([
            Product(brand_name=brand, name=name, category=category, volume_ml=volume, barcode=barcode,
                    purchase_price=purchase, sale_price=sale, quantity=quantity, minimum_quantity=minimum)
            for brand, name, category, volume, barcode, purchase, sale, quantity, minimum in samples
        ])
        Customer.objects.bulk_create([
            Customer(full_name="Akmal Rahimov", phone="+998 90 123 45 67", address="Yunusobod"),
            Customer(full_name="Dilnoza Karimova", phone="+998 93 221 10 20", address="Chilonzor"),
        ])
        ShopSettings.objects.update_or_create(pk=1, defaults={"shop_name": "Aroma House", "phone": "+998 90 555 55 55", "address": "Toshkent shahri", "currency": "so'm", "dark_mode": False})
        return Response({"detail": "Demo ma'lumotlar tiklandi."})

    def patch(self, request):
        serializer = ShopSettingsSerializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DashboardView(APIView):
    def get(self, request):
        today = timezone.localdate()
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        sale_qs = Sale.objects.all()
        income_qs = Income.objects.all()
        expense_qs = Expense.objects.all()
        if start:
            sale_qs = sale_qs.filter(sold_on__gte=start)
            income_qs = income_qs.filter(date__gte=start)
            expense_qs = expense_qs.filter(date__gte=start)
        if end:
            sale_qs = sale_qs.filter(sold_on__lte=end)
            income_qs = income_qs.filter(date__lte=end)
            expense_qs = expense_qs.filter(date__lte=end)
        sales_total = sum((sale.total for sale in sale_qs), start=0)
        income_total = income_qs.aggregate(total=Sum("amount"))["total"] or 0
        expense_total = expense_qs.aggregate(total=Sum("amount"))["total"] or 0
        return Response({
            "period": {"start": start, "end": end},
            "sales_total": sales_total,
            "income_total": income_total,
            "expense_total": expense_total,
            "profit": income_total - expense_total,
            "sales_count": sale_qs.count(),
            "low_stock_count": Product.objects.filter(quantity__lte=F("minimum_quantity")).count(),
            "customer_debt_total": sum((item.remaining_amount for item in CustomerDebt.objects.all()), start=0),
            "payable_total": sum((item.remaining_amount for item in Payable.objects.all()), start=0),
            "as_of": today,
        })

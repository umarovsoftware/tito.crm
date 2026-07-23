from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Sum
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ActivityLog, Customer, CustomerDebt, CustomerDebtEntry, Expense, Income, Payable, PayableEntry, Product, Sale, SaleItem, ShopSettings, StockReceipt
from .permissions import IsSuperUser
from .serializers import (
    ActivityLogSerializer, CustomerDebtSerializer, CustomerSerializer, EmployeeSerializer, ExpenseSerializer,
    IncomeSerializer, PayableSerializer, PaymentSerializer, ProductSerializer, SaleSerializer,
    ShopSettingsSerializer, StockReceiptSerializer,
)

User = get_user_model()

MODEL_LABELS = {
    "Product": "Parfyum",
    "Customer": "Mijoz",
    "StockReceipt": "Tovar kirimi",
    "Sale": "Sotuv",
    "CustomerDebt": "Mijoz qarzi",
    "Payable": "Qarzim",
    "Income": "Kirim",
    "Expense": "Chiqim",
    "ShopSettings": "Sozlamalar",
    "User": "Hodim",
}


def log_activity(request, action_type, instance, detail=""):
    user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
    model_label = MODEL_LABELS.get(instance.__class__.__name__, instance.__class__.__name__)
    ActivityLog.objects.create(user=user, action=action_type, model_name=model_label, object_repr=str(instance)[:255], detail=detail)


class AuditedModelViewSet(viewsets.ModelViewSet):
    """Logs every create/update/delete to ActivityLog so an admin can audit employee actions."""
    protected_error_message = "Bu yozuvda bog'liq operatsiyalar bor, uni o'chirib bo'lmaydi."

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request, ActivityLog.Action.CREATE, instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, ActivityLog.Action.UPDATE, instance)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(self.protected_error_message)
        log_activity(self.request, ActivityLog.Action.DELETE, instance)


class ProductViewSet(AuditedModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    search_fields = ("brand_name", "name", "barcode")
    ordering_fields = ("brand_name", "name", "quantity", "created_at")
    protected_error_message = "Bu mahsulotda operatsiyalar bor, uni o'chirib bo'lmaydi."


class CustomerViewSet(AuditedModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ("full_name", "phone")
    protected_error_message = "Savdo yoki qarz tarixi mavjud mijozni o'chirib bo'lmaydi."

    @action(detail=True, methods=["get"])
    def debt(self, request, pk=None):
        customer = self.get_object()
        try:
            debt = customer.debt
        except CustomerDebt.DoesNotExist:
            return Response({"detail": "Mijozning qarzi yo'q."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CustomerDebtSerializer(debt).data)


class DebtViewSet(AuditedModelViewSet):
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
        log_activity(request, ActivityLog.Action.UPDATE, debt, detail=f"To'lov qabul qilindi: {amount}")
        return Response(CustomerDebtSerializer(debt).data)


class StockReceiptViewSet(AuditedModelViewSet):
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
        log_activity(self.request, ActivityLog.Action.DELETE, instance)


class SaleViewSet(AuditedModelViewSet):
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
        log_activity(self.request, ActivityLog.Action.DELETE, instance)


class PayableViewSet(AuditedModelViewSet):
    queryset = Payable.objects.all()
    serializer_class = PayableSerializer
    search_fields = ("supplier", "phone")

    def perform_destroy(self, instance):
        payment_ids = list(instance.entries.filter(entry_type="payment").values_list("id", flat=True))
        Expense.objects.filter(source__in=[f"payable-payment:{entry_id}" for entry_id in payment_ids]).delete()
        instance.delete()
        log_activity(self.request, ActivityLog.Action.DELETE, instance)

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
        log_activity(request, ActivityLog.Action.UPDATE, payable, detail=f"To'lov qilindi: {amount}")
        return Response(PayableSerializer(payable).data)


class IncomeViewSet(AuditedModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    search_fields = ("category", "note")

    def perform_update(self, serializer):
        if serializer.instance.source:
            raise ValidationError("Avtomatik kirimni tahrirlab bo'lmaydi.")
        instance = serializer.save()
        log_activity(self.request, ActivityLog.Action.UPDATE, instance)

    def perform_destroy(self, instance):
        if instance.source:
            raise ValidationError("Avtomatik kirim manba operatsiyasi bilan bog'langan.")
        instance.delete()
        log_activity(self.request, ActivityLog.Action.DELETE, instance)


class ExpenseViewSet(AuditedModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    search_fields = ("category", "note")

    def perform_update(self, serializer):
        if serializer.instance.source:
            raise ValidationError("Avtomatik chiqimni tahrirlab bo'lmaydi.")
        instance = serializer.save()
        log_activity(self.request, ActivityLog.Action.UPDATE, instance)

    def perform_destroy(self, instance):
        if instance.source:
            raise ValidationError("Bu chiqim manba operatsiyasi bilan bog'langan.")
        instance.delete()
        log_activity(self.request, ActivityLog.Action.DELETE, instance)


class EmployeeViewSet(AuditedModelViewSet):
    """Super admin manages employee (hodim) accounts here — logins/passwords are never self-serve."""
    queryset = User.objects.filter(is_superuser=False).order_by("-date_joined")
    serializer_class = EmployeeSerializer
    permission_classes = [IsSuperUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    protected_error_message = "Bu hodimni o'chirib bo'lmaydi."

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError("O'zingizni o'chira olmaysiz.")
        super().perform_destroy(instance)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only feed the super admin uses to audit what every employee changed."""
    queryset = ActivityLog.objects.select_related("user").all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsSuperUser]
    search_fields = ("model_name", "object_repr", "detail", "user__username", "user__first_name", "user__last_name")


class SettingsView(APIView):
    def get_object(self):
        return ShopSettings.objects.get_or_create(pk=1)[0]

    def get(self, request):
        return Response(ShopSettingsSerializer(self.get_object()).data)

    def put(self, request):
        serializer = ShopSettingsSerializer(self.get_object(), data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_activity(request, ActivityLog.Action.UPDATE, instance)
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

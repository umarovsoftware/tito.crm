from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ActivityLogViewSet, CustomerViewSet, DebtViewSet, EmployeeViewSet, ExpenseViewSet, IncomeViewSet,
    PayableViewSet, ProductViewSet, SaleViewSet, StockReceiptViewSet,
)

router = DefaultRouter()
router.register("perfumes", ProductViewSet, basename="perfume")
router.register("customers", CustomerViewSet, basename="customer")
router.register("stock-ins", StockReceiptViewSet, basename="stock-in")
router.register("sales", SaleViewSet, basename="sale")
router.register("debts", DebtViewSet, basename="debt")
router.register("payables", PayableViewSet, basename="payable")
router.register("incomes", IncomeViewSet, basename="income")
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("employees", EmployeeViewSet, basename="employee")
router.register("activity-logs", ActivityLogViewSet, basename="activity-log")

urlpatterns = [path("", include(router.urls))]

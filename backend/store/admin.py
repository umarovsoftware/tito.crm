from django.contrib import admin
from .models import ActivityLog, Customer, CustomerDebt, Expense, Income, Payable, Product, Sale, SaleItem, ShopSettings, StockReceipt

admin.site.register([Product, Customer, StockReceipt, Sale, SaleItem, CustomerDebt, Payable, Income, Expense, ShopSettings])


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "model_name", "object_repr")
    list_filter = ("action", "model_name")
    readonly_fields = ("user", "action", "model_name", "object_repr", "detail", "created_at", "updated_at")

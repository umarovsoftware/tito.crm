from django.contrib import admin
from .models import Customer, CustomerDebt, Expense, Income, Payable, Product, Sale, ShopSettings, StockReceipt

admin.site.register([Product, Customer, StockReceipt, Sale, CustomerDebt, Payable, Income, Expense, ShopSettings])

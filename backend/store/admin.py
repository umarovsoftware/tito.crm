from django.contrib import admin
from .models import Customer, CustomerDebt, Expense, Income, Payable, Product, Sale, SaleItem, ShopSettings, StockReceipt

admin.site.register([Product, Customer, StockReceipt, Sale, SaleItem, CustomerDebt, Payable, Income, Expense, ShopSettings])

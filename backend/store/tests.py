from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import Expense, Income, Product


class StoreApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="tester", password="strong-pass-123")
        self.client.force_authenticate(user=self.user)
        self.product = Product.objects.create(
            brand_name="Dior", name="Sauvage", category="men", volume_ml=100,
            barcode="100000001", purchase_price=Decimal("100.00"), sale_price=Decimal("150.00"),
        )
        self.second_product = Product.objects.create(
            brand_name="Chanel", name="Coco", category="women", volume_ml=100,
            barcode="100000002", purchase_price=Decimal("80.00"), sale_price=Decimal("120.00"), quantity=4,
        )
        customer = self.client.post("/api/customers/", {"ism": "Akmal", "telefon": "+998901234567", "manzil": "Toshkent"}, format="json")
        self.customer_id = customer.data["id"]

    def test_inventory_sales_debt_and_finance_are_kept_in_sync(self):
        receipt = self.client.post("/api/stock-ins/", {
            "perfumeId": str(self.product.id), "miqdor": 5, "kelishNarxi": "100.00",
            "yetkazibBeruvchi": "Premium Trade", "sana": "2026-07-20", "izoh": "test",
        }, format="json")
        self.assertEqual(receipt.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 5)
        self.assertEqual(Expense.objects.count(), 1)

        cash_sale = self.client.post("/api/sales/", {
            "saleTuri": "Doimiy mijoz", "customerId": self.customer_id,
            "items": [
                {"perfumeId": str(self.product.id), "miqdor": 2, "sotuvNarxi": "150.00"},
                {"perfumeId": str(self.second_product.id), "miqdor": 1, "sotuvNarxi": "120.00"},
            ], "tolovTuri": "Naqd", "sana": "2026-07-20",
        }, format="json")
        self.assertEqual(cash_sale.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 3)
        self.second_product.refresh_from_db()
        self.assertEqual(self.second_product.quantity, 3)
        self.assertEqual(Decimal(str(cash_sale.data["jamiSumma"])), Decimal("420"))
        self.assertEqual(Income.objects.filter(category="Sotuv").count(), 1)

        updated_sale = self.client.put(f"/api/sales/{cash_sale.data['id']}/", {
            "saleTuri": "Doimiy mijoz", "customerId": self.customer_id,
            "items": [
                {"perfumeId": str(self.product.id), "miqdor": 1, "sotuvNarxi": "150.00"},
                {"perfumeId": str(self.second_product.id), "miqdor": 2, "sotuvNarxi": "120.00"},
            ], "tolovTuri": "Naqd", "sana": "2026-07-20", "ulgurjiSavdo": False,
            "yetkazibBerish": False, "yetkazibBerishManzili": "",
        }, format="json")
        self.assertEqual(updated_sale.status_code, 200)
        self.product.refresh_from_db()
        self.second_product.refresh_from_db()
        self.assertEqual(self.product.quantity, 4)
        self.assertEqual(self.second_product.quantity, 2)
        self.assertEqual(Decimal(str(updated_sale.data["jamiSumma"])), Decimal("390"))

        debt_sale = self.client.post("/api/sales/", {
            "saleTuri": "Doimiy mijoz", "customerId": self.customer_id,
            "items": [{"perfumeId": str(self.product.id), "miqdor": 1, "sotuvNarxi": "150.00"}],
            "tolovTuri": "Qarz", "sana": "2026-07-20",
        }, format="json")
        self.assertEqual(debt_sale.status_code, 201)
        debt = self.client.get("/api/debts/")
        self.assertEqual(Decimal(str(debt.data[0]["qolganQarz"])), Decimal("150"))

        payment = self.client.post(f"/api/debts/{debt.data[0]['id']}/payment/", {
            "summa": "100.00", "sana": "2026-07-21", "izoh": "test",
        }, format="json")
        self.assertEqual(payment.status_code, 200)
        self.assertEqual(Decimal(str(payment.data["tolangan"])), Decimal("100"))

        deleted = self.client.delete(f"/api/sales/{cash_sale.data['id']}/")
        self.assertEqual(deleted.status_code, 204)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 4)
        self.second_product.refresh_from_db()
        self.assertEqual(self.second_product.quantity, 4)

    def test_jwt_login_and_me(self):
        self.client.force_authenticate(user=None)
        response = self.client.post("/api/auth/login/", {"username": "tester", "password": "strong-pass-123"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

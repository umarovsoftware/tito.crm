"""Central role -> module -> capability permission matrix.

Keep this the single source of truth on the backend; `src/auth/roles.ts`
mirrors it on the frontend for UX (nav filtering, disabling buttons) — the
backend copy here is the actual security boundary.
"""

MODULES = [
    "dashboard",
    "perfumes",
    "stock_ins",
    "sales",
    "customers",
    "debts",
    "payables",
    "incomes",
    "expenses",
    "reports",
    "warehouse",
    "settings",
]

VIEW, ADD, CHANGE, DELETE = "view", "add", "change", "delete"
FULL = {VIEW, ADD, CHANGE, DELETE}
READ_ONLY = {VIEW}
NONE: set[str] = set()

MANAGER = "manager"
ACCOUNTANT = "accountant"
WAREHOUSE = "warehouse"
CASHIER = "cashier"

ROLE_PERMISSIONS: dict[str, dict[str, set[str]]] = {
    MANAGER: {module: set(FULL) for module in MODULES},
    ACCOUNTANT: {
        "dashboard": READ_ONLY, "perfumes": READ_ONLY, "stock_ins": READ_ONLY, "sales": READ_ONLY,
        "customers": READ_ONLY, "debts": set(FULL), "payables": set(FULL),
        "incomes": set(FULL), "expenses": set(FULL), "reports": READ_ONLY,
        "warehouse": READ_ONLY, "settings": READ_ONLY,
    },
    WAREHOUSE: {
        "dashboard": set(NONE), "perfumes": set(FULL), "stock_ins": set(FULL), "sales": READ_ONLY,
        "customers": set(NONE), "debts": set(NONE), "payables": set(NONE),
        "incomes": set(NONE), "expenses": set(NONE), "reports": READ_ONLY,
        "warehouse": set(FULL), "settings": READ_ONLY,
    },
    CASHIER: {
        "dashboard": set(NONE), "perfumes": READ_ONLY, "stock_ins": set(NONE), "sales": {VIEW, ADD, CHANGE},
        "customers": {VIEW, ADD, CHANGE}, "debts": {VIEW, CHANGE}, "payables": set(NONE),
        "incomes": set(NONE), "expenses": set(NONE), "reports": set(NONE),
        "warehouse": set(NONE), "settings": READ_ONLY,
    },
}

ROLE_CHOICES = [
    (MANAGER, "Menejer"),
    (ACCOUNTANT, "Buxgalter"),
    (WAREHOUSE, "Ombor mas'uli"),
    (CASHIER, "Sotuvchi"),
]


def role_can(role: str | None, module: str, capability: str) -> bool:
    if not role:
        return False
    return capability in ROLE_PERMISSIONS.get(role, {}).get(module, set())

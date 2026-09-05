"""Canonical E Store commercial package and entitlement catalog."""

CANONICAL_ENTITLEMENTS = {
    "core_pos",
    "inventory",
    "repairs",
    "multi_branch",
    "smart_sms",
    "bi_analytics",
    "ai_assistant",
    "developer_api",
}

LEGACY_ENTITLEMENT_MAP = {
    "pos": "core_pos",
    "customers_suppliers": "core_pos",
    "grn": "inventory",
    "returns_refunds": "core_pos",
    "expenses": "core_pos",
    "thermal_print": "core_pos",
    "local_backup": "core_pos",
    "user_mgmt": "core_pos",
    "imei_serial": "inventory",
    "warranty": "repairs",
    "whatsapp_bot": "smart_sms",
    "cloud_backup": "multi_branch",
    "advanced_reports": "bi_analytics",
    "ai_analytics": "bi_analytics",
}

PACKAGE_CATALOG = {
    "FREE": {
        "name": "Community Trial", "description": "Basic single-register trial for new businesses",
        "price_lkr": 0.0, "max_users": 2, "max_devices": 1, "max_stores": 1,
        "storage_gb": 2.0, "monthly_transactions_limit": 500, "reports_tier": "BASIC",
        "entitlements": {"core_pos", "inventory"},
    },
    "STARTER": {
        "name": "Starter Retail Plan", "description": "Essential POS and inventory for a single branch",
        "price_lkr": 1990.0, "max_users": 5, "max_devices": 2, "max_stores": 1,
        "storage_gb": 10.0, "monthly_transactions_limit": 5000, "reports_tier": "STANDARD",
        "entitlements": {"core_pos", "inventory", "smart_sms"},
    },
    "BUSINESS": {
        "name": "Business Pro Plan", "description": "Multi-device retail with repairs and WhatsApp workflows",
        "price_lkr": 4990.0, "max_users": 15, "max_devices": 5, "max_stores": 3,
        "storage_gb": 50.0, "monthly_transactions_limit": 25000, "reports_tier": "ADVANCED",
        "entitlements": {"core_pos", "inventory", "repairs", "multi_branch", "smart_sms"},
    },
    "BUSINESS_AI": {
        "name": "E Store Business AI", "description": "Business Pro with analytics, AI and developer integrations",
        "price_lkr": 7990.0, "max_users": 30, "max_devices": 10, "max_stores": 5,
        "storage_gb": 100.0, "monthly_transactions_limit": 50000, "reports_tier": "EXECUTIVE",
        "entitlements": CANONICAL_ENTITLEMENTS,
    },
    "ENTERPRISE": {
        "name": "Enterprise AI Suite", "description": "Highest-capacity E Store deployment tier",
        "price_lkr": 9990.0, "max_users": 100, "max_devices": 50, "max_stores": 25,
        "storage_gb": 500.0, "monthly_transactions_limit": 250000, "reports_tier": "EXECUTIVE",
        "entitlements": CANONICAL_ENTITLEMENTS,
    },
}


def normalize_entitlements(codes):
    """Translate legacy feature codes and return stable, unique entitlement codes."""
    normalized = {LEGACY_ENTITLEMENT_MAP.get(str(code).strip().lower(), str(code).strip().lower()) for code in (codes or [])}
    return sorted(normalized & CANONICAL_ENTITLEMENTS)

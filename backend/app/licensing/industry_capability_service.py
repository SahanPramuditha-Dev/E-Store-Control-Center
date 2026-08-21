"""
industry_capability_service.py
==============================
Service for Industry Templates, Capabilities, and Hierarchy-based Capability Resolution.

Hierarchy Rule:
Effective Capability = Subscription Entitlement AND (Branch Override OR Org Override OR Industry Default)
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import IndustryTemplate, CapabilityDefinition, Tenant, Shop, Package, Feature

# Default Predefined Capabilities Registry
STANDARD_CAPABILITIES = [
    {"key": "imei_tracking", "name": "IMEI Tracking", "description": "Device IMEI & hardware serial lifecycle tracking", "category": "HARDWARE"},
    {"key": "serial_tracking", "name": "Serial Number Tracking", "description": "Individual unit serialization", "category": "HARDWARE"},
    {"key": "repairs_management", "name": "Repairs & Workshop", "description": "Job ticketing, technician notes, repair diagnostics", "category": "OPERATIONS"},
    {"key": "warranty_management", "name": "Warranty Tracking", "description": "Shop & supplier warranty validation and auto-policies", "category": "OPERATIONS"},
    {"key": "warranty_claims", "name": "Warranty Claims & RMAs", "description": "Customer return claims and supplier RMAs", "category": "OPERATIONS"},
    {"key": "trade_ins", "name": "Device Trade-ins & Buyback", "description": "Customer device valuation and exchange credit", "category": "OPERATIONS"},
    {"key": "batch_tracking", "name": "Batch Tracking", "description": "Inventory batch/lot management", "category": "INVENTORY"},
    {"key": "expiry_tracking", "name": "Expiry Date Tracking", "description": "FEFO stock management and perishable tracking", "category": "INVENTORY"},
    {"key": "weighted_products", "name": "Weighted Scale Products", "description": "Decimal weight scale pricing (kg, g, L)", "category": "POS"},
    {"key": "decimal_quantities", "name": "Decimal Quantities", "description": "Allow fractional quantities in sales and inventory", "category": "INVENTORY"},
    {"key": "variants_matrix", "name": "Product Variants Matrix", "description": "Multi-attribute variant combinations", "category": "CATALOG"},
    {"key": "size_color_variants", "name": "Size & Color Matrix", "description": "Fashion specific size/color SKUs", "category": "CATALOG"},
    {"key": "season_management", "name": "Season & Brand Collection", "description": "Fashion seasons and style collections", "category": "CATALOG"},
    {"key": "unit_conversions", "name": "Unit Conversions", "description": "Conversion between bulk and retail units", "category": "INVENTORY"}
]

# Default Industry Templates
DEFAULT_INDUSTRY_TEMPLATES = {
    "MOBILE_RETAIL": {
        "name": "Mobile Retail & Repair Center",
        "description": "Smartphones, tablets, gadgets with IMEI serial tracking, repair workshop, and warranties.",
        "capabilities": {
            "imei_tracking": True,
            "serial_tracking": True,
            "repairs_management": True,
            "warranty_management": True,
            "warranty_claims": True,
            "trade_ins": True,
            "batch_tracking": False,
            "expiry_tracking": False,
            "weighted_products": False,
            "decimal_quantities": False,
            "variants_matrix": True,
            "size_color_variants": False,
            "season_management": False,
            "unit_conversions": False
        }
    },
    "GROCERY": {
        "name": "Supermarket & Grocery Store",
        "description": "Fast billing, barcode scanning, scale integration, batch & expiry management.",
        "capabilities": {
            "imei_tracking": False,
            "serial_tracking": False,
            "repairs_management": False,
            "warranty_management": False,
            "warranty_claims": False,
            "trade_ins": False,
            "batch_tracking": True,
            "expiry_tracking": True,
            "weighted_products": True,
            "decimal_quantities": True,
            "variants_matrix": False,
            "size_color_variants": False,
            "season_management": False,
            "unit_conversions": True
        }
    },
    "FASHION": {
        "name": "Fashion, Apparel & Footwear",
        "description": "Apparel, clothing, shoes with Size x Color variant matrices and seasons.",
        "capabilities": {
            "imei_tracking": False,
            "serial_tracking": False,
            "repairs_management": False,
            "warranty_management": False,
            "warranty_claims": False,
            "trade_ins": False,
            "batch_tracking": False,
            "expiry_tracking": False,
            "weighted_products": False,
            "decimal_quantities": False,
            "variants_matrix": True,
            "size_color_variants": True,
            "season_management": True,
            "unit_conversions": False
        }
    },
    "ELECTRONICS": {
        "name": "Consumer Electronics & Appliances",
        "description": "Laptops, TVs, home appliances with serial tracking, warranties, and repairs.",
        "capabilities": {
            "imei_tracking": False,
            "serial_tracking": True,
            "repairs_management": True,
            "warranty_management": True,
            "warranty_claims": True,
            "trade_ins": True,
            "batch_tracking": False,
            "expiry_tracking": False,
            "weighted_products": False,
            "decimal_quantities": False,
            "variants_matrix": True,
            "size_color_variants": False,
            "season_management": False,
            "unit_conversions": False
        }
    },
    "COSMETICS": {
        "name": "Cosmetics, Beauty & Pharmacy",
        "description": "Skincare, makeup, perfumes with batch codes, expiry dates, and brand lines.",
        "capabilities": {
            "imei_tracking": False,
            "serial_tracking": False,
            "repairs_management": False,
            "warranty_management": False,
            "warranty_claims": False,
            "trade_ins": False,
            "batch_tracking": True,
            "expiry_tracking": True,
            "weighted_products": False,
            "decimal_quantities": False,
            "variants_matrix": True,
            "size_color_variants": False,
            "season_management": False,
            "unit_conversions": False
        }
    },
    "GENERAL_RETAIL": {
        "name": "General Retail & Hardware",
        "description": "Standard retail inventory, quick sales, barcode labeling, customer & supplier ledgers.",
        "capabilities": {
            "imei_tracking": False,
            "serial_tracking": False,
            "repairs_management": False,
            "warranty_management": True,
            "warranty_claims": False,
            "trade_ins": False,
            "batch_tracking": False,
            "expiry_tracking": False,
            "weighted_products": False,
            "decimal_quantities": False,
            "variants_matrix": True,
            "size_color_variants": False,
            "season_management": False,
            "unit_conversions": False
        }
    }
}

def seed_industry_templates_and_capabilities(db: Session):
    """Guarantees capability definitions and industry templates exist."""
    # 1. Capabilities
    for cap_data in STANDARD_CAPABILITIES:
        cap = db.query(CapabilityDefinition).filter(CapabilityDefinition.key == cap_data["key"]).first()
        if not cap:
            cap = CapabilityDefinition(
                key=cap_data["key"],
                name=cap_data["name"],
                description=cap_data["description"],
                category=cap_data["category"],
                is_active=True
            )
            db.add(cap)
    db.flush()

    # 2. Industry Templates
    for code, info in DEFAULT_INDUSTRY_TEMPLATES.items():
        template = db.query(IndustryTemplate).filter(IndustryTemplate.code == code).first()
        if not template:
            template = IndustryTemplate(
                code=code,
                name=info["name"],
                description=info["description"],
                default_capabilities=info["capabilities"],
                is_active=True
            )
            db.add(template)
        else:
            # Update default capabilities schema if missing keys
            merged = {**info["capabilities"], **(template.default_capabilities or {})}
            template.default_capabilities = merged
    db.commit()

def resolve_effective_capabilities(
    db: Session,
    tenant: Tenant,
    shop: Optional[Shop] = None,
    package: Optional[Package] = None
) -> Dict[str, Any]:
    """
    Computes full capability resolution according to the hierarchy:
    Effective = Subscription Entitlement AND (Branch Override OR Org Override OR Industry Default)
    """
    industry_code = tenant.industry_code or "MOBILE_RETAIL"
    template = db.query(IndustryTemplate).filter(IndustryTemplate.code == industry_code).first()
    
    industry_defaults = template.default_capabilities if template else DEFAULT_INDUSTRY_TEMPLATES.get(industry_code, {}).get("capabilities", {})
    org_overrides = tenant.capabilities_override or {}
    
    effective: Dict[str, bool] = {}
    details: Dict[str, Dict[str, Any]] = {}

    for cap_data in STANDARD_CAPABILITIES:
        key = cap_data["key"]
        ind_val = industry_defaults.get(key, False)
        org_val = org_overrides.get(key, None)
        
        # Desired before plan entitlement check
        desired_val = org_val if org_val is not None else ind_val
        
        # Plan entitlement check (Plan has final say)
        # Note: If package has specific feature restriction, enforce here
        plan_entitled = True
        if package:
            # Check package-level flags if applicable
            if key == "repairs_management" and hasattr(package, "repairs_enabled") and not getattr(package, "repairs_enabled", True):
                plan_entitled = False
            elif key == "weighted_products" and hasattr(package, "weighted_enabled") and not getattr(package, "weighted_enabled", True):
                plan_entitled = False

        final_val = desired_val and plan_entitled
        effective[key] = final_val
        details[key] = {
            "name": cap_data["name"],
            "category": cap_data["category"],
            "industry_default": ind_val,
            "organization_override": org_val,
            "plan_entitled": plan_entitled,
            "effective": final_val
        }

    return {
        "industry_code": industry_code,
        "industry_name": template.name if template else industry_code,
        "configuration_version": tenant.configuration_version or 1,
        "effective_capabilities": effective,
        "capability_breakdown": details
    }

from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_admin_token

client = TestClient(app)
token = create_admin_token({"sub": "sahan", "role": "SUPER_ADMIN"})
headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/admin/dashboard/stats",
    "/admin/organizations",
    "/admin/tenants",
    "/admin/shops",
    "/admin/packages",
    "/admin/licenses",
    "/admin/machines",
    "/admin/payments",
    "/admin/feature-flags",
    "/admin/support/tickets",
    "/admin/announcements",
    "/admin/releases",
    "/admin/monitoring/health",
    "/admin/monitoring/jobs",
    "/admin/settings",
    "/admin/analytics/overview",
    "/admin/activity/timeline",
    "/admin/audit-logs"
]

print("--- TESTING ALL ENDPOINTS ---")
failed = 0
for ep in endpoints:
    res = client.get(ep, headers=headers)
    if res.status_code != 200:
        print(f"❌ FAIL [{res.status_code}]: {ep}")
        print(f"   Detail: {res.text}")
        failed += 1
    else:
        print(f"✅ PASS [200]: {ep}")

print(f"\nTotal Failed: {failed}")

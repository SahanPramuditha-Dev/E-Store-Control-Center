# E-Store Control Center (SaaS & Licensing Platform)

The central cloud administration, multi-tenant subscription, and remote POS terminal licensing console for the **E-Store Ecosystem**.

---

## 🌟 Capabilities

- 🏢 **Multi-Tenant & Shop Hierarchy**: Manage enterprise organizations, branch networks, and warehouse outlets.
- 🔑 **Cryptographic License Engine**: Generates Ed25519 digitally signed license tokens with hardware SHA-256 fingerprinting and 72-hour offline fallback.
- 📊 **Real-Time Device Telemetry**: Live heartbeat monitoring, machine locks, and remote terminal suspension.
- 💳 **Tiered Subscription Quotas**: Configurable plan limits for branches, counters, and user seats.
- ☁️ **Cloud Database Ready**: Built with PostgreSQL (Supabase / Neon) and SQLite local development compatibility.

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed_admin.py
uvicorn app.main:app --port 8080 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

- **Control Center Portal**: `http://localhost:5180`
- **Backend Swagger API**: `http://localhost:8080/docs`
- **Default Credentials**: `admin` / `Admin@1234`

# E-Store Control Center

A cloud-oriented administration and licensing platform for the wider **E-Store / iStore ecosystem**. The project provides a central interface for managing organizations, branches, licensed terminals, subscription limits, device status, and administrative operations across distributed retail deployments.

## What It Covers

- **Multi-tenant administration** — organize shops, branches, warehouses, and licensed endpoints.
- **Terminal licensing** — issue and validate digitally signed licenses for authorized installations.
- **Device identity** — associate licenses with installation/device fingerprints where required by the deployment model.
- **Subscription and quota controls** — define plan limits for branches, counters, devices, or user seats.
- **Device status / telemetry workflows** — track registered terminals and operational heartbeat-style status information.
- **Administrative controls** — support suspension, activation, and management operations from a central interface.
- **Database portability** — PostgreSQL-oriented production support with SQLite-compatible local development workflows.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, React Router |
| Styling / UI | Tailwind CSS, Lucide React |
| API client | Axios |
| Backend | FastAPI, Uvicorn |
| Validation / settings | Pydantic, Pydantic Settings |
| ORM / migrations | SQLAlchemy, Alembic |
| Database | PostgreSQL, SQLite for local development |
| Authentication / tokens | python-jose |
| Cryptography | `cryptography` / Ed25519-oriented signing workflows |
| Testing | pytest, pytest-asyncio, httpx |

## Architecture

```text
┌──────────────────────────────┐
│      Admin Web Interface     │
│       React + Vite SPA       │
└──────────────┬───────────────┘
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│        FastAPI Backend       │
│  auth · tenants · licensing  │
│  devices · plans · admin     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     SQLAlchemy Data Layer    │
│   PostgreSQL / local SQLite  │
└──────────────────────────────┘
```

The control center is intended to remain separate from individual point-of-sale installations so that licensing and fleet-style administration can be managed independently from day-to-day store operations.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- PostgreSQL for a production-like environment, or the repository's supported local database configuration

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
python seed_admin.py
uvicorn app.main:app --port 8080 --reload
```

The FastAPI development documentation is available locally at:

```text
http://localhost:8080/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will print the local URL when it starts.

## Configuration & Secrets

Do not hard-code or publish production administrator passwords, private signing keys, database credentials, or JWT secrets.

For local development, configure administrator credentials and application secrets through the repository's environment/configuration mechanism before running seed scripts. Any example credentials should be treated as disposable development-only values and changed before deployment.

Recommended production practices include:

- generating signing keys outside source control;
- storing secrets in environment variables or a managed secret store;
- using HTTPS for all remote API traffic;
- restricting administrative endpoints with strong authentication and authorization;
- rotating credentials and signing material when required;
- logging security-sensitive administrative actions.

## Licensing Model

The repository includes cryptographic dependencies intended for signed-license workflows. A typical flow is:

1. Register an organization / branch / installation.
2. Associate the installation with a licensing plan.
3. Generate a signed license payload.
4. Validate the signature and device/installation constraints in the client system.
5. Periodically refresh status or entitlement information when online.

The exact policy can evolve with the E-Store ecosystem and should be reviewed carefully before production use.

## Development Commands

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Backend tests

```bash
cd backend
pytest
```

### Database migrations

```bash
cd backend
alembic upgrade head
```

## Project Status

**Active development.** This repository is part of a broader retail software ecosystem and its APIs, licensing rules, deployment model, and subscription policies may evolve alongside the core iStore / E-Store applications.

## Related Project

- [iStore ERP / I-Store-Website](https://github.com/SahanPramuditha-Dev/I-Store-Website) — retail POS, inventory, repair, and operations platform.
- [iStore Customer Portal](https://github.com/SahanPramuditha-Dev/I-Store-Customer-Portal) — customer-facing repair, invoice, and warranty experience.

## Author

**Sahan Pramuditha**  
BICT Undergraduate — University of Colombo

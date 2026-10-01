# 🏛️ Zone 1: Ground Truth (Canonical System Truth)

Welcome to the **Ground Truth** zone. This directory houses the verified, immutable, and authoritative state of system truth synthesized from Tier 1 (Production Code, DB DDL) and Tier 2 (Approved BRDs) raw inputs.

---

## 🎯 Purpose & Invariant Rules

1. **Zero Hallucination Anchor**: All engineering deliverables (`04-deliverables/`) and AI queries (`/brain-query`) must cite verified facts directly from this directory.
2. **Deterministic Extraction**: Schemas and APIs in this zone are extracted deterministically by CLI tools (`bin/ingest-ddl.js`, `bin/ingest-apis.js`) to guarantee 100% completeness with zero token truncation.
3. **No Unarbitrated Speculation**: Ambiguous or contradictory stakeholder claims must never enter Ground Truth until formally resolved via an Architectural Decision Record in `05-adrs/`.

---

## 📄 Canonical Artifacts

### 1. `domain-glossary.md` (Ubiquitous Domain Language)
- Defines ubiquitous business terminology, canonical entity definitions, and forbidden synonyms.
- Prevents terminological confusion (e.g. distinguishing `Order` vs `Subscription` vs `Booking`).
- Every entry carries a source citation tag `[SRC:...]`.

### 2. `entity-catalog.md` (Database Schemas & State Machines)
- Complete index of **100% of database tables** discovered in SQL DDL scripts.
- Contains column names, data types, nullability, defaults, primary keys, and foreign keys.
- Maps business entities to Go structs, caching policies (Redis), and lifecycle state machines (e.g. `PENDING -> ACTIVE -> COMPLETED`).
- **Sync Command**:
  ```bash
  npm run ingest:ddl
  # or: node ./bin/ingest-ddl.js
  ```

### 3. `api-inventory.md` (Disambiguated API & Surrounding Systems Catalog)
Strictly partitioned into two distinct architectural layers:
- **Part 1: 🔌 Internal Microservice APIs (Owned / Inbound)**:
  - Microservices implemented inside this repository (`repo/backend/*` or configured source paths).
  - Network ports (HTTP/gRPC) and exposed route endpoints extracted from source controllers.
- **Part 2: 🌐 External Surrounding Systems Catalog (Outbound IFAs & Inbound Webhooks)**:
  - Enterprise core systems outside repository boundaries (e.g. Payment Gateways, Enterprise Identity Providers, CRMs, Object Storage Vaults, Geocoding APIs, and Partner Services).
  - Outbound client call endpoints, required payloads, and incoming webhook callback URLs.
- **Sync Command**:
  ```bash
  npm run ingest:apis
  # or: node ./bin/ingest-apis.js
  ```

---

## ⚡ Lifecycle Commands

- `/brain-ingest`: Reads raw inputs, runs DDL/API ingesters, and crystallizes Ground Truth.
- `/brain-audit`: Audits Ground Truth consistency against raw DDL and deliverables.
- `/brain-query <topic>`: Queries Ground Truth for instant schema, endpoint, or flow details with exact line citations.

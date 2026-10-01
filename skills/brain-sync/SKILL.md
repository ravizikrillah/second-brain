---
name: brain-sync
description: Living Architecture & Documentation Drift Synchronizer. Detects drift between upstream code/DDL repositories and Second Brain, conducts gap analysis, and auto-synchronizes Ground Truth and deliverables.
---

# /brain-sync

Living Architecture & Documentation Drift Synchronizer for Second Brain:

## 🎯 Purpose
Keep Second Brain deliverables and Ground Truth permanently synchronized with live Backend (BE) and Frontend (FE) repositories after `git pull` or after receiving folder snapshots and archives (`.zip`, `.tar.gz`). Detects new endpoints, modified schemas, added columns, deleted routes, and missing sequence diagrams, with one-click automated reconciliation.

---

## ⚡ Command Syntax & Aliases

| Command / Flag | Action |
| :--- | :--- |
| `/brain-sync` | Scans upstream repos, performs drift analysis, and prompts to auto-apply documentation updates. |
| `/brain-sync --diff` | View-only Architecture Drift & Gap Analysis. Reports delta without writing files. |
| `/brain-sync --dry-run` | Identical to `--diff`. Safe inspection of upstream changes. |
| `/brain-sync --apply` | Automatically executes full reconciliation pipeline (DDL, APIs, Sequences, and Audit). |
| `/brain-sync --service=<name>` | Targets sync to a specific microservice (e.g. `/brain-sync --service=order-service`). |
| `/brain-sync --strict` | Exits with error code `1` if any architectural drift is detected (Ideal for CI/CD gates). |
| `/brain-diff` | Friendly alias for `/brain-sync --diff`. |

---

## 📋 Execution Protocol

### 1. 🔍 Detect Architecture Drift (`--diff` / `--dry-run`)
Execute the deterministic synchronizer in dry-run mode:
```bash
node ./bin/sync.js --dry-run
# or alias:
npm run sync:check
```

The engine dynamically inspects connected source repositories (via `second-brain.json`, `second-brain.local.json`, or `00-raw-inputs/`):
1. **Multi-Format Auto-Unpack**: Automatically extracts archives (`.zip`, `.tar.gz`, `.tgz`, `.tar`) dropped into raw input directories and cleans up OS junk (`__MACOSX`).
2. **Upstream Git & Non-Git Snapshots**: Detects active branch and latest commit for Git repos, or scans raw snapshot directories.
3. **DDL Schema Drift (Including Embedded Migrations)**:
   - 🟢 **New Tables**: `CREATE TABLE` / Prisma models present in migrations but missing from `01-ground-truth/entity-catalog.md`.
   - 🟡 **Modified Tables (Column-Level Drift)**: Existing tables with new columns added via `CREATE TABLE` or `ALTER TABLE ... ADD COLUMN`.
   - 🔴 **Stale Tables**: Entities in catalog that no longer exist in upstream SQL.
4. **API Inventory Drift**:
   - 🟢 **New Endpoints**: Routes present in Go, Python, TS, Java, or Protobuf but missing from `01-ground-truth/api-inventory.md`.
   - 🔴 **Stale Endpoints**: Cataloged routes that have been removed or renamed in code.
5. **Deliverables Gap**:
   - 🟡 **Missing Sequence Diagrams**: Domain endpoints lacking 1-to-1 PlantUML diagrams in `04-deliverables/sequence-diagrams/apis/`.
   - 🟡 **Missing Contracts**: Endpoints lacking Markdown IFA contracts in `04-deliverables/api-contracts/`.

---

### 2. 📊 Present the Drift Scorecard & Gap Analysis
Format the findings clearly for the operator:

```markdown
### 🔄 Second Brain Architecture Drift & Gap Analysis

**Upstream Status**:
- `order-service` (Local) on `main`: `a1b2c3d` — feat: add QRIS payment endpoint (clean)
- `payment-service` (Local): `[📦 Folder Snapshot (42 files)]`

#### 📊 Drift Summary Scorecard
| Metric | Count | Status |
| :--- | :--- | :--- |
| **New DDL Tables** | 1 | 🟢 `tbl_qris_transactions` |
| **Modified DDL Tables** | 1 | 🟡 `tbl_orders` (+1 col: `tax_id`) |
| **New API Endpoints** | 2 | 🟢 `POST /v1/payments/qris`, `GET /v1/payments/qris/:id` |
| **Missing Sequence Diagrams** | 2 | 🟡 Needs `.puml` generation |
| **Stale Elements** | 0 | ✅ Zero dead documentation |

#### 🔍 Detected Delta Breakdown
1. `[NEW DDL]` **`tbl_qris_transactions`**
   - Source: `order-service/migrations/20260919_add_qris.sql`
   - Action: Needs addition to `01-ground-truth/entity-catalog.md`.
2. `[MODIFIED DDL]` **`tbl_orders`**
   - Added Columns: `tax_id` (VARCHAR)
   - Source: `order-service/migrations/20260919_alter_orders.sql`
3. `[NEW API]` **`POST /api/v1/payments/qris`**
   - Source: `order-service/internal/controller/http/api/v1/payment.go#L85`
   - Action: Needs addition to `api-inventory.md` & 1-to-1 sequence diagram.
```

---

### 3. 🚀 Automatic Reconciliation Execution (`--apply`)
If the user passes `--apply` or confirms updating documentation:
Run the reconciliation pipeline:
```bash
node ./bin/sync.js --apply
# or targeted:
node ./bin/sync.js --apply --service=order-service
# or CLI:
npm run sync
```

This sequentially:
1. **Syncs DDL**: Updates `01-ground-truth/entity-catalog.md` with 100% table and column schema fidelity (`node ./bin/ingest-ddl.js`).
2. **Syncs APIs**: Updates `01-ground-truth/api-inventory.md` with polyglot handlers and DTO structs (`node ./bin/ingest-apis.js`).
3. **Syncs BRDs**: Updates `01-ground-truth/business-rules.md` if new PRD files exist (`node ./bin/ingest-brd.js`).
4. **Auto-Generates 1-to-1 Sequence Diagrams**: Produces compliant PlantUML diagrams for all new endpoints (`node ./bin/generate-api-sequences.js`).
5. **Audits Provenance Integrity**: Runs `node ./bin/audit.js` to ensure 100% `[SRC:...]` citation coverage and 0 active contradictions.
6. **Logs Audit Changelog**: Appends a timestamped summary to `02-provenance/sync-changelog.md`.

---

### 4. 📝 Post-Sync Deliverable Enrichment
After reconciliation finishes:
- Inform the user which new sequence diagrams and ground truth entries were created.
- Offer to slice Jira stories (`/brain-story <new-endpoint>`) or analyze blast radius (`/brain-impact <new-table>`) for the newly synchronized features.

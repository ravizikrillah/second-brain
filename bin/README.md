# ⚙️ Second Brain Deterministic CLI Tools (`bin/`)

Welcome to the **CLI Tools** directory. This folder contains zero-dependency, deterministic Node.js utilities that automate scaffolding, document organization, schema extraction, API cataloging, and provenance auditing.

---

## 🚀 Design Philosophy

1. **Zero External Dependencies**: All scripts rely solely on native Node.js standard modules (`fs`, `path`). They run instantly without requiring `npm install` or third-party packages.
2. **Deterministic & Token-Free**: Complex schema and API extraction tasks are performed via deterministic code rather than LLM token-consuming prompts, preventing truncation, dropped tables, or hallucinations.
3. **Cross-Platform**: Tested and compliant across macOS, Linux, and Windows.

---

## 🛠️ Tool Catalog & NPM Script Mappings

| Script | NPM Script | Description |
| :--- | :--- | :--- |
| **`init.js`** | `npm run init` | Scaffolds the 6-zone directory hierarchy, configuration rules (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`), `.gitkeep` files, `.gitignore` protection rules, and starter templates. |
| **`organize.js`** | `npm run organize [dir]` | Universal directory-preserving auto-triage. Scans unstructured drops (e.g. `artifacts/`) and moves files into `00-raw-inputs/` subfolders (`db/`, `brd/`, `existing-code/`, `mom/`, `figma/`) while preserving intact git/backend repositories. |
| **`ingest-ddl.js`** | `npm run ingest:ddl` | Deterministic SQL DDL parser. Scans `ddl` sources and indexes 100% of tables, columns, data types, and primary keys into `01-ground-truth/entity-catalog.md`. |
| **`ingest-apis.js`** | `npm run ingest:apis` | Deterministic API and Surrounding System parser. Scans declarative Go routers (`ge.Route`), imperative routers, gRPC Protobuf, DTO models, and KrakenD configs into `01-ground-truth/api-inventory.md`. |
| **`ingest-brd.js`** | `npm run ingest:brd` | Deterministic BRD/PRD parser. Extracts functional requirements (`REQ-XX`), RBAC role-permission matrices, and business rules into `01-ground-truth/business-rules.md`. |
| **`generate-api-sequences.js`** | `npm run deliver:apis` | 1-to-1 PlantUML sequence diagram generator. Produces exhaustive sequence diagrams for every backend endpoint in `04-deliverables/sequence-diagrams/apis/<service>/`. |
| **`sync.js`** | `npm run sync`<br>`npm run diff`<br>`npm run sync:check` | Living Architecture & Documentation Drift Synchronizer. Detects drift between upstream code/DDL repositories and Second Brain, conducts gap analysis, and auto-synchronizes Ground Truth and deliverables. |
| **`audit.js`** | `npm run audit`<br>`npm test` | Automated provenance and integrity auditor. Validates 100% `[SRC:...]` tag coverage on deliverables, asserts DDL completeness, checks API disambiguation, and blocks on active contradictions. |


---

## ⚡ Usage Examples

```bash
# Initialize Second Brain in current workspace
node ./bin/init.js

# Automatically organize raw materials dropped in artifacts/
node ./bin/organize.js artifacts/

# Ingest all SQL tables deterministically
node ./bin/ingest-ddl.js

# Ingest internal APIs, DTOs, and external surrounding systems
node ./bin/ingest-apis.js

# Ingest PRD/BRD requirements, RBAC, and business rules
node ./bin/ingest-brd.js

# Run all-in-one ingestion
npm run ingest

# Generate 1-to-1 PlantUML sequence diagrams for all internal APIs
node ./bin/generate-api-sequences.js

# Detect architectural drift (gap analysis dry-run)
node ./bin/sync.js --dry-run

# Reconcile and synchronize Ground Truth with upstream changes
node ./bin/sync.js --apply

# Run full provenance and consistency audit
node ./bin/audit.js
```

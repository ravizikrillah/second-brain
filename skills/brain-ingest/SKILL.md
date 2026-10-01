---
name: brain-ingest
description: Ingest unstructured BRDs, Figma specs, active DB DDL/DML, existing code, and MoMs from 00-raw-inputs/, build the Delivery Plan manifest, update 01-ground-truth/, enforce 5-tier truth precedence, and detect contradictions.
---

# /brain-ingest

Execute the Second Brain discovery, ingestion, and delivery planning pipeline:

## 🎯 Purpose
Scan all raw inputs across the repository, establish an exhaustive **Delivery Plan Manifest** (`02-provenance/delivery-plan.md`) to prevent token-exhaustion and cherry-picking, update Ground Truth (`01-ground-truth/`), and enforce anti-gaslighting protection.

## 📋 Execution Protocol

### 0. 🌐 Universal Source Resolution (External Repos & Living Ground Truth)
Second Brain supports connecting to external live Backend (BE) and Frontend (FE) repositories **without copying or committing external git repositories** into this workspace:
- **Shared Declarative (`second-brain.json` / `.brainrc.json`)**:
  ```json
  {
    "name": "My Architecture",
    "sources": {
      "code": ["../backend-service", "../frontend-app", "./00-raw-inputs/existing-code"],
      "ddl": ["../backend-service/migrations", "./00-raw-inputs/db"],
      "brd": ["./00-raw-inputs/brd"]
    }
  }
  ```
- **Local Team Collaboration Override (`second-brain.local.json`)**:
  Multiple System Analysts can collaborate on the same Second Brain repository without path conflicts. Each SA can define `second-brain.local.json` (git-ignored) with absolute laptop paths, home directory expansion (`~/projects/...`), or environment variables (`$REPO_PATH`):
  ```json
  {
    "sources": {
      "code": ["~/work/backend-service", "$FE_REPO/frontend-app"]
    }
  }
  ```
- **Zero-Footprint Symlinks (`ln -s`)**:
  - `ln -s /path/to/external-repo ./00-raw-inputs/existing-code/my-repo`
  - The directory `00-raw-inputs/*/*` is git-ignored (while preserving `.gitkeep` and `README.md`), guaranteeing zero bloat in git history.
- **Portable Relative Provenance**:
  All generated provenance tags automatically strip machine-specific local directories (`/Users/...`, `C:\Users\...`), compiling into portable citations (e.g. `[SRC:CODE:backend-service/auth/controller.go#L40]`).
- **🔄 Living Ground Truth on `git pull`**:
  Whenever the external codebase is updated (`git pull origin main` in the external repo), simply rerun `/brain-ingest` (or `npm run ingest`). Second Brain immediately rescans live source code, migrations, and PRDs, synchronizing Ground Truth (`api-inventory.md`, `entity-catalog.md`, `business-rules.md`) idempotently.

### 1. 🧹 Pre-Flight Auto-Triage & File Organization
If raw materials are located in an unstructured folder (e.g., `artifacts/`, `vault/`, `docs/`) or if an argument is passed (`/brain-ingest artifacts/`):
- Run `node ./bin/organize.js [source_folder]` (or `npm run organize [source_folder]`).
- This automatically sorts files into the correct `00-raw-inputs/` subdirectories (`db/`, `brd/`, `existing-code/`, `mom/`, `figma/`) while skipping videos and heavy binary archives.

### 1b. 📄 Universal Document & Binary Conversion (Microsoft MarkItDown)
If requirement specifications, IFAs, or BRDs arrive in binary or Office formats (`.pdf`, `.docx`, `.xlsx`, `.pptx`):
- Run `node ./bin/convert.js` (or `./brain convert`).
- Automatically converts binary documents into clean Markdown stored in `00-raw-inputs/brd/_converted/*.md` (git-ignored derived read-aids).
- Eliminates AI hallucinations and token waste when interpreting complex PDF specifications or multi-sheet Excel files.
- If MarkItDown is not installed, install via: `pip install 'markitdown[all]'`. Automatically runs as step 1 in `./brain ingest`.

### 2. 🔍 Exhaustive Raw Input Discovery & Inventory
Recursively scan all resolved source directories (via `source-resolver.js`):
- **Database (`ddl` sources)**: Detect all SQL DDL files and count EVERY `CREATE TABLE` / entity across all configured migration folders. Do NOT skip any table.
- **Product BRDs (`brd` sources)**: Identify all requirement docs, journey flows, and features.
- **Service Configurations & Code (`code` sources)**: Scan Polyglot codebases (Go, Python FastAPI, TS/Node.js, Java Spring Boot, gRPC Protobuf, OpenAPI, KrakenD gateway) across all external & local repos.
- **Figma & MoM (`figma/`, `mom/`)**: Scan UI notes and discussion minutes.

### 3. 🗺️ Generate / Update Delivery Plan (`02-provenance/delivery-plan.md`)
Create or synchronize the task backlog so deliverables can be executed cleanly task-by-task without token limits:
```markdown
# 🗺️ Second Brain Delivery & Ingestion Plan

## 1. 🗄️ Database Schemas Ingestion (Total: [X] Tables)
- [ ] Task DB-01: [Domain A] (`table_1`, `table_2`)
- [ ] Task DB-02: [Domain B] (`table_3`, `table_4`)

## 2. 🚀 Product Journey Deliverables (Total: [Y] Features)
- [ ] Task DEL-01: [Feature A] (Source: `brd/feature-a.md`)
- [ ] Task DEL-02: [Feature B] (Source: `brd/feature-b.md`)

---
**Status**: [X]% Ingested | [Y]% Delivered
```

### 4. 🏛️ Crystallize Ground Truth (`01-ground-truth/`)
All ingestion scripts compile lossless, self-contained truth into `01-ground-truth/`. Once ingested, `00-raw-inputs/` can be emptied or left as `.gitkeep`, and the repository operates under the **Closed-World Assumption (CWA)**.
- **Universal Ingestion**: Run `npm run ingest` to deterministically execute DDL, API, and BRD ingestions in sequence.
- **Domain Glossary (`01-ground-truth/domain-glossary.md`)**: Update ubiquitous business terminology, canonical definitions, and forbidden synonyms.
- **Business Rules (`01-ground-truth/business-rules.md`)**:
  - Run `node ./bin/ingest-brd.js` (or `npm run ingest:brd`) to parse requirements (`REQ-XX`), journey flows, RBAC role-permission trees, and business logic into structured Markdown tables.
- **Entity Catalog (`01-ground-truth/entity-catalog.md`)**:
  - **Deterministic DDL Ingestion**: Run `node ./bin/ingest-ddl.js` (or `npm run ingest:ddl`) to parse 100% of tables, column types, nullabilities, and comments directly from SQL files into `entity-catalog.md`. This guarantees zero dropped tables or columns.
  - Enrich the catalog with lifecycle state machine transitions, Go entity mappings, and domain relationships.
  - **ANTI-CHERRY-PICKING RULE**: Every table discovered in DDL MUST be indexed in `entity-catalog.md`. The auditor (`node ./bin/audit.js`) will fail with a hard block if any table is omitted.
  - **Anti-Archaeological Hoarding (Ambiguity & Invariant Gap Report)**: Ingestion is NOT a passive file dump. The DDL parser automatically runs invariant checks and outputs a gap report flagging tables missing Primary Keys (PK) or temporal audit timestamps (`created_at`/`updated_at`), immediately directing the human architect's First Brain to unresolved data risks.
- **API Inventory & Surrounding Systems Disambiguation (`01-ground-truth/api-inventory.md`)**:
  - **Deterministic API & gRPC Ingestion**: Run `node ./bin/ingest-apis.js` (or `npm run ingest:apis`) to scan configs, curl samples, declarative Go router trees (`ge.Route`), imperative router groups, gRPC Protocol Buffers (`.proto`), KrakenD API Gateway ingress configs (`krakend.json`), and lossless Go DTO models (`json:"..."`). Automatically crystallizes Internal HTTP APIs, gRPC RPC Contracts, KrakenD Edge Ingress, DTO Schemas, and External Surrounding Systems with 100% provenance citations `[SRC:...]`.
  
#### ⚖️ The IFA Disambiguation Rule (Internal APIs vs External Surrounding Systems):
Enterprise projects frequently use the term "Interface Agreement" (IFA) for both internal microservice contracts and external integrations. You MUST strictly partition them:
1. **🔌 Part 1: Internal Microservice APIs (Owned / Inbound)**:
   - **Provider**: Microservices implemented inside this repository (`repo/backend/*` or configured external codebases).
   - **Consumer**: Frontend Web, BFF, KrakenD API Gateway, Mobile App, or internal peer services.
   - **Origin**: Go HTTP router handlers (`internal/controller/http/...`), FastAPI/Express/Spring Boot routes, and gRPC servers.
   - **Traffic Flow**: Inbound to our services (we host and maintain the endpoints).
2. **🌐 Part 2: External Surrounding Systems (Outbound Consumed / Inbound Webhooks)**:
   - **Provider**: External Enterprise Core systems or vendors.
   - **Consumer**: Our internal microservices act as **Clients** calling outbound endpoints, OR our services expose callback listeners for asynchronous incoming webhooks.
   - **Origin**: Microservice YAML configs (`web_api:`), curl samples, and BRD IFA documents.
   - **STRICT PROHIBITION**: NEVER catalog external surrounding systems as internal microservices, and NEVER put external endpoints into internal service lists!

### 5. 🛡️ Enforce 5-Tier Precedence of Truth
- Tier 1: Production Code & Active DB DDL
- Tier 2: Signed BRD / Approved PRD
- Tier 3: Accepted ADRs (`05-adrs/`)
- Tier 4: Meeting Minutes (MoM) & Chat Notes
- Tier 5: Ad-hoc Conversational User Prompts

### 🛑 Mandatory Hard Block Check
If a Tier 4 (MoM) or Tier 5 (Chat) input contradicts Tier 1, 2, or 3:
1. **HALT**: Stop deliverable generation.
2. **LOG**: Append the conflict to `02-provenance/contradictions.md`.
3. **ARBITRATE**: Prompt the operator to arbitrate via an ADR in `05-adrs/`.

### 6. 🏷️ Update Traceability & Output Scorecard
- Update `02-provenance/traceability-matrix.md` with source citations `[SRC:...]`.
- Display an Ingestion Summary Scorecard:
  - Total Raw Files Scanned
  - Total Tables Discovered & Cataloged
  - Total Product Journeys Mapped to Delivery Plan
  - Contradictions Detected / Active Hard Blocks
  - **Next Recommended Action**: "Run `/brain-deliver next` or `/brain-deliver <feature>` to execute deliverables from the Delivery Plan."

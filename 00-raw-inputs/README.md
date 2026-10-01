# 📥 Zone 0: Raw Inputs (Untrusted Ingestion Zone)

Welcome to the **Raw Inputs** zone. This directory is the entrypoint for all raw, unstructured, and heterogeneous technical and business artifacts collected from stakeholders before processing by Second Brain.

---

## 🛡️ Truth Precedence in Raw Inputs

Artifacts in this directory are **UNTRUSTED** until verified and reconciled by the `/brain-ingest` pipeline. When conflicting requirements arise, Second Brain enforces the following 5-Tier Precedence of Truth:

- **Tier 1 (Ultimate Truth)**: Active Database DDL (`db/`) and Production Backend Code (`existing-code/`).
- **Tier 2 (Contractual Truth)**: Signed PRDs, approved BRDs, and formal Interface Agreements (`brd/`).
- **Tier 3 (Architectural Truth)**: Accepted ADRs in `05-adrs/`.
- **Tier 4 (Volatile Truth)**: Meeting Minutes, chat discussions, Slack agreements (`mom/`).
- **Tier 5 (Ad-hoc Truth)**: Conversational chat prompts in active LLM sessions.

> 🛑 **MANDATORY ANTI-GASLIGHTING RULE**:  
> If an input in `mom/` (Tier 4) contradicts active DDL or code (Tier 1) or approved BRD (Tier 2), Second Brain activates a **Hard Block**. Deliverable generation halts until human arbitration records an Architectural Decision Record in `05-adrs/`.

---

## 📁 Subdirectory Breakdown

| Directory | Content Type | Truth Tier | Ingestion Tool / Command |
| :--- | :--- | :--- | :--- |
| **`brd/`** | Product Requirement Documents, BRD PDFs/Word, User Stories | Tier 2 | `/brain-ingest` |
| **`figma/`** | UI/UX screen flows, design tokens, copy text, component specs | Tier 2 | `/brain-ingest` |
| **`db/`** | SQL DDL scripts (`CREATE TABLE`), migration files, seed DML | Tier 1 | `npm run ingest:ddl` |
| **`existing-code/`** | Active backend microservices, Go routers, YAML configs, curls | Tier 1 | `npm run ingest:apis` |
| **`mom/`** | Meeting minutes, Slack alignment notes, stakeholder discussions | Tier 4 | `/brain-ingest` |

---

## ⚡ Recommended Workflow

1. **Drop raw files** into their respective subdirectories above.
2. If raw files are scattered in an unstructured folder (e.g. `artifacts/`), run:
   ```bash
   node ./bin/organize.js artifacts/
   # or: npm run organize artifacts/
   ```
3. Run the ingestion pipeline to synthesize Ground Truth:
   ```text
   /brain-ingest
   ```

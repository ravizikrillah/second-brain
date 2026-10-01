---
name: brain-adopt
description: Formally adopt an exploratory constraint scenario from 03-constraint-branches/, record an immutable ADR in 05-adrs/, and synchronize canonical deliverables.
---

# /brain-adopt <name>

Promote an architectural scenario into permanent system reality via the **Compounding Feedback Loop**:

## 📋 Execution Protocol

1. **Locate & Validate Scenario**:
   - Locate `03-constraint-branches/scenario-<name>.md`.
   - Update its frontmatter/header status to `[ADOPTED]`.
   - Mark all superseded/obsolete scenarios identified in Section 5 with `[REJECTED]` or `[OBSOLETE: superseded by scenario-<name>]`.

2. **Crystallize Immutable ADR (`05-adrs/`)**:
   - Find the next sequential index: `05-adrs/ADR-00X-<slug>.md`.
   - Document Context, Decision, Consequences, and Rejected Alternatives.
   - Status: `ACCEPTED`.

3. **🔄 The Compounding Feedback Loop (Sprint N ➔ Ground Truth N+1)**:
   - Extract the newly adopted business rules, validation constraints, and state transitions into `01-ground-truth/business-rules.md`.
   - Update `01-ground-truth/entity-catalog.md` and `api-inventory.md` with any newly ratified schema columns, endpoints, or surrounding system contracts.
   - Update `02-provenance/traceability-matrix.md` linking the new ADR to affected requirements.
   - Mark any deprecated business rules or legacy endpoints with `[OBSOLETE: ADR-00X]`.

4. **Synchronize Deliverables**:
   - Trigger `/brain-deliver` to regenerate affected PlantUML sequence diagrams, Markdown API contracts, and Low-Level Designs (LLDs) in `04-deliverables/`.
   - Run `npm run audit` (or `./brain audit`) to confirm 100% provenance coverage and zero broken links.

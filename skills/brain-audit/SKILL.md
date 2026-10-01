---
name: brain-audit
description: Verify 100% provenance citation coverage across deliverables, validate DDL-to-contract schema consistency, and check for unresolved contradictions.
---

# /brain-audit

Execute an exhaustive integrity and provenance audit on the Second Brain:

1. Run `node ./bin/audit.js` (or `npm run audit`) to execute the deterministic regex-based audit linter across all `.puml` diagrams and `.md` contracts.
2. Audit `04-deliverables/`:
   - Verify every endpoint in `04-deliverables/api-contracts/*.md` has a valid `[SRC:...]` tag.
   - Verify every step in `04-deliverables/sequence-diagrams/*.puml` has an authoritative citation.
   - Verify all field data types in API contracts match the active database schema in `00-raw-inputs/db/` or `01-ground-truth/entity-catalog.md`.
3. Check `02-provenance/delivery-plan.md` (if present) to assert 100% completion of all planned database schemas and product deliverables.
4. Check `02-provenance/traceability-matrix.md` for orphaned requirements or unverified components.
5. Check `02-provenance/contradictions.md` to ensure all conflicts have been arbitrated via an ADR.
6. Output a comprehensive audit scorecard (Coverage %, Discrepancies, and Action Items).

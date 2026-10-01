---
name: brain-qna
description: Stakeholder Q&A & Refinement Matrix generator. Extracts unconfirmed business rules, unresolved contradictions, and open architectural trade-offs into an interactive refinement matrix in 02-provenance/stakeholder-qna.md.
---

# /brain-qna

Generate and manage the Stakeholder Q&A Refinement Matrix bridging technical ground truth to non-technical Product Owners and business stakeholders:

## 🎯 Purpose
Automatically extract unconfirmed business rules, open architectural forks, and specification conflicts into a structured Markdown matrix (`02-provenance/stakeholder-qna.md`) for sprint refinement and business alignment.

## 📋 Execution Protocol

1. **Generate Q&A Matrix**:
   Run `node ./bin/qna.js` (or `./brain qna`, `npm run qna`).
   This automatically scans:
   - `02-provenance/contradictions.md`: Unresolved conflicts (`🔴` or pending arbitration).
   - `01-ground-truth/business-rules.md`: Invariants marked `[UNCONFIRMED]`, `[PENDING]`, or `[TBD]`.
   - `03-constraint-branches/`: Open architectural trade-off scenario branches (`scenario-*.md`).

2. **Output Location**:
   - `02-provenance/stakeholder-qna.md`: Clean Markdown refinement table structured with:
     - **ID**: `QNA-01`, `QNA-02`, ...
     - **Category / Dimension**: e.g., Architectural Trade-Off, Business Rules, Conflict.
     - **Ambiguity / Architectural Fork**: Plain-language description of the issue.
     - **Technical Recommendation**: SA's recommended resolution.
     - **Stakeholder Decision / Answer**: Dedicated placeholder `*[Fill Decision Here]*` for PO input.
     - **Status**: `PENDING_PO_DECISION`, `PENDING_BUSINESS_CONFIRMATION`, etc.

3. **Stakeholder Collaboration**:
   Share `02-provenance/stakeholder-qna.md` directly with the Product Owner or Business Analyst during grooming/refinement. The PO replaces `*[Fill Decision Here]*` with their definitive decision.

4. **Re-ingest & Formalize Decisions**:
   Run `node ./bin/qna.js --import` (or `./brain qna --import`, `npm run qna:import`).
   - Captures all resolved stakeholder decisions.
   - For trade-off scenarios: Execute `/brain-adopt <scenario-name>` to record an immutable ADR in `05-adrs/`.
   - For business rules: Update `[UNCONFIRMED]` tags to official `[REQ-XX]` in `01-ground-truth/business-rules.md`.
   - Re-run `./brain audit` and `./brain readiness` to verify system consistency.

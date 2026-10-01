# 📜 Zone 5: ADRs (Architectural Decision Records)

Welcome to the **Architectural Decision Records** zone. This directory houses the permanent, sequential, and immutable record of all significant architectural decisions, constraint branch adoptions, and contradiction arbitrations across the system lifecycle.

---

## 🎯 Purpose & Immutability Standard

Architectural decisions must never be ephemeral or lost in chat logs. In Second Brain:
1. **Immutable History**: Once an ADR is accepted, it is NEVER modified in place. If a past decision is changed, a new ADR is drafted that explicitly supersedes the earlier one.
2. **Conflict Arbitration**: When a Tier 4 (MoM/Chat) input contradicts Tier 1 (Code/DDL) or Tier 2 (BRD), deliverable generation is halted via a **Hard Block**. The block can ONLY be lifted by human operator arbitration recorded as an accepted ADR in this directory.
3. **Traceability Anchor**: Accepted ADRs represent **Tier 3 (Architectural Truth)** in the 5-Tier Precedence of Truth.

---

## 📄 File Naming & Numbering Convention

Files are sequentially numbered with four digits followed by a kebab-case description:
```text
05-adrs/
├── 0001-hierarchy-of-truth-and-hard-block.md
├── 0002-orchestrator-commands-and-portable-triplet-rules.md
├── 0003-distribution-package-and-init-scaffolding.md
└── 0004-ifa-disambiguation-and-surrounding-systems-catalog.md
```

---

## 📋 ADR Document Structure

Every record follows the standardized architecture decision structure:
- **Number & Title**: Sequential ID and concise decision title.
- **Status**: `[ACCEPTED | PROPOSED | SUPERSEDED by ADR-XXXX]`.
- **Context**: The business, operational, or technical problem forcing a decision.
- **Decision**: The chosen architectural path and boundary enforcement.
- **Consequences**: Positive trade-offs, negative trade-offs, and downstream operational impact.
- **Contradiction Resolution (if applicable)**: Explicitly references the `Conflict ID` from `02-provenance/contradictions.md` being resolved.

---

## ⚡ Generation Commands

- `/brain-adopt <scenario-name>`: Automatically promotes a constraint branch into an immutable ADR and triggers deliverable resynchronization.

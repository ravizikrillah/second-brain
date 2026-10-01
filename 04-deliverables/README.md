# 📦 Zone 4: Deliverables (Production Engineering Deliverables)

Welcome to the **Deliverables** zone. This directory houses the authoritative, production-ready engineering specifications synthesized by Second Brain from verified Ground Truth.

---

## 🎯 Purpose & Engineering Standard

Deliverables in this directory serve as the authoritative reference for Backend Developers, Frontend Engineers, QA Engineers, and Solution Architects. Every element produced here must adhere to strict quality invariants:

1. **Mandatory Inline Provenance**: Every API field, sequence diagram message arrow, and data model touchpoint MUST cite its authoritative source via `[SRC:...]`.
2. **Deterministic Grounding**: Every deliverable is generated directly from tasks registered in `02-provenance/delivery-plan.md` using the `/brain-deliver` command.
3. **Hard Block Gate**: Deliverables cannot be generated or updated if any active contradiction exists in `02-provenance/contradictions.md`.

---

## 📁 Deliverable Subdirectories

| Subdirectory | Artifact Format | Content & Standards |
| :--- | :--- | :--- |
| **[`sequence-diagrams/`](sequence-diagrams/README.md)** | PlantUML (`.puml`) | Flow interactions strictly partitioning Internal Microservices (`box "Internal Services"`) from External Surrounding Systems (`box "External Surrounding Systems"`), complete with autonumbering and error branches (`alt / else`). |
| **[`api-contracts/`](api-contracts/README.md)** | Markdown (`.md`) | Exhaustive REST & gRPC endpoint contracts with boundary tagging (`[INTERNAL MICROSERVICE API]` vs `[EXTERNAL SURROUNDING SYSTEM IFA]`), payload schemas, headers, query params, and status codes. |
| **[`lld/`](lld/README.md)** | Markdown (`.md`) | 3-Pillar Low-Level Designs: Pillar 1 (Architectural Context), Pillar 2 (Technical Flow & Validation Sequence), Pillar 3 (Data Model, Redis Caching & Async Events). |

---

## ⚡ Generation & Validation Commands

- `/brain-deliver next`: Synthesizes the next pending task from `02-provenance/delivery-plan.md`.
- `/brain-deliver <feature>`: Generates complete deliverables for a specific feature.
- `/brain-audit`: Verifies that 100% of deliverable elements have valid provenance citations (`[SRC:...]`).
- `/brain-story <feature>`: Slices deliverables into Jira/Confluence-ready user stories with Gherkin Acceptance Criteria.
- `/brain-impact <target>`: Analyzes blast radius across deliverables when a schema or contract change is proposed.

# Second Brain

A universal knowledge, synthesis, and architectural design system that converts raw product and technical inputs into verified deliverables with strict provenance, constraint branching, and misinformation resistance.

## Language

**Ground Truth**:
The verified, immutable canonical state of system behavior anchored strictly to production code, active database DDL, and signed BRDs.
_Avoid_: Working assumptions, chat memory, unverified notes

**Raw Input**:
Unprocessed source materials (BRD drafts, MoM notes, chat dumps, Figma annotations, DDL/DML scripts) before ingestion and cross-verification.
_Avoid_: Facts, specifications, source of truth

**Provenance**:
The explicit, traceable chain of evidence linking every endpoint, diagram step, data field, or architectural decision to its authoritative source identifier.
_Avoid_: Attribution note, comment, reference link

**Contradiction**:
A detected conflict between incoming claims or lower-tier inputs and higher-tier ground truth that must halt automatic deliverable updates until arbitrated.
_Avoid_: Discrepancy, bug, misunderstanding

**Constraint Branch**:
An isolated scenario-based architectural exploration evaluating system behavior under alternative constraints without polluting canonical deliverables.
_Avoid_: Fork, experimental branch, draft LLD

**Deliverable**:
Authoritative engineering outputs (PlantUML sequence diagrams, API/IFA contracts in Markdown, Low-Level Designs) derived strictly from verified Ground Truth and tagged with provenance citations.
_Avoid_: Solution draft, temporary diagram, proposal doc

**Hard Block**:
The mandatory operational halt triggered when a contradiction is detected between conflicting truth tiers, prohibiting deliverable generation until formal ADR arbitration occurs.
_Avoid_: Warning, soft bypass, error skip

**Orchestrator**:
The unified entrypoint workflow command suite (`/brain-init`, `/brain-ingest`, `/brain-deliver`, `/brain-branch`, `/brain-adopt`, `/brain-audit`) managing Second Brain operations.
_Avoid_: Script, bot, runner


**Resolution Wizard**:
The interactive arbitration workflow that resolves a Hard Block by prompting the operator and auto-generating an authoritative ADR in `05-adrs/`.
_Avoid_: Manual bypass, override switch

**Scenario Adoption**:
The formal promotion of an exploratory constraint branch into an accepted ADR with synchronized updates to canonical deliverables.
_Avoid_: Branch merge, overwrite, sync


**API Contract**:
A structured Markdown specification detailing HTTP/gRPC endpoints, headers, request/response bodies, and validation rules.
_Avoid_: Swagger UI, informal endpoint list

**Sequence Diagram**:
A PlantUML (`.puml`) document capturing interaction lifecycles between users, gateways, services, and datastores.
_Avoid_: Flowchart, visual diagram, UI flow


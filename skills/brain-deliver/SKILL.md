---
name: brain-deliver
description: Execute task-based deliverable generation from the Delivery Plan manifest. Produces authoritative PlantUML sequence diagrams, Markdown API contracts, and Low-Level Designs in 04-deliverables/ conforming to universal sequence diagram and 3-pillar LLD standards with strict provenance citations [SRC:...].
---

# /brain-deliver

Synthesize and produce production-ready engineering deliverables from the Delivery Plan backlog conforming to universal enterprise architecture standards.

## 🎯 Purpose
Transform verified Ground Truth into detailed, exhaustive engineering deliverables (Universal PlantUML sequence diagrams, Markdown API contracts, and 3-Pillar LLD documents) task-by-task without token truncation, missing requirements, or conversational drift.

---

## 📋 Execution Protocol

### 1. 🛑 Pre-Flight Hard Block Check
Inspect `02-provenance/contradictions.md`.
If ANY unresolved contradiction exists (`STATUS: OPEN` / `ACTIVE`):
- **HALT immediately**.
- Notify the operator that deliverables cannot be generated until an ADR is recorded in `05-adrs/`.

### 1b. 🧭 Enterprise SA Pre-Flight Probe Gate (5 Pillars)
Before generating sequence diagrams or LLDs, assert that the critical architectural invariants are established in `01-ground-truth/`:
1. **Component Vector**: Classify affected tables, APIs, and services (`REUSE` / `UPDATE` / `ENHANCE` / `NEW`).
2. **Surrounding Systems & Boundaries**: Integration protocol (REST / gRPC / Kafka), Sync vs Async, Timeout SLA (ms), Circuit Breaker & Fallback.
3. **Data Integrity & Concurrency**: Idempotency key requirement, Row locking, PII masking (`0812****123`), Source of Truth.
4. **Lifecycle & Standardized Errors**: Finite State transitions, standardized domain error codes (`ERR_*` / HTTP status / business errors), DLQ / Fallout recovery.
5. **Accountability & Verification**: Accountable service owner (`owned_by`), Gherkin acceptance criteria (Happy, Error, Resilience).
- **Anti-Slop & Icon Badge Law**: Deliverables must strictly use the 4 standardized status icon badges (`[PASS]`, `[WARN]`, `[BLOCK]`, `[DRAFT]`) or clean monospace glyphs (`[✓]`, `[!]`, `[✗]`, `[○]`). Decorative and unicode emojis are strictly banned in technical `.puml` diagrams and LLD specs to guarantee 100% font rendering stability across CI/CD and PDF exporters. Write in active voice without generic AI buzzwords.

### 2. 🎯 Determine Execution Target
Parse the command argument:
- `/brain-deliver <feature-name>` (e.g. `/brain-deliver checkout` or `/brain-deliver DEL-01`): Focuses solely on that specific task from `02-provenance/delivery-plan.md`.
- `/brain-deliver next` (or `/brain-deliver` without args): Finds the **first pending task (`[ ]`)** in `02-provenance/delivery-plan.md` and executes it.
- `/brain-deliver all`: Iterates through all remaining pending tasks in sequence, producing complete artifacts for each until the manifest is 100% complete.
- `/brain-deliver apis` (or `npm run deliver:apis`): Generates 1-to-1 granular PlantUML sequence diagrams in `04-deliverables/sequence-diagrams/apis/<service>/` for **every single backend API endpoint** in `01-ground-truth/api-inventory.md`, linking database DDL schemas, ingress routing, response notes, and updating `02-provenance/delivery-plan.md` automatically.

### 3. 📄 Generate Authoritative Deliverables (Universal Architecture Standards)
For the selected task/feature, produce the complete deliverable suite in `04-deliverables/`:

#### 1. PlantUML Sequence Diagram (`04-deliverables/sequence-diagrams/<feature>.puml`)
Must strictly follow `docs/standards/plantuml-sequence-standards.md`:
- **Mandatory Header & Styling**:
  ```plantuml
  @startuml [feature-slug]
  autonumber
  title [MODULE / DOMAIN] - [FEATURE NAME]
  footer Architecture & System Design
  skinparam minClassWidth 90
  !theme plain
  hide unlinked
  ```
- **Internal System Boundary Box (`#DBEEF3`)**:
  - All internal services and datastores enclosed in `box "[System / Platform Name]" #DBEEF3 ... end box`.
  - Bold multiline participants: `participant "**Frontend** \n **Client**" as f`, `participant "**API** \n **Gateway**" as gw`.
  - Internal backend services dynamically named from the project's architecture: `participant "**Order** \n **Service**" as ord`.
  - Storage participants: `database "**Database**" as db`, `database "**Cache**" as cache`, `queue "**Message Broker**" as mq`.
- **External Surrounding Systems**:
  - Placed **outside** the internal box: `participant "**Payment Provider**" as pay`, `participant "**Identity Provider**" as idp`.
- **Request / Response Arrow Conventions**:
  - Call syntax: `caller -> receiver: METHOD: Title \n/url/endpoint` with explicit `activate` and `deactivate`.
  - Inline provenance tag on arrows: `<color:#007acc><b>[SRC:BRD#REQ-XX]</b></color>` or `<color:#28a745><b>[SRC:DDL:table_name]</b></color>`.
- **Note Conventions**:
  - Success response note over caller: `note over f #DDF4DD \n Http Status: 200 \n { ... } \n end note`.
  - Error response note: `note over f #FFCCCC \n Http Status: 4xx \n { ... } \n end note`.
  - Enhancement logic wrapped in: `group #F8D4AF ENHANCEMENT [Sprint / Feature Description] ... end`.

#### 2. API Contract (`04-deliverables/api-contracts/<feature>-api.md`)
- Endpoint URL, HTTP Method, and provenance badge (`> **Provenance**: [SRC:...]`).
- **Contract Boundary Tag**:
  - `Type: [INTERNAL MICROSERVICE API]` (Owned & Hosted by the internal platform) OR
  - `Type: [EXTERNAL SURROUNDING SYSTEM IFA]` (Integration with external third-party or enterprise core).
- If External Surrounding IFA: Document Outbound Client Payload, Timeout/Retry policy, Circuit Breaker, and Fallout/Error recovery behavior.
- Request Headers and Query Parameters with type & nullability.
- Request & Response JSON Schemas with inline `[SRC:...]` tags for every field.
- Success (`200 OK` / `201 Created`) and Error Responses (`400`, `401`, `409`, `500`, `504`).

#### 3. Low-Level Design (`04-deliverables/lld/<feature>-lld.md`)
Must strictly adhere to the **Universal 3-Pillar Layout Standard** (`docs/standards/lld-generator.md` and `docs/standards/technical-flow.md`):
- **Document Title**: `# LLD - {FEATURE_TITLE_UPPERCASE}`
- **I. Introduction and Scope Sections**:
  - `### 1. Objective Overviews`: Narrative description, numbered `Scopes:`, and **Scope Metrics & Impact Quantification** standard GFM table.
  - `### 2. Glossaries`: GFM table of domain terms, acronyms, and platform contexts.
- **II. Solution Details Sections**:
  - `### 3. Impacted Objects`: GFM table covering impacted backend services/modules, database tables/columns, and cache keys.
  - `### 4. Sequence Diagrams & Flow Descriptions`: Complete embedded PlantUML diagram code block, followed immediately by an exhaustive, numbered narrative breakdown (`##### Step-by-Step Flow Description:`).
  - `### 5. Technical Flows & Surrounding Systems`: Concise system-to-system technical flow and categorized Surrounding Systems list (`technical-flow`).
  - `### 6. Application Interfaces`: Links to API contracts and OpenAPI/Protobuf schema specifications.
  - `### 7. Data Designs`: PlantUML ERD snippet with `<back:#F8D4AF>column : TYPE</back>` for modifications, plus cache/broker schemas.
  - `### 8. Security Measures`: Token integrity (JWT claims), access control (RBAC), input validation & tampering protection, rate limiting.
- **III. Closure Section**:
  - `### 9. References`: Authoritative links to PRDs, architecture designs, and issue trackers.
- **Zero ASCII Box-Drawing Rule**: MUST use standard GitHub-Flavored Markdown tables with `<br/>` for multiline content. Never use Unicode box drawing characters (`┌───┐`, etc.).

---

### 4. 🔄 Synchronize Manifest & Provenance
- Update `02-provenance/delivery-plan.md`:
  - Change the task status from `[ ]` to `[x]` (e.g. `- [x] Task DEL-01: Order Creation Flow`).
  - Recalculate and update the overall progress percentage.
- Update `02-provenance/traceability-matrix.md` with the newly generated deliverable elements.

---

### 5. 📊 Output Completion Status
Display the task completion banner:
- Completed Task Name & Output Files (`.puml`, `-api.md`, `-lld.md`)
- Remaining Pending Tasks in `02-provenance/delivery-plan.md`
- Next Recommended Step: "Run `/brain-deliver next` for the next task or `/brain-audit` to verify system integrity."

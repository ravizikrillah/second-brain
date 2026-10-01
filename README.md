# 🧠 Second Brain (`@ravizikrillah/second-brain`)

[![skills.sh](https://img.shields.io/badge/skills.sh-ravizikrillah%2Fsecond--brain-blue?style=flat-square)](https://www.skills.sh/ravizikrillah/second-brain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Readiness: ARCS 30-Dim](https://img.shields.io/badge/ARCS-30--Dimension-brightgreen.svg)](docs/standards/lld-generator.md)
[![Maturity: Level 5 AKG](https://img.shields.io/badge/Maturity-Level_5_AKG-purple.svg)](bin/impact.js)
[![Zero Hallucination](https://img.shields.io/badge/CWA-Zero_Hallucination-success.svg)](01-ground-truth/)

> **Universal System Analyst & Architectural Second Brain for AI Agents and Engineering Teams.**  
> Ingests unstructured PRDs/BRDs, Figma specifications, active Database DDL/DML, polyglot microservice codebases, and Meeting Minutes (MoM) to produce verified, production-grade engineering deliverables (PlantUML Sequence Diagrams, Markdown API Contracts, 3-Pillar Low-Level Designs) with **strict provenance tracking (`[SRC:...]`)**, **5-tier truth precedence**, and **absolute anti-gaslighting protection**.

🌐 **Skills Directory Hub**: [https://www.skills.sh/ravizikrillah/second-brain](https://www.skills.sh/ravizikrillah/second-brain)

---

## ⚡ Key Highlights & Core Capabilities

- **Level 5 Architecture Knowledge Graph (AKG)**: Zero-cloud, in-memory graph representation of schemas, endpoints, lifelines, LLD sections, and surrounding systems enabling deterministic multi-hop blast radius traversal (`./brain impact <target> --hops=3 --json`).
- **5-Level AI Second Brain Maturity Benchmark**: Built-in maturity index measuring repository progression from Level 1 (Folder Routing) to Level 5 (Multi-Hop Knowledge Graph).
- **30-Dimension Architecture Readiness Score (ARCS)**: Automated evaluation benchmark covering 6 stakeholder roles (Owner, PM, BA, BE, QA, Client) with objective pass/fail criteria and gap detection (`./brain readiness`).
- **5-Tier Precedence of Truth & Anti-Gaslighting**: Code & DDL always overrule PRDs, ADRs overrule meeting minutes, and meeting claims overrule conversational prompts. Conflicts trigger immediate **Hard Blocks** logged to `02-provenance/contradictions.md`.
- **Closed-World Assumption (CWA) & Anti-Bluffing Law**: Canonical truth is strictly bounded by `01-ground-truth/`. If an entity, column, or route is absent, it does not exist. AI bluffing is blocked; missing elements yield explicit `[NOT FOUND IN GROUND TRUTH]` citations.
- **Enterprise PARA Lifecycle**: Adapts Tiago Forte's PARA framework (Projects, Areas, Resources, Archives) for systems engineering, mapping actionability directly across the 6 canonical zones.
- **Unified CLI Controller (`./brain`)**: Single-entrypoint executable routing to all 12 analytical tools, verification suites, and maintenance routines.
- **Universal Natural Language Reflex**: Zero-command mandate. Operates conversationally in English or Indonesian; AI automatically maps human intent to the proper analytical engine.
- **Living Architecture & Drift Synchronizer (`./brain sync`)**: Automatically inspects git deltas after `git pull`, identifies schema drift or route changes, and updates 1-to-1 PlantUML sequences idempotently.
- **Stakeholder Q&A & Refinement Matrix (`./brain qna`)**: Extracts unconfirmed business rules into a structured questionnaire (`stakeholder-qna.md`) for Product Owners and absorbs answers directly back into ADRs (`--import`).
- **Automated MarkItDown Ingestion (`./brain convert`)**: Native conversion pipeline for PDF specs, Word documents (`.docx`), and Excel spreadsheets (`.xlsx`) directly into Markdown before ingestion.
- **Git Pre-Commit Quality Gate (`./brain hooks`)**: Automated pre-commit hook blocking commits if provenance coverage < 100% or broken markdown links exist.

---

## 🚀 Installation & Quickstart

### Option A: Install via Skills CLI (Global for All Projects)
Installs Second Brain skills globally into `~/.agents/skills/`, accessible across all repositories on your workstation:
```bash
npx skills add ravizikrillah/second-brain -g --all
```

### Option B: Install at Project Level (Shared via Git for All Teammates)
Installs skills directly into your project's `.agents/skills/` using physical copying (`--copy` prevents broken symlinks across collaborator machines). When committed, **any engineer or AI agent cloning the repo immediately inherits all Second Brain capabilities without installing anything**:
```bash
# 1. Install skills at project level
npx skills add ravizikrillah/second-brain --copy --all

# 2. Commit to Git so all teammates inherit the capabilities
git add .agents/ skills-lock.json
git commit -m "feat: install second-brain skills at project level"
git push origin main
```

### Option C: Initialize Locally in Any Repository
Automatically scaffolds the 6-zone folder hierarchy, `.gitignore` protection rules, configuration templates, and baseline deliverables:
```bash
npx @ravizikrillah/second-brain init
# or locally:
./brain init
# or:
node ./bin/init.js
```

### Option D: Install via Claude Code CLI Plugin
```bash
claude plugins install ravizikrillah-second-brain
```

### Option E: Unified Local CLI (`./brain`)
The repository includes a unified executable CLI (`./brain` or `bin/brain.js`) providing instant access to all core capabilities:
```bash
./brain help           # Display full command overview
./brain query <term>   # Instant zero-hallucination architecture search
./brain impact <target># Level 5 Multi-Hop Blast Radius Analyzer
./brain readiness      # 30-Dimension ARCS Benchmark & Maturity Score
./brain audit          # Verify 100% provenance coverage & schema completeness
./brain test           # Run full verification suite (audit + readiness + lint)
```

---

## ⚡ Unified CLI & Agent Command Suite

Second Brain provides both single-token slash commands for interactive AI agent sessions and direct CLI equivalents for terminal or CI/CD pipelines:

| Agent Command | Unified CLI Command | Primary Function |
| :--- | :--- | :--- |
| `/brain-init` | `./brain init` | Scaffolds the 6-zone directory hierarchy, `.gitignore` rules, and baseline templates. |
| `/brain-ingest` | `./brain ingest` | Converts binary docs (`convert.js`), ingests DDL, routes, and BRDs, updating `01-ground-truth/`. |
| `/brain-deliver [apis]` | `./brain deliver [apis]` | Generates PlantUML diagrams (`.puml`), API contracts (`.md`), and 3-pillar LLDs with `[SRC:...]` citations. |
| `/brain-branch <name>` | `./brain branch <name>` | Creates an isolated trade-off scenario in `03-constraint-branches/scenario-<name>.md` with cross-branch correlation. |
| `/brain-adopt <name>` | `./brain adopt <name>` | Promotes an exploratory scenario to `ADOPTED`, writes an immutable ADR in `05-adrs/`, and syncs deliverables. |
| `/brain-audit` | `./brain audit` | Asserts 100% provenance tag coverage, DDL schema completeness, and verifies zero active hard blocks. |
| `/brain-readiness` (alias `/brain-eval`) | `./brain readiness` | Executes the 30-dimension ARCS benchmark and calculates the 5-Level AI Second Brain Maturity index. |
| `/brain-qna` | `./brain qna` | Generates the Product Owner Refinement Matrix (`02-provenance/stakeholder-qna.md`). Use `--import` to absorb decisions. |
| `/brain-query <query>` | `./brain query <term>` | Fast AST/regex knowledge retrieval across schemas, endpoints, and event lifelines with exact line citations. |
| `/brain-impact <target>` | `./brain impact <target>` | Level 5 Multi-Hop Blast Radius Analyzer evaluating impact across DDL, APIs, sequences, and external systems. |
| `/brain-story <feature>` | `./brain story <feature>` | Slices deliverables into Jira/Confluence User Stories with 3-scenario Gherkin Acceptance Criteria. |
| `/brain-sync [--diff]` | `./brain sync [--diff]` | Living Architecture & Documentation Drift Synchronizer. Detects git delta and auto-syncs Ground Truth. |
| *N/A* | `./brain convert` | Converts PDF, Word (`.docx`), Excel (`.xlsx`), and PPT documents into Markdown via MarkItDown. |
| *N/A* | `./brain hooks` | Installs Git pre-commit quality gate enforcing 100% provenance and zero broken links before commits. |
| *N/A* | `./brain handoff` | Generates/updates `02-provenance/session-handoff.md` ensuring zero memory loss between agent sessions. |
| *N/A* | `./brain lint` | Verifies internal markdown links, zone structure boundaries, and repository consistency. |
| *N/A* | `./brain test` | Runs the full verification test suite: `audit` + `readiness` + `lint`. |

> 📐 **Built-in Engineering Standards**: All generated artifacts conform to universal enterprise specifications:
> - **[Universal PlantUML Sequence Standards](docs/standards/plantuml-sequence-standards.md)**: Internal boundary boxes (`#DBEEF3`), bold multiline participants, `#DDF4DD` response notes, `#FFCCCC` error notes, `#F8D4AF` enhancement blocks, and inline provenance citations.
> - **[3-Pillar Low-Level Design (LLD) Standard](docs/standards/lld-generator.md)**: Introduction & Scope, Solution Details (Impacted objects, sequence flows, IFA contracts, ERD, security), and Closure with strict GFM tables.
> - **[Technical Flow & Surrounding Systems Extraction](docs/standards/technical-flow.md)**: Concise system-to-system communications and categorized external integrations.
> - **[Polyglot Backend Code Extractor](docs/standards/backend-code-to-plantuml-extractor.md)**: 5-layer reverse-engineering across Go, TypeScript, Python, Java, gRPC Protobuf, and OpenAPI.

---

## 🏆 5-Level AI Second Brain Maturity Benchmark

Second Brain evaluates architectural maturity through a deterministic 5-level index (evaluated automatically during `./brain readiness`):

```text
┌────────────────────────────────────────────────────────────────────────┐
│             5-LEVEL AI SECOND BRAIN MATURITY BENCHMARK                 │
├─────────┬───────────────────────────────────┬──────────────────────────┤
│ Level   │ Benchmark Pillar                  │ Operational Milestone    │
├─────────┼───────────────────────────────────┼──────────────────────────┤
│ Level 1 │ Folder Routing & Zone Boundary    │ 6 canonical zones + .git │
│ Level 2 │ Tagging & Provenance Metadata     │ 100% [SRC:...] & catalog │
│ Level 3 │ Domain Glossary & Semantic Dict   │ Synonyms & biz rules     │
│ Level 4 │ Deterministic Contract RAG        │ 1-to-1 API sequences     │
│ Level 5 │ Architecture Knowledge Graph(AKG) │ Multi-hop blast radius   │
└─────────┴───────────────────────────────────┴──────────────────────────┘
```

| Maturity Level | Benchmark Pillar | Scope & Operational Mechanism | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Folder Routing & Zone Boundary** | Partitioning of all 6 canonical zones with `.gitignore` raw input leakage protection. | All 6 zones exist with active `.gitignore` rules. |
| **Level 2** | **Tagging & Provenance Metadata** | Full provenance tracking (`[SRC:...]`), entity catalog, and delivery backlog active. | Entity catalog > 500 bytes, delivery plan active, 100% tag coverage. |
| **Level 3** | **Domain Glossary & Semantic Dictionary** | Standardized domain glossary with forbidden synonym guards and unambiguous business rules. | `domain-glossary.md` and `business-rules.md` active. |
| **Level 4** | **Deterministic Contract RAG & Sequences** | Authoritative 1-to-1 sequence diagrams for all internal endpoints with zero-hallucination query engine (`./brain query`). | Sequence deliverables active, query engine functional, ARCS >= 90%. |
| **Level 5** | **Architecture Knowledge Graph (AKG)** | In-memory zero-cloud knowledge graph with deterministic multi-hop blast radius traversal (`./brain impact`). | In-memory AKG active, multi-hop reasoning (up to 3 hops), traceability matrix active. |

---

## 🏛️ The 6-Zone Directory Architecture & Enterprise PARA Lifecycle

Second Brain adapts Tiago Forte's PARA framework (Projects, Areas, Resources, Archives) for systems engineering. Information is organized strictly by **actionability and operational urgency**, mapped directly to the 6 canonical zones without altering directory paths:

| PARA Pillar | Operational Definition | Mapped Zones | Primary Artifacts & Scope |
| :--- | :--- | :--- | :--- |
| **`[P] Projects`** | Active, time-bound engineering deliverables with specific sprint deadlines | `03-constraint-branches/`<br>`04-deliverables/` | Active CR branches (`scenario-*.md`), PlantUML sequences (`.puml`), API contracts (`.md`), LLDs, and Jira stories. |
| **`[A] Areas`** | Long-term operational responsibilities and canonical system invariants | `01-ground-truth/`<br>`02-provenance/` | Canonical truth (`entity-catalog.md`, `api-inventory.md`, `business-rules.md`), Traceability matrix, and session handoffs. |
| **`[R] Resources`** | Untrusted raw inputs, upstream reference materials, and external specs | `00-raw-inputs/` | Untrusted DDL dumps, PRD/BRD files, Figma specs, MoM logs, vendor IFAs. Never treated as truth without verification. |
| **`[A] Archives`** | Completed, immutable architectural decisions and historical records | `05-adrs/` | Sequential immutable ADRs (`0001-*.md`), superseded branches, and historical decision audits. |

### Physical Directory Hierarchy:
```text
.
├── 00-raw-inputs/               # [RESOURCE] UNTRUSTED: Raw, unverified source files
│   ├── brd/                     # Business requirements, PRDs, user stories
│   ├── figma/                   # Screen flows, UX copy, design token specs
│   ├── db/                      # Schema DDL (CREATE/ALTER TABLE), migrations, seeds
│   ├── existing-code/           # Backend handlers, domain entities, route files
│   └── mom/                     # Meeting minutes, Slack/chat agreements
│
├── 01-ground-truth/             # [AREA] CANONICAL: Crystallized system reality
│   ├── domain-glossary.md       # Ubiquitous language & business entity glossary
│   ├── entity-catalog.md        # Data models, field constraints, lifecycle states
│   ├── api-inventory.md         # Active endpoint catalogue & service boundaries
│   └── business-rules.md        # Formal validation gates and business invariants
│
├── 02-provenance/               # [AREA] INTEGRITY: Traceability & truth verification
│   ├── traceability-matrix.md   # Requirement <-> Code <-> Deliverable link table
│   ├── contradictions.md        # Contradiction log & anti-gaslighting audit trail
│   ├── delivery-plan.md         # Deliverable backlog and sprint completion status
│   └── session-handoff.md       # Live session state & context hot-handover
│
├── 03-constraint-branches/      # [PROJECT] EXPLORATION: Isolated architectural trade-offs
│   ├── scenario-template.md     # Base template for evaluating trade-offs
│   └── scenario-{name}.md       # Impact analysis: "What if Constraint A vs B?"
│
├── 04-deliverables/             # [PROJECT] DELIVERABLES: Production engineering artifacts
│   ├── sequence-diagrams/       # PlantUML (.puml) sequence diagrams with citations
│   ├── api-contracts/           # REST/IFA interface specifications in Markdown
│   └── lld/                     # Complete 3-Pillar Low-Level Design documents (.md)
│
├── 05-adrs/                     # [ARCHIVE] DECISIONS: Immutable Architectural Decisions
│   ├── 0001-hierarchy-of-truth-and-hard-block.md
│   ├── 0002-orchestrator-commands-and-portable-triplet-rules.md
│   ├── 0003-distribution-package-and-init-scaffolding.md
│   └── 0004-ifa-disambiguation-and-surrounding-systems-catalog.md
│
├── bin/                         # CLI executables & deterministic engines
├── brain                        # Unified CLI shell launcher
├── CONTEXT.md                   # Formal domain model dictionary
├── AGENTS.md                    # Universal AI agent instruction & behavioral rules
├── CLAUDE.md                    # Claude Code configuration
└── .cursorrules                 # Cursor IDE configuration
```

---

## 🛡️ 5-Tier Precedence of Truth & Anti-Gaslighting

To eliminate hallucinations, conversational drift, and unverified meeting claims, Second Brain enforces an unbendable hierarchy of truth:

```text
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Production Code & Active Database DDL (Ground Truth) │
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Signed BRD / Approved PRD / Official Contracts      │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Accepted Architectural Decision Records (05-adrs/)  │
├─────────────────────────────────────────────────────────────┤
│ Tier 4: Meeting Minutes (MoM) & Chat Discussions            │
├─────────────────────────────────────────────────────────────┤
│ Tier 5: Ad-hoc Conversational User Prompts / Chat Claims     │
└─────────────────────────────────────────────────────────────┘
```

### 🛑 Mandatory Hard Block Protocol
Whenever a Tier 4 (MoM) or Tier 5 (Chat prompt) input conflicts with Tier 1, 2, or 3:
1. **Halt Deliverable Generation**: The agent stops immediately.
2. **Log Conflict**: Append full discrepancy details to `02-provenance/contradictions.md`.
3. **Trigger Resolution Wizard**: Prompt the human architect to either reject the claim or formally ratify it as an ADR in `05-adrs/`.

### 🛑 Closed-World Assumption & Anti-Bluffing Law
- **Zero Hallucination Mandate**: Canonical system truth is strictly bounded by `01-ground-truth/`. If an entity, database table, column, or API field is missing from Ground Truth, **it does not exist in the system**.
- Extrapolation or guessing standard REST conventions is strictly prohibited. Missing elements output:  
  `[NOT FOUND IN GROUND TRUTH: Element not in 01-ground-truth/. Run ./brain ingest to sync or record an ADR]`.

---

## 🏷️ Provenance Syntax Standards (`[SRC:...]`)

Every architectural assertion, diagram lifeline, LLD section, and API field must carry an explicit `[SRC:...]` citation:

### PlantUML Sequence (`04-deliverables/sequence-diagrams/*.puml`)
```plantuml
autonumber "<b>[00]</b>"
User -> APIGW: POST /api/v1/orders\n<color:#007acc><b>[SRC:BRD#REQ-01]</b></color>
APIGW -> OrderSvc: CreateOrder(payload)\n<color:#28a745><b>[SRC:DDL:tbl_orders]</b></color>
OrderSvc -> DB: INSERT INTO tbl_orders\n<color:#28a745><b>[SRC:DDL:tbl_orders]</b></color>
```

### Markdown API Contract (`04-deliverables/api-contracts/*.md`)
```markdown
### POST /api/v1/orders
> **Provenance**: `[SRC:BRD#REQ-01]` | `[SRC:DDL:tbl_orders]`

**Headers**:
- `Authorization`: `Bearer <jwt>` `[SRC:CODE:jwt_middleware.go#L18]`

**Body**:
- `customer_id` (string, UUID): Customer identifier `[SRC:DDL:tbl_orders.customer_id]`
- `total_amount` (numeric): Total order charge `[SRC:DDL:tbl_orders.total_amount]`
```

---

## 🛠️ Architecture & Engineering Power Tools

### 1. `/brain-impact <target>`: Level 5 Multi-Hop Blast Radius Analyzer
Constructs an in-memory, zero-dependency Architecture Knowledge Graph (AKG) from Ground Truth, Deliverables, Schemas, and ADRs. Performs deterministic multi-hop reasoning (up to N hops) to evaluate downstream impact before agreeing to any schema change or API modification:
```bash
# Evaluate table blast radius with default 3 hops
./brain impact tbl_orders

# Evaluate column blast radius with custom traversal depth
./brain impact tax_id --hops=4

# Evaluate API route modification
./brain impact /api/v1/orders

# Output complete graph blast radius as JSON for CI/CD gates
./brain impact tbl_orders --json
```
Produces a 5-vector blast radius report covering Database DDL, API backward compatibility, Sequence Diagram impacts, LLD state transitions, and Surrounding Systems risk scores (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

### 2. `/brain-query <query>`: Instant Knowledge Retrieval
Ask analytical questions and receive factual answers grounded strictly in active DDL, API contracts, and sequence diagrams:
```bash
./brain query tbl_orders
./brain query "/api/v1/checkout"
./brain query "Kafka"
```

### 3. `/brain-readiness` (alias: `/brain-eval`): 30-Dimension ARCS Benchmark
Evaluates the repository against 30 critical enterprise engineering and business dimensions across 6 stakeholder roles (Owner, PM, BA, BE, QA, Client):
```bash
./brain readiness
# or JSON output for automation:
node ./bin/readiness.js --json
```
Provides an overall percentage score, letter grade (Grade A+ to F), maturity level certification, and concrete remediation advice for missing checkpoints.

### 4. `/brain-qna`: Stakeholder Q&A & Refinement Matrix
Extracts unconfirmed business rules, unresolved contradictions, and open architectural trade-offs into an interactive refinement matrix in `02-provenance/stakeholder-qna.md` for non-technical Product Owners:
```bash
# Generate refinement questionnaire for Product Owner
./brain qna

# Absorb resolved decisions back into ADRs & Ground Truth
./brain qna --import
```

### 5. `/brain-story <feature>`: Sprint Ticket & FSD Slicer
Transforms verified engineering deliverables into production-ready Jira tickets or Confluence pages:
```bash
./brain story "Create Order flow"
./brain story "/api/v1/orders"
```
Generates standard User Stories (`As a... I want to... So that...`), multi-scenario Gherkin Acceptance Criteria (`Given-When-Then`), API payload snippets, database touchpoints, and sliced PlantUML diagrams with preserved `[SRC:...]` provenance tags.

### 6. `/brain-sync [--diff]`: Living Architecture & Documentation Drift Synchronizer
Keeps Second Brain deliverables permanently aligned with live codebases after upstream developers push changes or after running `git pull`:
```bash
# View-only Architecture Drift & Gap Analysis
./brain sync --diff
# or alias:
./brain diff

# Full automated reconciliation (syncs DDL, APIs, sequences, and audits)
./brain sync
```
Inspects upstream git branches across connected microservices, detects schema delta, highlights missing sequence diagrams, and auto-generates 1-to-1 PlantUML diagrams with 100% provenance tags.

### 7. `./brain convert`: Automated MarkItDown Document Conversion
Automatically converts binary and office documents (PDF specs, Word `.docx`, Excel `.xlsx`, PowerPoint `.pptx`) into clean Markdown files before ingestion:
```bash
./brain convert
```

### 8. `./brain handoff`: Session Continuity & Hot Handover
Generates or updates `02-provenance/session-handoff.md` capturing active priorities, delivery progress, open blockers, and recent changes so subsequent AI agent sessions resume with zero context drift:
```bash
./brain handoff
```

### 9. `./brain hooks` & `./brain test`: Git Pre-Commit Quality Gate & Test Suite
Enforce continuous integrity across your team:
```bash
# Install Git pre-commit hook (runs audit + lint before every commit)
./brain hooks

# Run full verification suite (audit + readiness + lint)
./brain test
```

---

## 🗣️ Universal Natural Language Reflex (Zero-Command Mandate)

Users, engineers, and AI agents are **not required to memorize slash commands or CLI flags**. Second Brain natively understands conversational queries in **any natural language** (English, Indonesian, etc.), automatically mapping intent to the underlying tool:

| Conversational User or Agent Prompt (Examples) | Underlying Intent | Agent Action & Tool |
| :--- | :--- | :--- |
| • *"How ready is our architecture / second brain?"*<br>• *"Check repository readiness"*<br>• *"Berapa skor readiness arsitektur kita?"* | **Architecture Readiness & Completeness** | Run `./brain readiness`. Report ARCS score, Grade, and missing checkpoints. |
| • *"What columns are in table X?"*<br>• *"How does the checkout flow work?"*<br>• *"Apa saja field di tbl_orders?"* | **Zero-Hallucination Query** | Run `./brain query "<term>"`. Provide exact schema fields and line citations. |
| • *"If column X is modified or dropped, what is affected?"*<br>• *"Check blast radius for the payment endpoint"*<br>• *"Analisis dampak CR perubahan skema ini"* | **Blast Radius & CR Impact Analysis** | Trigger `/brain-impact <target>` evaluating schemas, APIs, sequences, and LLDs. |
| • *"Create a Jira user story for the order flow"*<br>• *"Slice this LLD into sprint backlog tickets"*<br>• *"Buatkan user story Jira dan kriteria Gherkin"* | **Jira Story & Gherkin AC Slicing** | Trigger `/brain-story <feature>` to slice deliverables into tickets and Gherkin AC. |
| • *"Are there questions we need to ask the PO?"*<br>• *"Prepare questions for tomorrow's refinement session"*<br>• *"Ada rule bisnis apa saja yang belum jelas?"* | **Stakeholder Q&A Refinement** | Run `./brain qna`. Inspect `02-provenance/stakeholder-qna.md` for open questions. |
| • *"The PO answered the questionnaire, absorb the decisions"*<br>• *"Import refinement answers"*<br>• *"PO sudah jawab, tolong update ADR"* | **Q&A Decision Ingestion** | Run `./brain qna --import`. Absorb answers and update ADRs/business rules. |
| • *"Check if there are broken links or missing tags"*<br>• *"Audit second brain integrity"*<br>• *"Cek apakah semua deliverable punya sitasi valid"* | **Repository Integrity & Audit** | Run `./brain test` (or `./brain audit`). Verify 100% provenance and 0 broken links. |
| • *"Wrapping up for today, save the progress"*<br>• *"Create a session handoff for the next agent"*<br>• *"Catat sesi hari ini untuk handoff"* | **Session Continuity & Hot Handover** | Run `./brain handoff`. Update `02-provenance/session-handoff.md`. |
| • *"What if we explore an alternative architecture option?"*<br>• *"Compare Redis vs DynamoDB for session cache"*<br>• *"Buat cabang skenario arsitektur baru"* | **Constraint Branching** | Trigger `/brain-branch <name>`. Create isolated trade-off scenario in `03-constraint-branches/`. |
| • *"We agreed on scenario A, make it official"*<br>• *"Adopt scenario X as an ADR"*<br>• *"Skenario A disetujui, jadikan ADR resmi"* | **ADR Adoption & Deliverable Sync** | Trigger `/brain-adopt <name>`. Record ADR in `05-adrs/` and sync deliverables. |

---

## 🌐 External Repositories & Living Ground Truth

Second Brain connects directly to live backend and frontend microservices without copying external repositories into this workspace:

### 1. Declarative Configuration (`second-brain.json`)
Create `second-brain.json` (or `.brainrc.json`) in your workspace root:
```json
{
  "name": "My Architecture",
  "sources": {
    "code": [
      "../services/order-service",
      "../services/payment-service",
      "../apps/customer-web"
    ],
    "ddl": [
      "../services/order-service/migrations",
      "../services/payment-service/db"
    ],
    "brd": [
      "../product-specs/core-commerce"
    ]
  }
}
```

### 2. Cross-Functional Team Collaboration & Local Overrides
- **Shared Team Pointers (`second-brain.json`)**: Check in relative repository paths or leave default raw input directories.
- **Personal Local Override (`second-brain.local.json`)**: Team members (architects, engineers, analysts) can define machine-specific workstation paths without polluting git (`second-brain.local.json` is git-ignored):
  ```json
  {
    "sources": {
      "code": ["~/work/backend-repos", "$BACKEND_ROOT/order-service"],
      "ddl": ["~/work/backend-repos/migrations"],
      "brd": ["$DOCS_ROOT/product-specs"]
    }
  }
  ```
- **Portable Relative Citations**: All provenance tags automatically strip machine-specific prefixes (`/Users/username/...`, `C:\Users\...`), compiling into portable repository citations (e.g., `[SRC:CODE:order-service/internal/controller/http/api/v1/order.go#L42]`). Any teammate can read or audit deliverables regardless of local directory layouts.

### 3. Lossless Ground Truth & Zero-Code Clones
- Once ingested, `01-ground-truth/` and `04-deliverables/` are committed to Git.
- Other engineers and AI agents who clone Second Brain **do not need the external backend/frontend repos cloned on their machines** to query, slice stories, or generate deliverables!

---

## 📄 License
MIT © [Ravi Zikrillah](https://github.com/ravizikrillah)

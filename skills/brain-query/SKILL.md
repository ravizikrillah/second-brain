---
name: brain-query
description: Interactive System Analyst knowledge retrieval engine. Query schemas, endpoints, Kafka events, and flow sequences across ground truth, deliverables, and active DDL with exact line citations and provenance.
---

# /brain-query

Execute an interactive, zero-hallucination System Analyst query across the Second Brain:

## 🎯 Purpose
Provide instant, authoritative answers to developer, QA, or product queries regarding database models, API contracts, flow sequences, and cross-service dependencies without digging through dozens of raw files.

## 📋 Execution Protocol

1. **Understand the Query Target**:
   Analyze the user query. Identify the primary subject:
   - **Entity / Data Model**: Table columns, data types, constraints, status enums.
   - **Endpoint / API**: Request/response payloads, validation rules, HTTP status codes.
   - **Flow / Sequence**: Interactions between actors, gateways, microservices, and databases.
   - **Event / Messaging**: Kafka/RabbitMQ topics, payload contracts, publish/subscribe triggers.
   - **Provenance / Traceability**: Origin of a requirement or decision (`[SRC:...]`).

1b. **Fast Retrieval Engine (CLI Execution)**:
   Run `node ./bin/query.js "<term>"` (or `./brain query "<term>"`) to execute instant, token-efficient search across the indexed Ground Truth and Deliverables. Use the returned citations to pinpoint exact files and line numbers.

2. **Search Canonical Truth Sources** (Respecting 5-Tier Precedence):
   - `01-ground-truth/entity-catalog.md` & `00-raw-inputs/db/` (DDL & Schema reality).
   - `01-ground-truth/api-inventory.md` (Part 1 for Internal APIs, Part 2 for Surrounding Systems Catalog) & `04-deliverables/api-contracts/*.md`.
   - `04-deliverables/sequence-diagrams/*.puml` & `04-deliverables/lld/*.md` (Execution flow).
   - `01-ground-truth/domain-glossary.md` (Ubiquitous business language).
   - `05-adrs/` (Architectural decisions and rationale).

3. **Format the Output**:
   Structure the response clearly using this System Analyst format:

   ```markdown
   ### 🔍 Query Summary: [Restatement of user query]

   #### 1. 📌 Direct Answer & Technical Summary
   [Concise, unambiguous summary answering the question directly]

   #### 2. 🗄️ Schema & Entity Reality (Tier 1)
   - **Table/Entity**: `tbl_name`
   - **Relevant Fields**: `column_name` (`DATA_TYPE`, constraints)
   - **State Transitions**: `STATUS_A` -> `STATUS_B` (Trigger: event/API)

   #### 3. 🔌 API & Flow Touchpoints (Internal Microservices)
   - **Endpoint**: `METHOD /api/v1/resource` [SRC:...]
   - **Owning Service**: `<service-name>` (Port `XXX`)
   - **Sequence Step**: Diagram `sample.puml` Step [XX]
   - **Async Events**: Topic `<topic-name>`, Payload: `{ "event_type": "..." }`

   #### 4. 🌐 Surrounding Systems & External IFAs (Integration Boundary)
   - **External Systems Involved**: e.g., Third-party gateway, Core systems
   - **Outbound Calls**: `METHOD /api/...` (Payload fields & SLA timeout)
   - **Inbound Webhooks / Callbacks**: Callback URL & status payload
   - **Fallback / Circuit Breaker**: Queue / error handling policy

   #### 5. 🏷️ Provenance & Citations
   - [file:///path/to/file#L10-L25] (`[SRC:BRD#REQ-XX]`, `[SRC:DDL:tbl_name]`)
   ```

4. **🛑 Mandatory Anti-Bluffing Law (Zero-Hallucination Mandate)**:
   Standard LLM training penalizes "I don't know", tempting models to bluff (OpenAI 2025). In Second Brain, **CONFIDENT BLUFFING IS STRICTLY FORBIDDEN**:
   - If a queried field, endpoint, parameter, or business rule is NOT in `01-ground-truth/`, do NOT extrapolate or guess REST conventions.
   - Explicitly output:
     `[NOT FOUND IN GROUND TRUTH: Element not in 01-ground-truth/. Run /brain-ingest to sync from external source or record an ADR]`.

5. **🧠 Socratic Grilling Reflex (First Brain Stress-Test)**:
   Append the optional structured probing block at the end of the query response:
   - Identify unhandled boundary conditions, race conditions, timeout SLAs, or fallback strategies.
   - Present sharp questions to keep the human architect's First Brain actively engaged.


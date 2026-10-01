---
name: brain-story
description: Slices deliverables into Jira/Confluence-ready User Stories and Functional Specification Documents (FSD) with Gherkin Acceptance Criteria, API payload snippets, and Sequence diagram slices.
---

# /brain-story

Slice Second Brain deliverables into Jira / Confluence-ready developer stories and QA test specifications:

## 🎯 Purpose
Convert authoritative sequence diagrams, API contracts, and database models into actionable sprint tickets for software engineers and QA testers with zero ambiguity and preserved provenance.

## 📋 Execution Protocol

1. **Select the Feature Slice**:
   Parse the feature name or endpoint target from the prompt (e.g. `/brain-story create-order`, `/brain-story /api/v1/orders`).
   Locate relevant artifacts in `04-deliverables/` and `01-ground-truth/`.

1b. **Enterprise SA Pre-Flight Invariant Verification (5 Pillars)**:
   Assert that critical story invariants are established before drafting AC:
   - Component Vector: Explicitly identify whether target is `REUSE`, `UPDATE`, `ENHANCE`, or `NEW`.
   - Concurrency & Idempotency: Deduplication key, race condition handling.
   - Standardized Errors: Domain error codes (`ERR_*` / HTTP 4xx/5xx) mapped to failure scenarios.
   - PII & Data Masking: Masking rules for customer data in request/response.
   - Anti-Slop: Write in active voice without generic AI buzzwords; use exact `backticks` for fields/tables.

2. **Compose the User Story**:
   - **Title**: `[Epic / Module] Story Title`
   - **User Story**:
     - *As a* `[User / Client / Actor]`
     - *I want to* `[Action / Capability]`
     - *So that* `[Measurable Business Value]`

3. **Formulate Gherkin Acceptance Criteria (AC)**:
   Cover both primary happy paths, client errors, and resilience edge cases:
   - **Scenario 1: Successful Execution (Happy Path)**
     - `Given` valid client authentication and valid request payload
     - `When` the user triggers `METHOD /path`
     - `Then` the system returns HTTP `200/201` and persists record in `table_name`
   - **Scenario 2: Validation Failure (Bad Request)**
     - `Given` a missing mandatory field `[field_name]`
     - `When` the user triggers `METHOD /path`
     - `Then` the system returns HTTP `400 Bad Request` with error code `ERR_INVALID_PARAM`
   - **Scenario 3: Business Rule Violation (Conflict / Unprocessable)**
     - `Given` entity is already in state `[INVALID_STATE]`
     - `When` the action is executed
     - `Then` the system returns HTTP `409 Conflict` or `422 Unprocessable Entity`
   - **Scenario 4: Downstream Dependency Failure (Timeout / Resilience)**
     - `Given` 3rd-party service `[Service_X]` is unreachable or times out (> 3000ms)
     - `When` the service invokes the remote dependency
     - `Then` the system executes fallback strategy and returns HTTP `504 / 502`

4. **Attach Technical Implementation Specifications**:
   - **Endpoint**: `METHOD /api/v1/...`
   - **Headers**: Required authorization headers and tracing tokens
   - **Request Payload**: Concrete JSON snippet with inline types
   - **Success Response**: Concrete JSON snippet
   - **Database Impact**: Table name, columns modified, lock mechanism
   - **Kafka / Async Events**: Topic, event name, key, payload schema
   - **🌐 Surrounding Systems Integration**:
     - External systems called (e.g. CO SOM, ESB, UPP, DSC)
     - Outbound endpoint & payload fields required by external IFA
     - Webhook callbacks listened for
     - Timeout SLA, Circuit Breaker, and Fallout recovery queue behavior

5. **Extract Sequence Diagram Slice**:
   Extract a lightweight, self-contained PlantUML sequence block directly focused on this story for inclusion in the Jira/Confluence ticket description.

6. **Preserve Provenance**:
   Include a **Provenance Footnote** with exact citations `[SRC:...]` pointing to the BRD, DDL, and ADRs.

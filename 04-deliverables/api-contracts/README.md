# 🔌 API Contracts (`04-deliverables/api-contracts/`)

This directory contains authoritative Markdown API specifications and Interface Agreements (IFAs) for REST HTTP endpoints and gRPC protocol buffers.

---

## 📏 Mandatory Contract Standards

1. **Boundary & Direction Tagging**:
   Every contract file must declare its boundary type in the metadata header:
   - `Type: [INTERNAL MICROSERVICE API]`: Owned, implemented, and hosted by our microservices.
   - `Type: [EXTERNAL SURROUNDING SYSTEM IFA]`: External integration where our services call outbound clients or receive incoming webhooks.

2. **Integration Specifications (for Surrounding System IFAs)**:
   External contracts must explicitly document:
   - Outbound client request payload format.
   - Timeout SLA (e.g. `timeout: 3000ms`).
   - Retry / Circuit Breaker policy.
   - Asynchronous fallout queue or recovery playbook trigger.

3. **Exhaustive Schema & Field Provenance**:
   - Header parameters (e.g. `Authorization`, `x-channel`, `x-transaction-id`).
   - Query parameters with types and mandatory/optional flags.
   - Request and Response JSON schemas with field-level inline provenance tags:
     ```markdown
     - `order_id` (string, required) - Unique order identifier `[SRC:DDL:tbl_orders.id]`
     - `amount` (number, required) - Final payable amount with tax `[SRC:BRD#REQ-04]`
     ```
   - Complete HTTP status codes: `200/201 Success`, `400 Bad Request`, `401 Unauthorized`, `409 Conflict`, `500 Internal Error`, `504 Gateway Timeout`.

---

## ⚡ Generation & Audit

- Generated via `/brain-deliver`.
- Audited via `npm run audit` (ensures 100% endpoint and field provenance coverage).
- Used by `/brain-story` to generate Jira stories with Gherkin Acceptance Criteria.

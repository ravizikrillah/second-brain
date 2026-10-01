---
name: brain-impact
description: Change Request (CR) and Blast Radius Analyzer. Evaluates the downstream impact of modifying a table column, endpoint contract, Kafka event, or business rule across all deliverables.
---

# /brain-impact

Evaluate the blast radius and downstream impact of a Change Request (CR) or requirement modification:

## 🎯 Purpose
Provide System Analysts with an automated impact matrix showing which database schemas, API contracts, sequence diagrams, LLDs, and surrounding systems are affected when a change is proposed.

## 📋 Execution Protocol

1. **Identify the Proposed Change**:
   Parse the target element from the user's prompt (e.g. `/brain-impact add tax_id column to tbl_orders`, `/brain-impact deprecate payment_channel in /v1/checkout`).
   - **Target Type**: Database Column / Table, API Parameter / Route, State Machine Transition, Kafka Event Schema, or External Dependency.
   - **Change Category**: NEW (Additive), UPDATE (Modifying existing behavior), or BREAKING (Removing/renaming fields, strict validation).

2. **Inspect Downstream Blast Radius**:
   Evaluate 5 critical architectural vectors:
   - **Vector 1: Database & DDL (`00-raw-inputs/db/`, `01-ground-truth/entity-catalog.md`)**:
     - Does it require `ALTER TABLE`? Nullable or `NOT NULL DEFAULT`?
     - Index and table-locking implications on large production tables.
     - Historical data backfill requirement.
   - **Vector 2: API Contracts (`04-deliverables/api-contracts/*.md`)**:
     - Is the contract change backward-compatible?
     - Request body, query param, or response body changes.
     - New validation rules (e.g., regex, min/max length).
   - **Vector 3: Sequence Diagrams (`04-deliverables/sequence-diagrams/*.puml`)**:
     - Which message arrows or participants must be modified?
     - Are new fallback / error branches (`alt / else`) needed?
   - **Vector 4: Low-Level Designs & Ground Truth (`04-deliverables/lld/`, `01-ground-truth/`)**:
     - State machine transition adjustments.
     - Business logic and domain glossary synchronization.
   - **Vector 5: Surrounding Systems & Integration Points (`01-ground-truth/api-inventory.md#part-2`)**:
     - Upstream clients (Frontend Web, Mobile iOS/Android, Partner API).
     - External Surrounding Systems: Does this CR modify outbound payloads to Payment Gateways, SSO Identity Providers, CRMs, or Third-Party APIs? Does it break incoming webhook callback contracts or necessitate new fallout recovery playbooks?
     - Downstream consumers (Kafka subscribers, Webhook listeners, Batch ETL).

3. **Calculate Risk Assessment Level**:
   - 🔴 **CRITICAL**: Breaking API changes, deleted columns, incompatible data types, state machine rewrites.
   - 🟠 **HIGH**: Mandatory new request parameters, changed external integration contracts, synchronous latency overhead.
   - 🟡 **MEDIUM**: Optional fields, additive backward-compatible schema changes, new asynchronous event topics.
   - 🟢 **LOW**: Internal refactor, documentation updates, non-functional cosmetic changes.

4. **Generate the Blast Radius Report**:
   Output the analysis in standard System Analyst markdown:

   ```markdown
   # 💥 Change Request Impact Analysis: [CR Title]

   **Target Subject**: `[table.column / API endpoint / Event]`
   **Risk Level**: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW
   **Change Nature**: [Additive / Modifying / Breaking]

   ---

   ## 📊 Blast Radius Summary Table
   | Layer / Artifact | Affected File | Impact Description | Action Required |
   | :--- | :--- | :--- | :--- |
   | **Database DDL** | `00-raw-inputs/db/migration.sql` | Add column `tax_id` NULLABLE | Generate migration script |
   | **API Contract** | `04-deliverables/api-contracts/order.md` | Add `tax_id` in response | Update API contract schema |
   | **Sequence Flow** | `04-deliverables/sequence-diagrams/order.puml` | Pass `tax_id` to Tax Svc | Add sequence diagram message |
   | **Consumers** | Frontend Apps / Kafka | Consumes new `tax_id` field | Verify backward compatibility |

   ---

   ## 🛠️ Required Technical Actions
   1. **Schema Migration**:
      - SQL: `ALTER TABLE tbl_orders ADD COLUMN tax_id VARCHAR(64) NULL;`
      - Rollback SQL: `ALTER TABLE tbl_orders DROP COLUMN tax_id;`
   2. **API Backward Compatibility**:
      - Treat as optional for existing clients to prevent contract breakage.
   3. **Deliverable Updates**:
      - Run `/brain-deliver` after updating ground truth to reflect the changes with updated `[SRC:...]` tags.
   ```

# 📊 Sequence Diagrams (`04-deliverables/sequence-diagrams/`)

This directory contains production PlantUML (`.puml`) sequence diagrams modeling technical execution flows, API handshakes, asynchronous queues, and database persistence.

---

## 📏 Mandatory Diagram Standards

1. **Strict Architectural Partitioning**:
   - **Internal Microservices** must be grouped inside:
     ```plantuml
     box "Internal Core Services" #AliceBlue
       participant "API Gateway" as APIGW
       participant "Order Service" as OrderSvc
     end box
     ```
   - **External Surrounding Systems** must be grouped inside:
     ```plantuml
     box "External Surrounding Systems" #LightYellow
       participant "Identity Provider (IDP)" as IDP <<External System>>
       participant "Payment Gateway Platform" as PaymentGW <<External System>>
     end box
     ```
   - Outbound client calls (`OrderSvc -> PaymentGW: ProcessPayment`) must be clearly distinguished from inbound webhook callbacks (`PaymentGW -> CallbackSvc: PaymentWebhook`).

2. **Autonumbering & Skinparam**:
   - Every diagram must use strict UML styling and bold step numbering:
     ```plantuml
     @startuml
     skinparam style strictuml
     skinparam BoxPadding 10
     autonumber "<b>[00]</b>"
     ```

3. **100% Provenance Citations**:
   - Every request arrow and response return MUST include an inline citation:
     - BRD requirements: `<color:#007acc><b>[SRC:BRD#REQ-01]</b></color>`
     - Database persistence: `<color:#28a745><b>[SRC:DDL:tbl_orders]</b></color>`
     - Code implementations: `[SRC:CODE:order_router.go#L45]`

4. **Resilience & Alternative Paths**:
   - Diagrams must not only show the happy path. All failure states, timeouts, and fallbacks must be modeled in `alt / else / group` blocks.

---

## ⚡ Generation & Audit

- Generated via `/brain-deliver`.
- Audited via `npm run audit` (ensures 100% arrow provenance coverage).
- Visualized using any PlantUML viewer, VS Code PlantUML extension, or CI renderer.

# ⚙️ Universal Backend Code to PlantUML Extractor

This specification defines the exhaustive reverse-engineering standard for extracting backend source code and API definitions (Go, TypeScript/Node.js, Python, Java/Kotlin, Rust, gRPC Protobuf, OpenAPI) into detailed PlantUML sequence diagrams (`.puml`).

Used by `/brain-ingest` and `/brain-deliver` to ensure production-grade depth.

---

## 📐 1. Mandatory Exhaustive Depth (Zero Superficial Summaries)

The agent **MUST NEVER** produce high-level trivial summaries. A production-grade sequence diagram extracted from code must trace the complete execution chain across 5 layers:

1. **Ingress & Controller Layer**:
   - HTTP routes, gRPC RPC methods, and GraphQL queries/mutations.
   - URL path parameters, query parameters, and DTO request body structs.
   - Authentication and context headers (`Authorization Bearer`, `X-User-Id`, `X-Tenant-Id`, `X-Correlation-Id`).
2. **Usecase & Business Logic Layer**:
   - Complete domain flow (token decryption/validation, permission checks, state machine transitions, quota/rate-limit checks, feature flags).
   - All explicit branch conditions (`alt / else / loop`).
3. **Persistence & Infrastructure Layer**:
   - RDBMS operations (SELECT, INSERT, UPDATE, DELETE, transactions).
   - In-memory cache operations (Cache GET, SET, TTL, distributed mutex locks).
   - Message Broker publishing and consumer triggers (Kafka, RabbitMQ, AWS SQS, Google PubSub).
4. **External Surrounding Systems & Third-Party APIs**:
   - Outbound HTTP/gRPC client calls (Payment Gateways, ERPs, CRM, Identity Providers, SaaS webhooks).
5. **Error & Fallback Branches**:
   - Explicit handling for validation failures, authorization denials (`401/403`), timeouts (`504`), not found (`404`), and downstream failure circuit breakers.

---

## 🏢 2. Dynamic Service & Participant Discovery

Instead of relying on hardcoded service names, dynamically inspect the target codebase and establish clean participant mappings:

1. **Identify Internal System Boundaries**:
   - In a **Microservices / Monorepo** project (e.g. `services/*`, `apps/*`, `service-*`): Map each service to a participant within `box "[System / Platform Name]" #DBEEF3`.
   - In a **Modular Monolith** project (e.g. `pkg/*`, `internal/domain/*`, `modules/*`): Map key domain modules to distinct participants.
   - **Shared Infrastructure**:
     - `database "**Database**" as db` (or specific engine: MySQL, PostgreSQL, MongoDB).
     - `database "**Cache**" as cache` (Redis, Memcached).
     - `queue "**Message Broker**" as mq` (Kafka, RabbitMQ, SQS).
2. **Identify External Surrounding Systems**:
   - Any external service, vendor API, or upstream/downstream platform accessed over the network that is **outside the system's codebase** is declared as an external participant **outside the box boundary**.

---

## 🎨 3. Header & Styling Standard

Every extracted `.puml` diagram MUST follow the universal standard:

```plantuml
@startuml [diagram_slug]
/' Auto-Generated from Codebase by Second Brain System '/
!theme plain
skinparam defaultFontName SansSerif
skinparam fontName SansSerif
skinparam TitleFontName SansSerif
skinparam FooterFontName SansSerif
skinparam minClassWidth 90
skinparam ActorFontStyle bold
skinparam DatabaseFontStyle bold
skinparam ParticipantFontStyle bold
skinparam QueueFontStyle bold
skinparam SequenceGroupBodyBackgroundColor transparent
skinparam SequenceGroupHeaderBackgroundColor transparent
hide unlinked

autonumber

title [MODULE_NAME] - [FLOW_NAME]

box "[System / Core Platform Name]" #DBEEF3
    participant "**Frontend** \n **Client**" as f
    participant "**API** \n **Gateway**" as gw
    participant "**[Domain]** \n **Service**" as svc
    database "**Database**" as db
    database "**Cache**" as cache
    queue "**Broker**" as mq
end box

' External Surrounding Systems (Outside Core Boundary)
participant "**[Third-Party Service]**" as ext

...

@enduml
```

### Feature Enhancement Convention:
Highlight new or sprint-specific modifications with a peach-colored group:
```plantuml
group #F8D4AF ENHANCEMENT [Feature: Description / Ticket]
    svc -> db : SELECT ... WHERE is_active = true
    db --> svc : result records
end
```

---

## 🛠️ 4. Post-Extraction Quality Verification

After generating or updating `.puml` diagrams:
1. Ensure all open tags (`@startuml`, `box`, `alt`, `group`) have matching closures (`@enduml`, `end box`, `end`).
2. Verify all `activate` directives have matching `deactivate` directives.
3. Validate that success responses use `#DDF4DD` and error conditions use `#FFCCCC`.
4. Ensure internal components stay inside `box #DBEEF3` and external systems stay outside.

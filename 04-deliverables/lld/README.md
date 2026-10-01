# 📐 Low-Level Design Documents (`04-deliverables/lld/`)

This directory contains Low-Level Design (LLD) documents providing deep implementation blueprints for backend microservices, caching strategies, and data persistence.

---

## 🏛️ The 3-Pillar LLD Standard

Every LLD document in this directory must strictly implement the authoritative 3-pillar layout:

### Pillar 1: Architectural Context
- High-level topology diagram and component boundaries.
- Network routing from Client -> API Gateway -> BFF -> Backend Microservices.
- Security boundary (JWT verification, RBAC permissions, HMAC signatures).

### Pillar 2: Technical Flow & Validation Sequence
- Step-by-step algorithmic execution logic for each operation.
- Input validation order (schema check, business eligibility, idempotency token).
- Exception handling, rollback procedures, and circuit breaker tripping conditions.

### Pillar 3: Data Model, Specifications & Asynchronous Events
- Database persistence details: Tables touched, read/write patterns, isolation levels, row-level locking.
- Caching architecture: Redis key patterns, TTL duration, eviction policies, and cache-aside hydration.
- Asynchronous messaging: Message broker topics (Kafka / RabbitMQ), exchange bindings, dead-letter exchanges (DLX), and message payloads.

---

## ⚡ Generation & Audit

- Generated via `/brain-deliver`.
- Referenced during sprint technical refinement and code reviews.
- Audited against Ground Truth schemas to guarantee zero architectural drift.

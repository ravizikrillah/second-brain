---
name: brain-readiness
description: Benchmark the repository against 30 critical enterprise engineering & business dimensions across 6 stakeholder roles with the Architecture Readiness & Completeness Score (ARCS).
---

# /brain-readiness (alias: /brain-eval)

Run the Architecture Readiness & Completeness Score (ARCS) benchmark across the Second Brain repository:

1. Execute `node ./bin/readiness.js` (or `./brain readiness`, `npm run readiness`, `./brain eval`).
2. Evaluate 30 standardized enterprise architecture dimensions across 6 stakeholder roles:
   - **Executive Sponsor / Owner (2)**: Domain Purpose (`OWN-01`), Ownership & Accountabilities (`OWN-02`)
   - **Product Manager (5)**: Scope Boundaries (`PM-01`), Architectural Decisions & ADRs (`PM-02`), Delivery State & Session Continuity (`PM-03`), Risk Registry & Hard Blocks (`PM-04`), Security & Multi-Tenancy (`PM-05`)
   - **Business Analyst (5)**: Actor Catalog & RBAC (`BA-01`), End-to-End Business Sequences (`BA-02`), Validation Rules & Invariants (`BA-03`), Domain Glossary (`BA-04`), Architectural Hypotheses (`BA-05`)
   - **Backend Engineer & Integration Architect (8)**: Microservice Boundaries (`BE-01`), Database DDL & Schema Integrity (`BE-02`), Interface Agreements & API Contracts (`BE-03`), Non-Functional SLAs & Latency (`BE-04`), Asynchronous Messaging & Event Bus (`BE-05`), Distributed Caching Topology (`BE-06`), API Gateway & Ingress Routing (`BE-07`), High Availability & Deployment Topology (`BE-08`)
   - **QA & Reliability Engineer (5)**: Failure Modes & Recovery Playbooks (`QA-01`), Boundary Scenarios (`QA-02`), Acceptance Criteria & Traceability Matrix (`QA-03`), Service Health Probes (`QA-04`), Distributed Tracing & Request ID (`QA-05`)
   - **Enterprise Client & Data Security Custodian (5)**: Authoritative Datasets & Lineage (`CLI-01`), PII Protection & Password Hashing (`CLI-02`), Audit Trail Logging (`CLI-03`), Master Lookup Datasets & Seed Data (`CLI-04`), Data Retention & Inactive Account Purge (`CLI-05`)
3. Compute the **Overall Architecture Readiness Index (0 - 100%)** and Grade (`A+` >= 95%, `A` >= 90%, `B` >= 80%, `C` >= 70%, `F` < 70%).
4. Report the 8-Pillar Architecture Breakdown:
   - Stakeholder Capability
   - Governance & Anti-Gaslighting
   - Behavioral Flows
   - Interface & IFA
   - Data Architecture
   - Infrastructure & Platform
   - Operational & Reliability
   - Security & Compliance
5. Highlight any missing dimensions or partial coverages with actionable remediation guidance.

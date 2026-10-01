# 0004. IFA Disambiguation and Surrounding Systems Catalog Standard

In enterprise microservice architectures, technical requirements and repository configurations frequently reference both internal endpoints and external enterprise systems under the generic term "Interface Agreement" (IFA). A naive ingestion engine often mistakes outbound HTTP client targets (such as Payment Gateways, Enterprise Identity Providers, CRMs, and partner APIs) for endpoints hosted and exposed by the internal microservice itself, polluting internal API registries and corrupting sequence diagrams.

We establish a deterministic IFA Disambiguation standard separating contracts into two immutable categories:
1. **Part 1: Internal Microservice APIs (Owned / Inbound)**: Services implemented directly in the repository (`repo/backend/*`), where traffic flows inbound from Frontend, APIGW, or peer internal services to Go HTTP controllers and gRPC servers.
2. **Part 2: External Surrounding Systems Catalog (Outbound Consumed / Inbound Webhooks)**: Enterprise core services outside repository boundaries where our services act as outbound clients or expose callback listeners for asynchronous webhooks.

We introduce `bin/ingest-apis.js` to deterministically parse and classify both layers with 100% provenance citations `[SRC:...]`, and enforce that PlantUML sequence diagrams visually isolate external participants into dedicated surrounding system boxes.

# API & Service Inventory: Ground Truth

> **Canonical System Truth (Tier 1 Polyglot Code, Protobuf Specs, YAML Configs, & Tier 2 IFAs)**  
> Authoritative, disambiguated registry strictly separating **Internal Microservice APIs** from **External Surrounding Systems**.

---

## 🏛️ System Boundary & IFA Classification Architecture

To eliminate ambiguity across deliverables, the Second Brain enforces strict taxonomy between internal and external contracts:

1. **🔌 Internal Microservice APIs (Owned / Inbound)**:
   - **Provider / Host**: Polyglot microservices implemented directly inside this repository (`repo/backend/*`, `repo/ai/*`, etc.).
   - **Supported Runtimes**: Golang (Gin/Echo/Chi), Python (FastAPI/Flask), Node.js (Express/NestJS), Java (Spring Boot), gRPC Protobuf.
   - **Consumer**: Frontend Web, Mobile Clients, KrakenD API Gateway, or internal peer services.
   - **Traffic Flow**: Inbound to our services (we host the HTTP router / gRPC server).
   - **Contract Type**: Internal-for-Internal / BFF-to-Backend Interface Agreement.

2. **🌐 External Surrounding Systems (Outbound / Integrations / Third-Party IFAs)**:
   - **Provider / Host**: External enterprise systems, vendor platforms, or partner gateways.
   - **Consumer**: Our internal microservices act as **Clients** calling outbound APIs, OR our services expose dedicated callback listeners for asynchronous inbound webhooks.
   - **Traffic Flow**: Outbound client calls (e.g. to Payment Gateways, Enterprise Identity Providers, CRMs) + Asynchronous webhook callbacks.
   - **Contract Type**: Enterprise Surrounding System Interface Agreement (subject to external SLAs, circuit breakers, and fallout recovery).

---

## 🔌 Part 1: Internal Microservice APIs (Owned Services & Endpoints)

### 1.1 Microservice Topology & Port Allocations

| Microservice Name | Runtime Engine | HTTP Port | gRPC Port | Primary Persistence | Core Responsibility | Source Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

### 1.2 Active Internal Endpoints Registry (HTTP / REST)

### 1.3 Internal gRPC Microservice RPC Contracts

Authoritative RPC contracts compiled from production Protocol Buffers (`.proto`) defining inter-service interfaces:

### 1.5 Core Data Transfer Objects (DTO Request/Response Models)

Structured data models extracted from Go structs and Python Pydantic models for authoritative contract generation:

---

## 🌐 Part 2: External Surrounding Systems Catalog (Outbound IFAs & Webhooks)

### 2.1 Surrounding Systems Master Catalog

| System Code | System Name | Integration Role | Traffic Direction | Transport Protocol | Ownership Boundary | Authoritative Source Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

### 2.2 External Endpoints & Integration Operations


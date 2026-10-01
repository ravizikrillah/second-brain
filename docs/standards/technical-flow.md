# 🔄 Universal Technical Flow & Surrounding Systems Generator

This specification governs the generation of concise **Technical Flows** and the identification of **Surrounding Systems** within Second Brain deliverables (`/brain-deliver` and `/brain-story`).

---

## 🎯 Expected Output Format

The output MUST strictly adhere to this format:

```text
[Feature / Flow Name]

1. Frontend Client -> API Gateway
    GET /api/v1/orders
2. API Gateway -> Order Service
    GET /api/v1/orders
3. (If payment required)
    Order Service -> Payment Gateway
    POST /v1/charges

Surrounding:

1. Payment Gateway
```

---

## 📜 Rules & Guidelines

### 1. Only Include System-to-System Communication
Extract ONLY communication crossing system/process boundaries:
- Frontend / Client Application
- API Gateway / Reverse Proxy / Ingress
- Internal Microservices / Backend Application Services
- External Surrounding Systems / Third-Party APIs

**STRICTLY EXCLUDE:**
- User -> Frontend interactions (e.g. `User clicks button`)
- Frontend internal UI processing / state updates
- Backend internal method calls / mapping / validation
- Informational notes / comments
- Response payload contents
- Internal business logic that does not cross service boundaries

### 2. Database, Cache & Logging Must NEVER Be Included
Ignore ALL interactions involving:
- Databases (MySQL, PostgreSQL, MongoDB, DynamoDB, Oracle, etc.)
- In-memory Caches (Redis, Memcached, Hazelcast)
- Database queries (SELECT, INSERT, UPDATE, DELETE)
- Cache operations (GET, SET, DEL, EXPIRE)
- Process logging & telemetry reporting

*Sequence Counting Rules (Story Sizing):*
- Regular DB queries and logging do **NOT** count as sequence steps.
- Message Broker pub/sub (Kafka, RabbitMQ, SQS) **counts as 1 Sequence**.
- External Object Storage calls (AWS S3, MinIO, GCS) **count as 1 Sequence**.
- API calls count ONLY on the *Request*; the *Response* does **NOT** count as a separate sequence.

### 3. Frontend -> API Gateway
Include API requests from the Client / Frontend to the API Gateway.
- Use the exact HTTP method and endpoint path.
```text
1. Frontend Client -> API Gateway
    GET /api/v1/user/profile
```

### 4. API Gateway -> Backend Service
Include requests forwarded from the API Gateway to internal backend services.
```text
2. API Gateway -> User Service
    GET /api/v1/user/profile
```

### 5. Surrounding Systems Definition & Categorization
Any participant, vendor, or platform **outside the core system/application boundary** is categorized as a **Surrounding System**:

*Typical Surrounding Systems:*
- External Payment Gateways (Stripe, PayPal, Midtrans, etc.)
- Third-Party Identity Providers (Auth0, Okta, Firebase Auth)
- Notification Providers (Twilio, SendGrid, FCM, Slack Webhook)
- External Enterprise Systems (ERP, CRM, Upstream/Downstream Legacy Platforms)
- Partner APIs & SaaS integrations

*NEVER Categorize as Surrounding:*
- Frontend / Client Applications
- API Gateway / Ingress
- Internal backend services and microservices owned by the application
- Databases and In-memory caches

### 6. Surrounding API Calls
Include outbound calls from internal services to Surrounding Systems:
```text
3. (If credit check required)
    Order Service -> Credit Scoring API
    POST /v1/score
```

### 7. Conditional / IF Flow Format
If communication occurs within an `alt`, `else`, or `loop` block, embed the condition directly in parentheses `(If ...)` on the same step:

*Correct:*
```text
3. (If order status is PENDING)
    Order Service -> Payment Gateway
    POST /v1/charges
```

### 8. Surrounding List
At the end of each flow, list each distinct Surrounding System that was **actually called**:

```text
Surrounding:

1. Payment Gateway
2. Email Service Provider
```

If no external Surrounding System is invoked:
```text
Surrounding:

- None
```

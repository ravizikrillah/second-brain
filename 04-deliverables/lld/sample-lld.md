# Low-Level Design (LLD): Order Management Service

## 1. Architectural Context
Integrates incoming checkout requests through API Gateway down to the persistence layer.

## 2. Technical Flow
1. Validates JWT claims.
2. Inserts pending record into `tbl_orders`.
3. Dispatches order placed event.

## 3. Data Model & Specifications
Backed by Postgres `tbl_orders` with optimistic concurrency.

# API Contract: Order Management

### POST /api/v1/orders
> **Provenance**: `[SRC:BRD#REQ-01]` | `[SRC:DDL:tbl_orders]`

#### Request Headers
- `Authorization`: `Bearer <jwt>` (required) `[SRC:CODE:jwt_middleware.go#L18]`
- `Content-Type`: `application/json` `[SRC:STANDARDS:rest-guideline]`

#### Request Body
```json
{
  "customer_id": "usr_99812",
  "total_amount": 150000
}
```

#### Response (201 Created)
```json
{
  "order_id": "ord_12345",
  "status": "PENDING_PAYMENT"
}
```

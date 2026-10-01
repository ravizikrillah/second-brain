# Scenario Template: [Scenario Title]

## 1. Constraint Description
Describe the technical, operational, or budgetary constraint (e.g., Latency < 50ms, No Redis Cache, Offline-First Sync, Frozen Legacy DB).

## 2. Impacted Components
List the services, database tables, and API contracts affected:
- **Internal Services**: [e.g., `order-service`, `payment-service`]
- **Database Tables / Collections**: [e.g., `tbl_orders`, `journey_logs`]
- **API Endpoints / Contracts**: [e.g., `POST /api/v1/orders`, `GET /api/v1/sync/status`]
- **External Surrounding Systems / IFA**: [e.g., Payment Gateway, Auth Provider, Notification Engine]

## 3. Architectural Trade-offs
| Option | Pros | Cons | Estimated Latency / Cost / Complexity |
| :--- | :--- | :--- | :--- |

## 4. Proposed Solution & Delta
Detail the architectural modifications required if this constraint is adopted (delta against canonical Ground Truth).

## 5. Cross-Branch Correlations & Obsolescence Analysis
Audit against all existing scenarios in `03-constraint-branches/` and active Ground Truth:
- **🗑️ Obsolete & Redundant Components (Rendered Obsolete)**:
  - Components, endpoints, database tables, background workers, or parts of earlier branches rendered unnecessary or obsolete if this scenario is adopted.
- **⚔️ Conflicts & Mutual Exclusions**:
  - Scenarios or constraints in `03-constraint-branches/` that clash or cannot co-exist with this proposal.
- **🤝 Synergies & Shared Components**:
  - Shared schemas, services, or contracts overlapping with other active scenarios that can be reused.
- **🔗 Dependency & Sequencing Chain**:
  - Prerequisite branches that must be adopted first, or downstream branches unblocked by this.

### Cross-Branch Correlation Matrix
| Related Scenario / Component | Relationship Type | Details & Impact | Rendered Obsolete / Deprecated Parts |
| :--- | :--- | :--- | :--- |
| `scenario-<other>.md` | `[OBSOLETES / CONFLICTS / SYNERGY / DEPENDS]` | [Impact summary] | [Specific parts rendered unnecessary] |

## 6. Adoption Status
Status: [PROPOSED | EVALUATING | ADOPTED | REJECTED]

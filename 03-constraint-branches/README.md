# 🌿 Zone 3: Constraint Branches (Isolated Scenario Explorations)

Welcome to the **Constraint Branches** zone. This directory provides an isolated sandbox to evaluate speculative technical, budgetary, or operational constraints without polluting canonical Ground Truth or production deliverables.

---

## 🎯 Purpose & Sandbox Isolation

Architectural changes often come with major trade-offs (e.g. migrating from PostgreSQL to DynamoDB, operating in an offline-first environment, replacing an external payment gateway, or capping network latency). 

Instead of polluting production deliverables with unconfirmed assumptions:
1. Scenarios are explored in isolated markdown files inside this directory (`scenario-<name>.md`).
2. Ground Truth (`01-ground-truth/`) and Deliverables (`04-deliverables/`) remain untouched until formal adoption.
3. Every scenario evaluation documents explicit trade-offs, impacted components, and cost/latency deltas.
4. **Cross-Branch Awareness**: Every scenario actively audits all other scenarios in this directory to identify obsolete components, conflicting assumptions, and synergies.

---

## 📄 Scenario Structure (`scenario-template.md`)

Each scenario document follows the standardized template:
- **1. Constraint Description**: Details the technical, regulatory, or operational constraint.
- **2. Impacted Components**: Lists affected microservices, database schemas, and API contracts.
- **3. Architectural Trade-offs**: Evaluation matrix comparing options (Pros, Cons, Latency, Cost, Operational Burden).
- **4. Proposed Solution & Delta**: Exact architectural modifications required if adopted.
- **5. Cross-Branch Correlations & Obsolescence Analysis**:
  - **🗑️ Redundancies & Obsolete Parts**: Components, endpoints, tables, or background jobs rendered unnecessary if this scenario is adopted.
  - **⚔️ Conflicts & Mutual Exclusions**: Incompatible constraints or assumptions across other scenarios.
  - **🤝 Synergies & Reusability**: Shared schemas, services, or contracts overlapping with other active scenarios.
  - **🔗 Dependency Chain**: Prerequisites and sequencing.
- **6. Adoption Status**: Lifecycle state: `[PROPOSED | EVALUATING | ADOPTED | REJECTED]`.

---

## ⚡ Orchestrator Commands

### 1. Create / Evaluate a Branch
```text
/brain-branch <scenario-name>
```
*Example:* `/brain-branch no-redis` or `/brain-branch offline-pos`  
Scaffolds or updates `03-constraint-branches/scenario-<scenario-name>.md`, audits all existing branches, and immediately informs the user of cross-branch impacts, redundancies, and obsolete parts.

### 2. Formally Adopt a Scenario
```text
/brain-adopt <scenario-name>
```
*What happens:*
- An immutable Architectural Decision Record (ADR) is generated in `05-adrs/`.
- Scenario status is marked as `ADOPTED`.
- Triggers `/brain-deliver` to propagate the changes cleanly into `01-ground-truth/` and `04-deliverables/`.

### 3. Reject a Scenario
If a scenario is evaluated and discarded, change its status to `REJECTED` and document the justification. It remains permanently in this folder as historical rationale so the team does not re-litigate the same idea.

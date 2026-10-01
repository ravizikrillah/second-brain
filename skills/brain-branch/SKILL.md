---
name: brain-branch
description: Create and evaluate isolated architectural constraint scenarios in 03-constraint-branches/scenario-{name}.md with cross-branch correlation, obsolescence detection, and trade-off analysis.
---

# /brain-branch <name>

Explore an architectural "What-If" scenario or brainstorm speculative constraints without polluting canonical Ground Truth or production deliverables.

---

## 🧭 Core Workflow

### 1. Multi-Branch Discovery & Ingestion
Before drafting the scenario, the agent MUST:
1. Scan `03-constraint-branches/` to discover all existing scenarios (`scenario-*.md` excluding `scenario-template.md`).
2. Read the constraint descriptions, impacted components, and statuses (`[PROPOSED]`, `[EVALUATING]`, `[ADOPTED]`, `[REJECTED]`) of all existing branches.
3. Review canonical Ground Truth in `01-ground-truth/` (`api-inventory.md`, `entity-catalog.md`, `business-rules.md`).
4. Optionally run `node ./bin/branch.js <name>` to execute deterministic cross-branch correlation scanning.

---

### 2. Cross-Branch Correlation & Obsolescence Analysis
Audit the new/updated scenario against all existing branches and Ground Truth across 4 key dimensions:

1. **🗑️ Obsolete & Redundant Components (Rendered Obsolete)**:
   - Identify existing APIs, database tables/columns, workers, or mechanisms from earlier scenarios or Ground Truth that become unnecessary, obsolete, or can be eliminated if this scenario is implemented.
   - *Example:* "If `scenario-event-driven` is adopted, the polling endpoint `/api/v1/sync/status` and cron worker in `scenario-batch-sync` are rendered obsolete."
2. **⚔️ Conflicts & Mutual Exclusions**:
   - Detect contradictory assumptions or mutually exclusive architectural patterns.
   - *Example:* "Clashes with `scenario-no-redis` because this scenario assumes an in-memory Redis cluster for session caching."
3. **🤝 Synergies & Overlapping Components**:
   - Highlight shared microservices, schemas, or surrounding IFA contracts that can be reused across scenarios.
   - *Example:* "Both this scenario and `scenario-payment-v2` modify `tbl_orders` and require new error handling on UPP."
4. **🔗 Dependency & Sequencing Chain**:
   - Determine if this scenario requires another scenario to be adopted first, or if it unblocks downstream branches.

---

### 3. Immediate Proactive Feedback to User
In the conversational response, the agent MUST immediately inform the user with a structured analysis section:

```markdown
### 🧠 Cross-Branch Impact & Correlation Intelligence

| Existing Scenario | Status | Relationship Type | Details & Component Impact | Rendered Obsolete / Deprecations |
| :--- | :--- | :--- | :--- | :--- |
| `scenario-<name>.md` | `[PROPOSED]` | `[OBSOLETES / CONFLICTS / SYNERGY / DEPENDS]` | [Impact summary on components] | [Parts rendered unnecessary or bypassed] |

#### 💡 Key Takeaways:
- 🗑️ **Rendered Obsolete / Redundant Components:**
  - [Details on what can be deleted or bypassed if this scenario is adopted]
- ⚔️ **Potential Conflicts & Clashes:**
  - [Contradictions with other scenarios, if any]
- 🤝 **Synergies & Reusability:**
  - [Shared components or contracts]
```

---

### 4. Scenario Persistence
1. Create or update `03-constraint-branches/scenario-<name>.md` following `03-constraint-branches/scenario-template.md`:
   - **Section 1**: Constraint Description (technical, operational, or budgetary).
   - **Section 2**: Impacted Components (Internal Services, DB Tables, API Contracts, Surrounding IFA).
   - **Section 3**: Architectural Trade-offs Matrix (Pros vs Cons vs Latency/Cost/Complexity).
   - **Section 4**: Proposed Solution & Delta against Ground Truth baseline.
   - **Section 5**: Cross-Branch Correlations & Obsolescence Analysis (documenting obsolete parts, conflicts, synergies, and dependency chain).
   - **Section 6**: Adoption Status (`[PROPOSED]` or `[EVALUATING]`).
2. **Strict Sandbox Isolation**: Ensure `01-ground-truth/` and `04-deliverables/` remain **100% untouched** until the user explicitly executes `/brain-adopt <name>`.

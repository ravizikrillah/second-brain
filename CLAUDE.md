# CLAUDE.md: Second Brain Architecture Engine

## Guidelines for Claude Code

When working in this repository:
1. **Never guess or assume requirements**: Look up ground truth in `01-ground-truth/` or raw evidence in `00-raw-inputs/`.
2. **Observe 5-Tier Truth Precedence**:
   - Production Code & DB DDL (Tier 1) > Signed BRD (Tier 2) > Accepted ADRs (Tier 3) > MoM & Chat notes (Tier 4) > Conversational prompts (Tier 5).
3. **Closed-World Assumption (Zero-Hallucination Mandate)**:
   - System truth is strictly bounded by `01-ground-truth/`. If an entity, column, API endpoint, query parameter, DTO field, or business rule is not explicitly present in `01-ground-truth/`, it DOES NOT EXIST.
   - Never guess, extrapolate, or assume unstated REST patterns. Output `[NOT FOUND IN GROUND TRUTH]` if an element is missing.
4. **Hard Block on Contradictions**: If user prompts or MoM files conflict with Tier 1/2/3, HALT deliverable generation, record in `02-provenance/contradictions.md`, and guide the user through the Resolution Wizard to generate an ADR in `05-adrs/`.
5. **Multi-User & Multi-Agent Collaboration**: Shared team pointers live in `second-brain.json`. Individual collaborators can override with `second-brain.local.json` (git-ignored). Once ingested, `01-ground-truth/` and `04-deliverables/` are committed to Git so other engineers, analysts, and agents do NOT need the backend/frontend codebases cloned on their machines.
6. **Mandatory Provenance**: Every endpoint, model field, and diagram step in `04-deliverables/` must include inline citation tags:
   - PlantUML: `<color:#007acc><b>[SRC:BRD#REQ-01]</b></color>`
   - Markdown: `> **Provenance**: [SRC:BRD#REQ-01] | [SRC:DDL:tbl_orders]`
7. **Critical Socratic Probing (The Grill-Me Reflex)**: Never passively assume unstated requirements or edge cases. Present the direct Ground-Truth-backed answer, then append optional structured frontier questions (Decision, Recommendation, Trade-off) to stress-test failure modes, concurrency, and IFA SLAs.
8. **Commands**:
   - `/brain-init`: Initialize 6-zone folder structure, .gitignore protection rules, and starter templates.
   - `/brain-ingest`: Ingest raw inputs or external pointers via `ingest-ddl.js`, `ingest-apis.js`, and `ingest-brd.js`, detect conflicts, map provenance.
   - `/brain-deliver [apis]`: Generate PlantUML sequence diagrams, Markdown API contracts, and LLDs. Use `apis` to generate 1-to-1 endpoint sequence diagrams.
   - `/brain-branch <name>`: Create isolated trade-off scenario in `03-constraint-branches/` with cross-branch awareness (detecting obsolete parts, conflicts, and synergies).
   - `/brain-adopt <name>`: Adopt scenario via ADR and synchronize deliverables.
   - `/brain-audit`: Audit 100% provenance and system consistency.
   - `/brain-readiness`: Run the 30-dimension Architecture Readiness & Completeness Score (ARCS) across 6 stakeholder roles.
   - `/brain-handoff`: Generate/update `02-provenance/session-handoff.md` for seamless cross-session continuity.
   - `/brain-lint`: Verify markdown links, zone structure, and repo consistency.
   - `/brain-hooks`: Install Git pre-commit quality gate enforcing 100% provenance and zero broken links.
   - `/brain-qna`: Generate Stakeholder Q&A Matrix (`stakeholder-qna.md`) for PO and client refinement.
   - `/brain-query <query>`: Interactive zero-hallucination Q&A across ground truth, active DDL, and deliverables (runs `node ./bin/query.js`).
   - `/brain-impact <target>`: Change Request (CR) & Blast Radius Analyzer.
   - `/brain-story <feature>`: Slice deliverables into Jira/Confluence-ready stories with Gherkin AC.
   - `/brain-sync [--diff/--dry-run/--apply]`: Living Architecture & Documentation Synchronizer. Auto-detects drift across git repositories and synchronizes Ground Truth & 1-to-1 sequence diagrams. (Alias: `/brain-diff`).
9. **Universal Natural Language Reflex (Zero-Command Mandate & Agent-Agnostic Interface)**:
   Users, engineers, stakeholders, and autonomous AI agents do NOT need to memorize slash commands or CLI syntax. The system is **fully polyglot, role-agnostic, and agent-agnostic**—it natively understands conversational queries from any human or AI agent in **any natural language** (English, Indonesian, etc.), automatically mapping semantic intent to the underlying Second Brain operation:
   - *"How ready is our architecture / evaluate repository readiness?"* -> Auto-run `node ./bin/readiness.js` (or `./brain readiness`).
   - *"What columns are in table X / how does the API flow work?"* -> Auto-run `node ./bin/query.js "<term>"` (or `./brain query "<term>"`).
   - *"If column X is modified or dropped, what is affected / check blast radius?"* -> Trigger `/brain-impact <target>`.
   - *"Create a Jira user story / slice tickets / write Gherkin AC"* -> Trigger `/brain-story <feature>`.
   - *"Are there questions we need to ask the PO / prepare refinement?"* -> Auto-run `node ./bin/qna.js` (or `./brain qna`).
   - *"The PO answered the questionnaire / import refinement decisions"* -> Auto-run `node ./bin/qna.js --import` (or `./brain qna --import`).
   - *"Check if there are broken links / audit second brain integrity"* -> Auto-run `node ./bin/audit.js && node ./bin/lint.js` (or `./brain test`).
   - *"Wrapping up for today / save progress / create session handoff"* -> Auto-run `node ./bin/handoff.js` (or `./brain handoff`).
   - *"What if we explore an alternative architecture / compare scenarios?"* -> Auto-run `/brain-branch <name>`.
   - *"We agreed on option A / adopt scenario as an ADR"* -> Auto-run `/brain-adopt <name>`.
   - *"Generate sequence diagrams / create API contracts / write LLD"* -> Auto-run `/brain-deliver [apis]`.
   - *"Parse new DDL file / extract BRD / ingest raw inputs"* -> Auto-run `node ./bin/ingest-ddl.js` (or `./brain ingest`).
   - *"Check code changes from backend repo / sync with latest commits"* -> Auto-run `node ./bin/sync.js --diff` (or `./brain sync`).
   - *"What is the canonical term for X / check forbidden synonyms?"* -> Inspect `01-ground-truth/domain-glossary.md`.
   - *"Initialize new second brain repo / scaffold 6-zone hierarchy"* -> Auto-run `node ./bin/init.js` (or `./brain init`).
   - *"Install pre-commit git hook to guard repository"* -> Auto-run `node ./bin/hooks.js` (or `./brain hooks`).

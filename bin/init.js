#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();

console.log(`\n🧠 Initializing Second Brain in: ${targetDir}\n`);

const directories = [
  '00-raw-inputs',
  '00-raw-inputs/brd',
  '00-raw-inputs/figma',
  '00-raw-inputs/db',
  '00-raw-inputs/existing-code',
  '00-raw-inputs/mom',
  '01-ground-truth',
  '02-provenance',
  '03-constraint-branches',
  '04-deliverables',
  '04-deliverables/sequence-diagrams',
  '04-deliverables/api-contracts',
  '04-deliverables/lld',
  '05-adrs',
  'bin'
];

directories.forEach(dir => {
  const fullPath = path.join(targetDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  📁 Created: ${dir}`);
  }
});

// Ensure .gitkeep in raw input subdirectories to preserve directory structure in Git
const rawInputSubdirs = ['brd', 'db', 'existing-code', 'figma', 'mom'];

rawInputSubdirs.forEach(subdir => {
  const gitkeepPath = path.join(targetDir, '00-raw-inputs', subdir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '', 'utf8');
    console.log(`  📄 Created .gitkeep: 00-raw-inputs/${subdir}/.gitkeep`);
  }
});

// Configure .gitignore with 00-raw-inputs protection rules
const gitignorePath = path.join(targetDir, '.gitignore');
const gitignoreRules = `
# Keep 00-raw-inputs and 1-level subdirectories, ignore everything else inside
00-raw-inputs/*/*
!00-raw-inputs/*/.gitkeep
!00-raw-inputs/*/README.md
`;

if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, `node_modules/\n.DS_Store/\ndist/\n*.log\n\n# Local Machine Overrides (multi-user team collaboration)\nsecond-brain.local.json\n*.local.json\n.brainrc.local*\n${gitignoreRules}`, 'utf8');
  console.log(`  📄 Created .gitignore with 00-raw-inputs protection rules`);
} else {
  const currentContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!currentContent.includes('00-raw-inputs/*/*')) {
    fs.appendFileSync(gitignorePath, gitignoreRules, 'utf8');
    console.log(`  ⚙️ Appended 00-raw-inputs protection rules to .gitignore`);
  }
}

// Copy CLI helper tools into target project bin/
const binSourceDir = __dirname;
const binTargetDir = path.join(targetDir, 'bin');
const packageRoot = path.resolve(__dirname, '..');

if (targetDir !== packageRoot) {
  ['audit.js', 'ingest-ddl.js', 'ingest-apis.js', 'ingest-brd.js', 'generate-api-sequences.js', 'init.js', 'organize.js', 'source-resolver.js', 'sync.js'].forEach(script => {
    const src = path.join(binSourceDir, script);
    const dest = path.join(binTargetDir, script);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      try { fs.chmodSync(dest, '755'); } catch (e) {}
      console.log(`  ⚙️  Copied CLI tool: bin/${script}`);
    }
  });

  // Copy project-level skills into target project (.agents/skills/ and skills/)
  const skillsSourceDir = path.join(packageRoot, 'skills');
  if (fs.existsSync(skillsSourceDir)) {
    const targetSkillDestinations = [
      path.join(targetDir, '.agents', 'skills'),
      path.join(targetDir, 'skills')
    ];

    targetSkillDestinations.forEach(destBaseDir => {
      fs.mkdirSync(destBaseDir, { recursive: true });
      const skillEntries = fs.readdirSync(skillsSourceDir);
      skillEntries.forEach(entry => {
        const srcSkillFolder = path.join(skillsSourceDir, entry);
        if (fs.statSync(srcSkillFolder).isDirectory()) {
          const destSkillFolder = path.join(destBaseDir, entry);
          fs.mkdirSync(destSkillFolder, { recursive: true });
          const srcSkillMd = path.join(srcSkillFolder, 'SKILL.md');
          const destSkillMd = path.join(destSkillFolder, 'SKILL.md');
          if (fs.existsSync(srcSkillMd)) {
            fs.copyFileSync(srcSkillMd, destSkillMd);
          }
        }
      });
    });
    console.log(`  🎯 Installed project-level skills into .agents/skills/ & skills/`);
  }

  const targetPackageJson = path.join(targetDir, 'package.json');
  if (!fs.existsSync(targetPackageJson)) {
    const pkgContent = JSON.stringify({
      name: path.basename(targetDir),
      version: '1.0.0',
      private: true,
      scripts: {
        "init": "node ./bin/init.js",
        "organize": "node ./bin/organize.js",
        "ingest": "node ./bin/ingest-ddl.js && node ./bin/ingest-apis.js && node ./bin/ingest-brd.js",
        "ingest:ddl": "node ./bin/ingest-ddl.js",
        "ingest:apis": "node ./bin/ingest-apis.js",
        "ingest:brd": "node ./bin/ingest-brd.js",
        "deliver:apis": "node ./bin/generate-api-sequences.js",
        "sync": "node ./bin/sync.js",
        "sync:check": "node ./bin/sync.js --dry-run",
        "audit": "node ./bin/audit.js",
        "test": "node ./bin/audit.js"
      }
    }, null, 2) + '\n';
    fs.writeFileSync(targetPackageJson, pkgContent, 'utf8');
    console.log(`  📦 Generated package.json with audit & ingest scripts`);
  }

  const configPath = path.join(targetDir, 'second-brain.json');
  if (!fs.existsSync(configPath)) {
    const starterConfig = {
      "$schema": "https://raw.githubusercontent.com/Ravizikrillah/second-brain/main/schema.json",
      "name": path.basename(targetDir),
      "sources": {
        "code": [
          "./00-raw-inputs/existing-code"
        ],
        "ddl": [
          "./00-raw-inputs/db"
        ],
        "brd": [
          "./00-raw-inputs/brd"
        ],
        "mom": [
          "./00-raw-inputs/mom"
        ],
        "figma": [
          "./00-raw-inputs/figma"
        ]
      },
      "rules": {
        "precedence": ["code", "ddl", "brd", "adr", "mom", "chat"]
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(starterConfig, null, 2) + '\n', 'utf8');
    console.log(`  ⚙️  Scaffolded source configuration: second-brain.json`);
  }
}

const starterFiles = [
  // --- Zone 0: Raw Inputs ---
  {
    path: '00-raw-inputs/README.md',
    content: `# 📥 Zone 0: Raw Inputs (Untrusted Ingestion Zone)\n\nWelcome to the **Raw Inputs** zone. This directory is the entrypoint for all raw, unstructured, and heterogeneous technical and business artifacts collected from stakeholders before processing by Second Brain.\n\n---\n\n## 🛡️ Truth Precedence in Raw Inputs\n- **Tier 1 (Ultimate Truth)**: Active Database DDL (\`db/\`) and Production Backend Code (\`existing-code/\`).\n- **Tier 2 (Contractual Truth)**: Signed PRDs, approved BRDs, and formal Interface Agreements (\`brd/\`).\n- **Tier 3 (Architectural Truth)**: Accepted ADRs in \`05-adrs/\`.\n- **Tier 4 (Volatile Truth)**: Meeting Minutes, chat discussions, Slack agreements (\`mom/\`).\n- **Tier 5 (Ad-hoc Truth)**: Conversational chat prompts in active LLM sessions.\n\n> 🛑 **MANDATORY HARD BLOCK**: If \`mom/\` (Tier 4) contradicts code/DDL (Tier 1) or BRD (Tier 2), deliverable generation halts until arbitrated via an ADR in \`05-adrs/\`.\n\n---\n\n## 📁 Subdirectories\n- \`brd/\`: Business Requirement Documents & PRDs.\n- \`figma/\`: UI/UX screen flows, component specs, design tokens.\n- \`db/\`: SQL DDL scripts (\`CREATE TABLE\`), migrations, DML seed.\n- \`existing-code/\`: Backend microservices, Go routers, YAML configs, curls.\n- \`mom/\`: Meeting minutes, chat agreements, alignment discussions.\n`
  },
  {
    path: '00-raw-inputs/brd/README.md',
    content: `# BRD & Requirements Input\n\nPlace raw business requirement documents, PRDs, or user story markdown files here.\n`
  },
  {
    path: '00-raw-inputs/brd/.gitkeep',
    content: ''
  },
  {
    path: '00-raw-inputs/figma/README.md',
    content: `# Figma & UI/UX Specs Input\n\nPlace screen flow summaries, UX copy text, component specs, and design token exports here.\n`
  },
  {
    path: '00-raw-inputs/figma/.gitkeep',
    content: ''
  },
  {
    path: '00-raw-inputs/db/README.md',
    content: `# Database Schemas Input\n\nPlace SQL DDL scripts (CREATE TABLE, ALTER TABLE), indexes, and seed DML data here.\n`
  },
  {
    path: '00-raw-inputs/db/.gitkeep',
    content: ''
  },
  {
    path: '00-raw-inputs/existing-code/README.md',
    content: `# Existing Code Snippets & Models\n\nYou have 3 ways to connect existing codebases to Second Brain:\n\n1. **Config File (Recommended for external git repositories)**:\n   Add external repo paths to \`second-brain.json\` without copying or committing large repos:\n   \`\`\`json\n   {\n     "sources": {\n       "code": ["../my-backend-repo", "../my-frontend-repo"],\n       "ddl": ["../my-backend-repo/migrations"]\n     }\n   }\n   \`\`\`\n\n2. **Symlink (\`ln -s\`)**:\n   Create symlinks inside this directory:\n   \`\`\`bash\n   ln -s /path/to/my-backend ./00-raw-inputs/existing-code/my-backend\n   \`\`\`\n   *(This directory is git-ignored so external repos are never committed to Second Brain git.)*\n\n3. **Physical Copy / Drop**:\n   Place backend microservice folders, Go routers, Python/TS DTOs, and YAML configs directly here.\n`
  },
  {
    path: '00-raw-inputs/existing-code/.gitkeep',
    content: ''
  },
  {
    path: '00-raw-inputs/mom/README.md',
    content: `# Meeting Minutes (MoM) & Discussion Notes\n\nPlace meeting notes, Slack/chat agreements, and alignment decisions here.\n`
  },
  {
    path: '00-raw-inputs/mom/.gitkeep',
    content: ''
  },

  // --- Zone 1: Ground Truth ---
  {
    path: '01-ground-truth/README.md',
    content: `# 🏛️ Zone 1: Ground Truth (Canonical System Truth)\n\nWelcome to the **Ground Truth** zone. Houses the verified, immutable, and authoritative state of system truth synthesized from Tier 1 (Code, DDL) and Tier 2 (BRDs).\n\n---\n\n## 📄 Canonical Artifacts\n1. \`domain-glossary.md\`: Ubiquitous domain language, canonical definitions, and forbidden synonyms.\n2. \`entity-catalog.md\`: Complete index of 100% database tables, columns, primary keys, and state machine transitions (extracted via \`npm run ingest:ddl\`).\n3. \`api-inventory.md\`: Disambiguated API registry partitioned into **Part 1: Internal Microservice APIs** and **Part 2: External Surrounding Systems Catalog** (extracted via \`npm run ingest:apis\`).\n\n---\n\n## ⚡ Ingestion Commands\n- \`npm run ingest:ddl\` / \`node ./bin/ingest-ddl.js\`\n- \`npm run ingest:apis\` / \`node ./bin/ingest-apis.js\`\n- \`/brain-ingest\`: Full ingestion pipeline.\n`
  },
  {
    path: '01-ground-truth/domain-glossary.md',
    content: `# Domain Glossary\n\n| Term | Canonical Definition | Forbidden Synonyms | Source Tag |\n| :--- | :--- | :--- | :--- |\n`
  },
  {
    path: '01-ground-truth/entity-catalog.md',
    content: `# Entity Catalog\n\nDefines verified business entities, table models, primary keys, and state machine transitions.\n`
  },
  {
    path: '01-ground-truth/api-inventory.md',
    content: `# API & Service Inventory: Ground Truth\n\n> **Canonical System Truth (Tier 1 Production Code, Protobuf Specs, YAML Configs, & Tier 2 IFAs)**\n> Authoritative, disambiguated registry strictly separating **Internal Microservice APIs** from **External Surrounding Systems**.\n\n---\n\n## 🏛️ System Boundary & IFA Classification Architecture\n\n1. **🔌 Internal Microservice APIs (Owned / Inbound)**: Implemented directly within our codebase (\`repo/backend/*\`). Traffic flows inbound to our HTTP routers and gRPC servers from Frontend, APIGW, or internal peers.\n2. **🌐 External Surrounding Systems (Outbound / Integrations / Third-Party IFAs)**: Enterprise core services (Payment Gateways, Identity Providers, CRMs, Notification Engines, Object Storage). Our microservices act as clients calling outbound APIs, or receive incoming webhook callbacks.\n\n---\n\n## 🔌 Part 1: Internal Microservice APIs (Owned Services & Endpoints)\n\n### 1.1 Microservice Topology & Port Allocations\n| Microservice Name | Runtime | HTTP Port | gRPC Port | Primary Persistence | Core Responsibility | Source Provenance |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n\n### 1.2 Active Internal Endpoints Registry (HTTP / REST)\n\n### 1.3 Internal gRPC Microservice RPC Contracts\n\n### 1.4 API Gateway Ingress Contracts (KrakenD)\n\n### 1.5 Core Data Transfer Objects (DTO Request/Response Models)\n\n---\n\n## 🌐 Part 2: External Surrounding Systems Catalog (Outbound IFAs & Webhooks)\n\n### 2.1 Surrounding Systems Master Catalog\n| System Code | System Name | Integration Role | Traffic Direction | Transport Protocol | Ownership Boundary | Authoritative Source Provenance |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n\n### 2.2 External Endpoints & Integration Operations\n`
  },

  // --- Zone 2: Provenance ---
  {
    path: '02-provenance/README.md',
    content: `# 🔍 Zone 2: Provenance, Planning & Anti-Gaslighting\n\nWelcome to the **Provenance** zone. Manages end-to-end evidence traceability, work breakdown delivery planning, and automated protection against misinformation.\n\n---\n\n## 📄 Key Artifacts\n1. \`delivery-plan.md\`: Delivery backlog manifest tracking 100% completion of DDL schemas and product journeys without token exhaustion.\n2. \`traceability-matrix.md\`: Cross-reference table mapping every technical deliverable element to authoritative file and line numbers (\`[SRC:...]\`).\n3. \`contradictions.md\`: Conflict log between incoming claims and Ground Truth. Active entries trigger a Hard Block.\n\n---\n\n## ⚡ Auditing Commands\n- \`/brain-audit\` (or \`npm run audit\`): Verifies 100% provenance coverage and zero active contradictions.\n- \`/brain-deliver next\`: Consumes the next task from \`delivery-plan.md\`.\n`
  },
  {
    path: '02-provenance/traceability-matrix.md',
    content: `# Traceability & Provenance Matrix\n\n| Artifact Element | Provenance Tag | Authoritative Source File & Line | Truth Tier | Verification Status |\n| :--- | :--- | :--- | :--- | :--- |\n`
  },
  {
    path: '02-provenance/delivery-plan.md',
    content: `# 🗺️ Second Brain Delivery & Ingestion Plan\n\n> Tracks 100% completion of database schema models and product deliverables without token exhaustion.\n\n## 1. 🗄️ Database Schemas Ingestion\n- [ ] Task DB-01: Core Entities\n\n## 2. 🚀 Product Journey Deliverables\n- [ ] Task DEL-01: Baseline Feature Deliverables\n\n---\n**Progress**: 0% Ingested | 0% Delivered\n`
  },
  {
    path: '02-provenance/contradictions.md',
    content: `# Contradiction & Anti-Gaslighting Log\n\nRecords all detected conflicts between raw inputs and Ground Truth.\n\n| Conflict ID | Incoming Claim (Tier) | Ground Truth Reality (Tier) | Status | Arbitration ADR |\n| :--- | :--- | :--- | :--- | :--- |\n`
  },

  // --- Zone 3: Constraint Branches ---
  {
    path: '03-constraint-branches/README.md',
    content: `# 🌿 Zone 3: Constraint Branches (Isolated Scenario Explorations)\n\nWelcome to the **Constraint Branches** zone. Provides an isolated sandbox to evaluate speculative technical, budgetary, or operational constraints without polluting canonical Ground Truth or production deliverables.\n\n---\n\n## 📄 Structure & Cross-Branch Intelligence\n- Scenarios are created via \`/brain-branch <name>\` based on \`scenario-template.md\`.\n- Automatically performs cross-branch correlation analysis across all existing branches to detect redundancies, obsolete components, conflicts, and synergies.\n- Formal adoption is executed via \`/brain-adopt <name>\`, recording an ADR in \`05-adrs/\` and synchronizing deliverables.\n`
  },
  {
    path: '03-constraint-branches/scenario-template.md',
    content: `# Scenario Template: [Scenario Title]\n\n## 1. Constraint Description\nDescribe the technical, operational, or budgetary constraint (e.g., Latency < 50ms, No Redis Cache, Offline-First Sync, Frozen Legacy DB).\n\n## 2. Impacted Components\nList the services, database tables, and API contracts affected:\n- **Internal Services**: [e.g., \`order-service\`, \`payment-service\`]\n- **Database Tables / Collections**: [e.g., \`tbl_orders\`, \`journey_logs\`]\n- **API Endpoints / Contracts**: [e.g., \`POST /api/v1/orders\`, \`GET /api/v1/sync/status\`]\n- **External Surrounding Systems / IFA**: [e.g., Payment Gateway, Auth Provider, Notification Engine]\n\n## 3. Architectural Trade-offs\n| Option | Pros | Cons | Estimated Latency / Cost / Complexity |\n| :--- | :--- | :--- | :--- |\n\n## 4. Proposed Solution & Delta\nDetail the architectural modifications required if this constraint is adopted (delta against canonical Ground Truth).\n\n## 5. Cross-Branch Correlations & Obsolescence Analysis\nAudit against all existing scenarios in \`03-constraint-branches/\` and active Ground Truth:\n- **🗑️ Obsolete & Redundant Components (Rendered Obsolete)**:\n  - Components, endpoints, database tables, background workers, or parts of earlier branches rendered unnecessary or obsolete if this scenario is adopted.\n- **⚔️ Conflicts & Mutual Exclusions**:\n  - Scenarios or constraints in \`03-constraint-branches/\` that clash or cannot co-exist with this proposal.\n- **🤝 Synergies & Shared Components**:\n  - Shared schemas, services, or contracts overlapping with other active scenarios that can be reused.\n- **🔗 Dependency & Sequencing Chain**:\n  - Prerequisite branches that must be adopted first, or downstream branches unblocked by this.\n\n### Cross-Branch Correlation Matrix\n| Related Scenario / Component | Relationship Type | Details & Impact | Rendered Obsolete / Deprecated Parts |\n| :--- | :--- | :--- | :--- |\n| \`scenario-<other>.md\` | \`[OBSOLETES / CONFLICTS / SYNERGY / DEPENDS]\` | [Impact summary] | [Specific parts rendered unnecessary] |\n\n## 6. Adoption Status\nStatus: [PROPOSED | EVALUATING | ADOPTED | REJECTED]\n`
  },

  // --- Zone 4: Deliverables ---
  {
    path: '04-deliverables/README.md',
    content: `# 📦 Zone 4: Deliverables (Production Engineering Deliverables)\n\nWelcome to the **Deliverables** zone. Authoritative, production-ready engineering deliverables synthesized from verified Ground Truth.\n\n---\n\n## 📁 Subdirectories\n- \`sequence-diagrams/\`: PlantUML sequence diagrams (\`.puml\`) strictly partitioning Internal Services from External Surrounding Systems.\n- \`api-contracts/\`: Markdown API contracts with boundary tags (\`[INTERNAL]\` vs \`[SURROUNDING IFA]\`), request/response JSON schemas, and field provenance.\n- \`lld/\`: 3-Pillar Low-Level Design documents (Architectural Context, Technical Flow, Data Model).\n\n---\n\n## ⚡ Generation Commands\n- \`/brain-deliver next\` or \`/brain-deliver <feature>\`\n- \`/brain-story <feature>\`: Slice into Jira stories.\n- \`/brain-impact <target>\`: Blast radius analyzer.\n`
  },
  {
    path: '04-deliverables/sequence-diagrams/README.md',
    content: `# 📊 Sequence Diagrams (\`04-deliverables/sequence-diagrams/\`)\n\nProduction PlantUML (\`.puml\`) sequence diagrams modeling technical execution flows and data persistence.\n\n---\n\n## 📏 Mandatory Standards\n1. **Strict Partitioning**: Internal Services inside \`box "Internal Core Services" #AliceBlue\`, External Systems inside \`box "External Surrounding Systems" #LightYellow\`.\n2. **Autonumbering**: Use \`autonumber "<b>[00]</b>"\` and \`skinparam style strictuml\`.\n3. **100% Provenance Citations**: Every message arrow MUST cite \`[SRC:BRD#...]\` or \`[SRC:DDL:...]\`.\n4. **Failure Branches**: Model error paths in \`alt / else\` blocks.\n`
  },
  {
    path: '04-deliverables/sequence-diagrams/sample.puml',
    content: `@startuml\nskinparam style strictuml\nskinparam BoxPadding 10\nautonumber "<b>[00]</b>"\n\nactor "Customer" as User\nbox "Internal Core Services" #AliceBlue\nparticipant "API Gateway" as APIGW\nparticipant "Order Service" as OrderSvc\nend box\ndatabase "Postgres DB" as DB\n\nUser -> APIGW: POST /api/v1/orders \\n<color:#007acc><b>[SRC:BRD#REQ-01]</b></color>\nactivate APIGW\nAPIGW -> OrderSvc: CreateOrder(payload) \\n<color:#28a745><b>[SRC:DDL:tbl_orders]</b></color>\nactivate OrderSvc\nOrderSvc -> DB: INSERT INTO tbl_orders \\n<color:#28a745><b>[SRC:DDL:tbl_orders]</b></color>\nactivate DB\nDB --> OrderSvc: 1 row affected [SRC:DDL:tbl_orders]\ndeactivate DB\nOrderSvc --> APIGW: 201 Created (OrderID) [SRC:BRD#REQ-01]\ndeactivate OrderSvc\nAPIGW --> User: 201 Created [SRC:BRD#REQ-01]\ndeactivate APIGW\n@enduml\n`
  },
  {
    path: '04-deliverables/api-contracts/README.md',
    content: `# 🔌 API Contracts (\`04-deliverables/api-contracts/\`)\n\nAuthoritative Markdown API specifications and Interface Agreements (IFAs) for REST & gRPC endpoints.\n\n---\n\n## 📏 Mandatory Standards\n1. **Boundary Tag**: Declare \`Type: [INTERNAL MICROSERVICE API]\` or \`Type: [EXTERNAL SURROUNDING SYSTEM IFA]\`.\n2. **Surrounding System Details**: Document outbound payload, timeout SLA, retry policy, and fallout queue.\n3. **Field Provenance**: Request/response JSON schemas with inline \`[SRC:...]\` citations on every field.\n`
  },
  {
    path: '04-deliverables/api-contracts/sample-api-contract.md',
    content: `# API Contract: Order Management\n\n### POST /api/v1/orders\n> **Provenance**: \`[SRC:BRD#REQ-01]\` | \`[SRC:DDL:tbl_orders]\`  \n> **Type**: \`[INTERNAL MICROSERVICE API]\`\n\n#### Request Headers\n- \`Authorization\`: \`Bearer <jwt>\` (required) \`[SRC:CODE:jwt_middleware.go#L18]\`\n- \`Content-Type\`: \`application/json\` \`[SRC:STANDARDS:rest-guideline]\`\n\n#### Request Body\n\`\`\`json\n{\n  "customer_id": "usr_99812",\n  "total_amount": 150000\n}\n\`\`\`\n\n#### Response (201 Created)\n\`\`\`json\n{\n  "order_id": "ord_12345",\n  "status": "PENDING_PAYMENT"\n}\n\`\`\`\n`
  },
  {
    path: '04-deliverables/lld/README.md',
    content: `# 📐 Low-Level Design Documents (\`04-deliverables/lld/\`)\n\nDeep implementation blueprints for microservices, Redis caching, and data persistence.\n\n---\n\n## 🏛️ The 3-Pillar LLD Standard\n1. **Pillar 1: Architectural Context**: Topology, gateway routing, and security boundaries.\n2. **Pillar 2: Technical Flow**: Algorithmic logic, validation order, and rollback procedures.\n3. **Pillar 3: Data Model & Events**: DB persistence, Redis key patterns/TTL, and Kafka/RabbitMQ events.\n`
  },
  {
    path: '04-deliverables/lld/sample-lld.md',
    content: `# Low-Level Design (LLD): Order Management Service\n\n## 1. Architectural Context\nIntegrates incoming checkout requests through API Gateway down to the persistence layer.\n\n## 2. Technical Flow\n1. Validates JWT claims.\n2. Inserts pending record into \`tbl_orders\`.\n3. Dispatches order placed event.\n\n## 3. Data Model & Specifications\nBacked by Postgres \`tbl_orders\` with optimistic concurrency.\n`
  },

  // --- Zone 5: ADRs ---
  {
    path: '05-adrs/README.md',
    content: `# 📜 Zone 5: ADRs (Architectural Decision Records)\n\nWelcome to the **Architectural Decision Records** zone. Permanent, sequential, and immutable record of all architectural decisions and contradiction arbitrations.\n\n---\n\n## 🎯 Principles\n- **Immutable History**: Accepted ADRs are never edited in place; new decisions supersede earlier ones.\n- **Sequential Naming**: \`05-adrs/NNNN-[kebab-case-title].md\`.\n- **Hard Block Resolution**: Contradictions between MoM/chat vs DDL/Code are resolved exclusively by recording an accepted ADR here.\n`
  },
  {
    path: '05-adrs/0001-hierarchy-of-truth-and-hard-block.md',
    content: `# 0001. Hierarchy of Truth and Mandatory Hard Block\n\nAI agents processing mixed requirements (MoM, BRDs, production code, chat instructions) are vulnerable to gaslighting and contradictory inputs. We enforce a strict 5-tier precedence hierarchy where production code and active DDL outrank signed BRDs, which outrank MoM notes and ad-hoc chat instructions; any contradiction triggers a mandatory Hard Block that halts deliverable generation until human arbitration records an Architectural Decision Record (ADR). This trades automated turnaround speed for uncompromised architectural integrity.\n`
  },

  // --- CLI Bin ---
  {
    path: 'bin/README.md',
    content: `# ⚙️ Second Brain Deterministic CLI Tools (\`bin/\`)\n\nZero-dependency, deterministic Node.js utilities for scaffolding, schema ingestion, API extraction, and provenance auditing.\n\n---\n\n## 🛠️ Tool Catalog\n- \`init.js\` (\`npm run init\`): Scaffolds 6-zone directory hierarchy, configuration rules, .gitkeep files, .gitignore protection rules, and baseline templates.\n- \`organize.js\` (\`npm run organize [dir]\`): Directory-preserving auto-triage for raw unstructured input files.\n- \`ingest-ddl.js\` (\`npm run ingest:ddl\`): Deterministic SQL DDL parser indexing 100% of tables into \`entity-catalog.md\`.\n- \`ingest-apis.js\` (\`npm run ingest:apis\`): Deterministic API ingester separating Internal APIs from External Surrounding Systems.\n- \`ingest-brd.js\` (\`npm run ingest:brd\`): Deterministic BRD ingester extracting functional requirements & RBAC into \`business-rules.md\`.\n- \`generate-api-sequences.js\` (\`npm run deliver:apis\`): Automated 1-to-1 PlantUML sequence diagram generator for internal endpoints.\n- \`sync.js\` (\`npm run sync\` / \`npm run diff\`): Living Architecture & Documentation Drift Synchronizer.\n- \`audit.js\` (\`npm run audit\`): Provenance coverage checker & contradiction detector.\n`
  },

  // --- Universal Rules & Context ---
  {
    path: 'AGENTS.md',
    content: fs.readFileSync(path.join(__dirname, '..', 'AGENTS.md'), 'utf8')
  },
  {
    path: 'CLAUDE.md',
    content: fs.readFileSync(path.join(__dirname, '..', 'CLAUDE.md'), 'utf8')
  },
  {
    path: '.cursorrules',
    content: fs.readFileSync(path.join(__dirname, '..', '.cursorrules'), 'utf8')
  },
  {
    path: 'CONTEXT.md',
    content: `# Second Brain\n\nA universal knowledge, synthesis, and architectural design system that converts raw product and technical inputs into verified deliverables with strict provenance, constraint branching, and misinformation resistance.\n\n## Language\n\n**Ground Truth**: The verified, immutable canonical state of system behavior.\n**Raw Input**: Unprocessed source materials prior to ingestion.\n**Provenance**: The explicit, traceable chain of evidence linking deliverables to source tags.\n**Contradiction**: A conflict between incoming claims and ground truth.\n**Hard Block**: Mandatory halt when a contradiction is detected.\n`
  }
];

starterFiles.forEach(file => {
  const fullPath = path.join(targetDir, file.path);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, file.content, 'utf8');
    console.log(`  📄 Created template: ${file.path}`);
  }
});

console.log(`\n✨ Second Brain initialized successfully!\n`);

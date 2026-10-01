#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { resolveSources, findFiles: resolveFindFiles } = require('./source-resolver');

const targetDir = process.cwd();

console.log(`\n🔍 Second Brain Deterministic Provenance & Integrity Auditor\n`);

const PROVENANCE_REGEX = /\[SRC:[^\]]+\]/;
const ARROW_REGEX = /^[ \t]*[A-Za-z0-9_]+[ \t]*(?:->|-->|->>|-->>|<-|<--)[ \t]*[A-Za-z0-9_]+[ \t]*:/;
const ENDPOINT_REGEX = /^#{2,4}[ \t]+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)[ \t]+([^\n\r]+)/i;

let totalElements = 0;
let taggedElements = 0;
const violations = [];

// Helper to recursively find files matching extension
function findFiles(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, exts));
    } else {
      if (exts.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

// 1. Audit Sequence Diagrams (.puml)
const pumlFiles = findFiles(path.join(targetDir, '04-deliverables', 'sequence-diagrams'), ['.puml']);
pumlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(targetDir, file);

  lines.forEach((line, index) => {
    if (ARROW_REGEX.test(line)) {
      totalElements++;
      if (PROVENANCE_REGEX.test(line)) {
        taggedElements++;
      } else {
        violations.push({
          file: relPath,
          line: index + 1,
          type: 'MISSING_PROVENANCE',
          content: line.trim()
        });
      }
    }
  });
});

// 2. Audit API Contracts (.md)
const apiFiles = findFiles(path.join(targetDir, '04-deliverables', 'api-contracts'), ['.md']);
apiFiles.forEach(file => {
  if (path.basename(file).toLowerCase() === 'readme.md') return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(targetDir, file);

  let currentEndpoint = null;
  let endpointHasProvenance = false;

  lines.forEach((line, index) => {
    const epMatch = line.match(ENDPOINT_REGEX);
    if (epMatch) {
      if (currentEndpoint && !endpointHasProvenance) {
        violations.push({
          file: relPath,
          line: currentEndpoint.line,
          type: 'ENDPOINT_MISSING_PROVENANCE',
          content: currentEndpoint.text
        });
      }
      totalElements++;
      currentEndpoint = { line: index + 1, text: line.trim() };
      endpointHasProvenance = PROVENANCE_REGEX.test(line);
      if (endpointHasProvenance) taggedElements++;
    } else if (currentEndpoint) {
      if (PROVENANCE_REGEX.test(line)) {
        if (!endpointHasProvenance) {
          endpointHasProvenance = true;
          taggedElements++;
        }
      }
      // Check request/response body field params
      if (/^[ \t]*-[ \t]*`[^`]+`/.test(line)) {
        totalElements++;
        if (PROVENANCE_REGEX.test(line)) {
          taggedElements++;
        } else {
          violations.push({
            file: relPath,
            line: index + 1,
            type: 'FIELD_MISSING_PROVENANCE',
            content: line.trim()
          });
        }
      }
    }
  });

  if (currentEndpoint && !endpointHasProvenance) {
    violations.push({
      file: relPath,
      line: currentEndpoint.line,
      type: 'ENDPOINT_MISSING_PROVENANCE',
      content: currentEndpoint.text
    });
  }
});

// 3. Audit Contradictions (Anti-Gaslighting Check)
const contradictionFile = path.join(targetDir, '02-provenance', 'contradictions.md');
let unresolvedContradictions = 0;
if (fs.existsSync(contradictionFile)) {
  const content = fs.readFileSync(contradictionFile, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    // Look for table rows with active / open conflict status
    if (/\|[ \t]*CONF-\d+[ \t]*\|/.test(line)) {
      if (/OPEN|UNRESOLVED|ACTIVE|PENDING/i.test(line)) {
        unresolvedContradictions++;
        violations.push({
          file: '02-provenance/contradictions.md',
          line: index + 1,
          type: 'ACTIVE_CONTRADICTION_HARD_BLOCK',
          content: line.trim()
        });
      }
    }
  });
}

// 4. Audit DDL Table Completeness
const ddlResolution = resolveSources('ddl', { targetDir });
const catalogFile = path.join(targetDir, '01-ground-truth', 'entity-catalog.md');
let ddlTableCount = 0;
let catalogedTableCount = 0;
const missingTables = [];

const validDdlSources = ddlResolution.sources.filter(s => s.exists);
const auditCodeResolution = resolveSources('code', { targetDir });
const validAuditCodeSources = auditCodeResolution.sources.filter(s => s.exists && s.isDirectory);
const allDdlCheckSources = [...validDdlSources, ...validAuditCodeSources];

if (allDdlCheckSources.length > 0) {
  const foundTables = new Set();
  allDdlCheckSources.forEach(src => {
    const sqlFiles = resolveFindFiles(src.path, f => f.endsWith('.sql'));
    sqlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.matchAll(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|")?([a-zA-Z0-9_]+)(?:`|")?\s*\(/gmi);
      for (const m of matches) {
        foundTables.add(m[1].toLowerCase());
      }
    });
  });
  ddlTableCount = foundTables.size;

  if (ddlTableCount > 0 && fs.existsSync(catalogFile)) {
    const catalogContent = fs.readFileSync(catalogFile, 'utf8').toLowerCase();
    foundTables.forEach(table => {
      const regex = new RegExp(`(?:entity:\\s*|table\\s*|##\\s*\\d*\\.?\\s*)` + table, 'i');
      if (regex.test(catalogContent) || catalogContent.includes(`\`${table}\``)) {
        catalogedTableCount++;
      } else {
        missingTables.push(table);
        violations.push({
          file: '01-ground-truth/entity-catalog.md',
          line: 1,
          type: 'DDL_TABLE_NOT_CATALOGED',
          content: `Table '${table}' exists in DDL but is missing from entity-catalog.md. Run 'node ./bin/ingest-ddl.js' to sync.`
        });
      }
    });
  }
}

// 5. Audit BRDs Discovered
const brdResolution = resolveSources('brd', { targetDir });
let totalBrds = 0;
const validBrdSources = brdResolution.sources.filter(s => s.exists);
validBrdSources.forEach(src => {
  const brdFiles = resolveFindFiles(src.path, f => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');
  totalBrds += brdFiles.length;
});

// 6. Audit Delivery Plan Tasks (if exists)
const planFile = path.join(targetDir, '02-provenance', 'delivery-plan.md');
let totalTasks = 0;
let completedTasks = 0;
if (fs.existsSync(planFile)) {
  const content = fs.readFileSync(planFile, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach(line => {
    if (/^[ \t]*-[ \t]*\[[ xX]\]/.test(line)) {
      totalTasks++;
      if (/^[ \t]*-[ \t]*\[[xX]\]/.test(line)) {
        completedTasks++;
      }
    }
  });
}

// 7. Audit API Inventory Disambiguation (Internal vs Surrounding Systems)
const apiInventoryFile = path.join(targetDir, '01-ground-truth', 'api-inventory.md');
const codeResolution = resolveSources('code', { targetDir });
const hasCodeSources = codeResolution.sources.some(s => s.exists);
let internalServicesCount = 0;
let surroundingSystemsCount = 0;
let apiInventoryDisambiguated = false;

if (fs.existsSync(apiInventoryFile)) {
  const apiContent = fs.readFileSync(apiInventoryFile, 'utf8');
  const hasPart1 = /Part 1: Internal Microservice APIs/i.test(apiContent);
  const hasPart2 = /Part 2: External Surrounding Systems/i.test(apiContent);

  if (hasPart1 && hasPart2) {
    apiInventoryDisambiguated = true;
    const internalMatches = apiContent.match(/####\s+📦\s+`([^`]+)`/g) || [];
    internalServicesCount = internalMatches.length;
    const surroundingMatches = apiContent.match(/####\s+🌐\s+`([^`]+)`/g) || [];
    surroundingSystemsCount = surroundingMatches.length;
  } else if (hasCodeSources) {
    violations.push({
      file: '01-ground-truth/api-inventory.md',
      line: 1,
      type: 'API_INVENTORY_AMBIGUOUS',
      content: 'api-inventory.md lacks strict Part 1 (Internal APIs) vs Part 2 (External Surrounding Systems) separation. Run "node ./bin/ingest-apis.js" to fix.'
    });
  }
}

// 8. Audit 1-to-1 API Sequence Coverage
let totalApiEndpoints = 0;
let coveredApiSequences = 0;
if (fs.existsSync(apiInventoryFile)) {
  const apiContent = fs.readFileSync(apiInventoryFile, 'utf8');
  const epMatches = apiContent.match(/-\s+`(?:GET|POST|PUT|DELETE|PATCH)\s+([^`]+)`/gi) || [];
  const domainEps = epMatches.filter(e => !e.includes('health') && !e.includes('metrics'));
  totalApiEndpoints = domainEps.length;

  const seqApisDir = path.join(targetDir, '04-deliverables', 'sequence-diagrams', 'apis');
  if (fs.existsSync(seqApisDir)) {
    const pumlFiles = resolveFindFiles(seqApisDir, f => f.endsWith('.puml'));
    coveredApiSequences = pumlFiles.length;
  }
}

// 8b. Audit Business Rules Ground Truth (business-rules.md)
const businessRulesFile = path.join(targetDir, '01-ground-truth', 'business-rules.md');
let businessRulesStatus = 'N/A';
if (fs.existsSync(businessRulesFile)) {
  const brContent = fs.readFileSync(businessRulesFile, 'utf8');
  const reqMatches = brContent.match(/\|\s+\*\*`REQ-[^`]+`\*\*\s+\|/g) || [];
  const ruleMatches = brContent.match(/###\s+3\.\d+\s+/g) || [];
  businessRulesStatus = `Active (${reqMatches.length} Reqs, ${ruleMatches.length} Rules)`;
}

// 9. Calculate Coverage & Metrics
const coverage = totalElements === 0 ? 100 : ((taggedElements / totalElements) * 100).toFixed(1);
const planStatus = totalTasks === 0 ? 'N/A' : `${completedTasks}/${totalTasks} (${((completedTasks / totalTasks) * 100).toFixed(0)}%)`;
const ddlStatus = ddlTableCount === 0 ? 'N/A' : `${catalogedTableCount}/${ddlTableCount} (${((catalogedTableCount / ddlTableCount) * 100).toFixed(0)}%)`;
const brdStatus = totalBrds === 0 ? 'N/A' : `${totalBrds} file(s)`;
const apiStatus = !fs.existsSync(apiInventoryFile) ? 'Missing' : (apiInventoryDisambiguated ? `${internalServicesCount} Internal | ${surroundingSystemsCount} External` : 'Ambiguous');
const apiSeqStatus = totalApiEndpoints === 0 ? 'N/A' : `${coveredApiSequences}/${totalApiEndpoints} (${((coveredApiSequences / totalApiEndpoints) * 100).toFixed(0)}%)`;

// 10. Output Audit Scorecard
console.log(`┌────────────────────────────────────────────────────────────┐`);
console.log(`│                    AUDIT SCORECARD                         │`);
console.log(`├────────────────────────────────────────────────────────────┤`);
console.log(`│ Total Audited Deliverable Elements : ${String(totalElements).padEnd(21)} │`);
console.log(`│ Elements with Provenance [SRC:...] : ${String(taggedElements).padEnd(21)} │`);
console.log(`│ Provenance Tag Coverage            : ${String(coverage + ' %').padEnd(21)} │`);
console.log(`│ Active Hard Block Contradictions   : ${String(unresolvedContradictions).padEnd(21)} │`);
console.log(`│ DDL Schema Completeness            : ${String(ddlStatus).padEnd(21)} │`);
console.log(`│ API Inventory Disambiguation       : ${String(apiStatus).padEnd(21)} │`);
console.log(`│ 1-to-1 API Sequence Coverage       : ${String(apiSeqStatus).padEnd(21)} │`);
console.log(`│ Business Rules Ground Truth        : ${String(businessRulesStatus).padEnd(21)} │`);
console.log(`│ Product BRDs Discovered            : ${String(brdStatus).padEnd(21)} │`);
console.log(`│ Delivery Plan Task Completion      : ${String(planStatus).padEnd(21)} │`);
console.log(`└────────────────────────────────────────────────────────────┘\n`);

if (violations.length > 0) {
  console.log(`⚠️  VIOLATIONS & MISSING PROVENANCE FOUND (${violations.length}):\n`);
  violations.forEach(v => {
    console.log(`  ❌ [${v.type}] ${v.file}:${v.line}`);
    console.log(`     Snippet: "${v.content}"\n`);
  });
}

if (unresolvedContradictions > 0) {
  console.log(`🛑 HARD BLOCK FAILURE: Unresolved contradictions exist in 02-provenance/contradictions.md.`);
  console.log(`   Resolve contradictions via ADRs before generating deliverables.\n`);
  process.exit(1);
}

if (missingTables.length > 0) {
  console.log(`❌ DDL COMPLETENESS FAILURE: ${missingTables.length} table(s) from DDL are missing in entity-catalog.md!`);
  console.log(`   Run 'node ./bin/ingest-ddl.js' (or 'npm run ingest:ddl') to automatically ingest 100% of tables.\n`);
  process.exit(1);
}

if (parseFloat(coverage) < 100) {
  console.log(`⚠️  AUDIT WARNING: Provenance coverage is below 100% (${coverage}%).`);
  console.log(`   Ensure all sequence diagram messages and API fields cite authoritative [SRC:...].\n`);
  process.exit(1);
}

console.log(`✅ AUDIT PASSED: 100% Provenance Coverage and Zero Active Contradictions!\n`);
process.exit(0);

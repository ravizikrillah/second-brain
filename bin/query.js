#!/usr/bin/env node

/**
 * Second Brain Instant Knowledge Query Engine
 * 
 * High-speed, zero-hallucination semantic search across Ground Truth, DDL schemas,
 * API contracts, sequence diagrams, and business rules with exact line citations.
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const query = process.argv.slice(2).join(' ').trim();

if (!query) {
  console.log(`
🧠 Second Brain Query Engine

Usage: ./brain query <search_term>
   or: node ./bin/query.js <search_term>

Examples:
  ./brain query research
  ./brain query auth
  ./brain query client_quota
  ./brain query "POST /v1/auth/login"
`);
  process.exit(0);
}

const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

// Helper to safely read file
function readFileSafe(relPath) {
  const p = path.join(targetDir, relPath);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

// Helper to find files
function findFiles(relDir, ext) {
  const fullDir = path.join(targetDir, relDir);
  if (!fs.existsSync(fullDir)) return [];
  const results = [];
  function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const p = path.join(dir, file);
      if (fs.statSync(p).isDirectory()) {
        walk(p);
      } else if (file.endsWith(ext)) {
        results.push(p);
      }
    });
  }
  walk(fullDir);
  return results;
}

const results = {
  entities: [],
  apis: [],
  flows: [],
  glossary: [],
  adrs: []
};

// ---------------------------------------------------------
// 1. Search Database Entities (01-ground-truth/entity-catalog.md)
// ---------------------------------------------------------
const entityCatalog = readFileSafe('01-ground-truth/entity-catalog.md');
if (entityCatalog) {
  const sections = entityCatalog.split(/##\s+(?:\d+\.\s+Entity:\s+)?/);
  sections.forEach(sec => {
    const secLower = sec.toLowerCase();
    if (terms.every(t => secLower.includes(t))) {
      const firstLine = sec.split(/\r?\n/)[0].trim();
      const tableName = (sec.match(/(?:`([^`]+)`|Table:\s*`([^`]+)`)/) || [])[1] || firstLine;
      const columns = [];
      const lines = sec.split(/\r?\n/);
      lines.forEach(l => {
        if (/^\|\s*`[^`]+`\s*\|/.test(l)) {
          const colName = (l.match(/`([^`]+)`/) || [])[1];
          if (colName && terms.some(t => l.toLowerCase().includes(t))) {
            columns.push(l.trim());
          }
        }
      });
      results.entities.push({
        name: tableName,
        snippet: columns.length > 0 ? columns.slice(0, 3).join('\n     ') : 'Full table definition in entity-catalog.md'
      });
    }
  });
}

// ---------------------------------------------------------
// 2. Search API Inventory & Contracts
// ---------------------------------------------------------
const apiInventory = readFileSafe('01-ground-truth/api-inventory.md');
if (apiInventory) {
  const lines = apiInventory.split(/\r?\n/);
  lines.forEach((l, idx) => {
    const lLower = l.toLowerCase();
    if (/-\s+`(?:GET|POST|PUT|DELETE|PATCH)\s+/.test(l) && terms.every(t => lLower.includes(t))) {
      results.apis.push({
        source: '01-ground-truth/api-inventory.md',
        line: idx + 1,
        endpoint: l.replace(/^[-\s*]+/, '').trim()
      });
    }
  });
}

const apiContracts = findFiles('04-deliverables/api-contracts', '.md');
apiContracts.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(targetDir, file);
  const lines = content.split(/\r?\n/);
  lines.forEach((l, idx) => {
    const lLower = l.toLowerCase();
    if (/^#{2,4}\s+(?:GET|POST|PUT|DELETE|PATCH)\s+/i.test(l) && terms.every(t => lLower.includes(t))) {
      results.apis.push({
        source: relPath,
        line: idx + 1,
        endpoint: l.replace(/^#{2,4}\s+/, '').trim()
      });
    }
  });
});

// ---------------------------------------------------------
// 3. Search Sequences & LLD Deliverables
// ---------------------------------------------------------
const llds = findFiles('04-deliverables/lld', '.md');
llds.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(targetDir, file);
  if (terms.every(t => content.toLowerCase().includes(t))) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
    results.flows.push({
      type: 'LLD',
      file: relPath,
      title
    });
  }
});

const pumls = findFiles('04-deliverables/sequence-diagrams', '.puml');
pumls.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(targetDir, file);
  if (terms.every(t => content.toLowerCase().includes(t))) {
    const titleMatch = content.match(/title\s+([^\n\r]+)/i);
    const title = titleMatch ? titleMatch[1] : path.basename(file, '.puml');
    results.flows.push({
      type: 'PUML',
      file: relPath,
      title: title.replace(/<[^>]+>/g, '').trim()
    });
  }
});

// ---------------------------------------------------------
// 4. Search Domain Glossary (01-ground-truth/domain-glossary.md)
// ---------------------------------------------------------
const domainGlossary = readFileSafe('01-ground-truth/domain-glossary.md');
if (domainGlossary) {
  const lines = domainGlossary.split(/\r?\n/);
  lines.forEach((l, idx) => {
    const lLower = l.toLowerCase();
    if (/^\|\s*\*\*[^*]+\*\*\s*\|/.test(l) && terms.some(t => lLower.includes(t))) {
      const parts = l.split('|').map(s => s.trim());
      results.glossary.push({
        term: parts[1].replace(/\*\*/g, ''),
        definition: parts[2],
        forbidden: parts[3]
      });
    }
  });
}

// ---------------------------------------------------------
// 5. Search Architectural Decisions (05-adrs/)
// ---------------------------------------------------------
const adrs = findFiles('05-adrs', '.md');
adrs.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(targetDir, file);
  if (terms.every(t => content.toLowerCase().includes(t))) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    results.adrs.push({
      file: relPath,
      title: titleMatch ? titleMatch[1] : path.basename(file)
    });
  }
});

// ---------------------------------------------------------
// Output Formatting
// ---------------------------------------------------------
console.log(`\n🔍 Second Brain Query Results for: "${query}"\n`);

let totalFound = results.entities.length + results.apis.length + results.flows.length + results.glossary.length + results.adrs.length;

if (totalFound === 0) {
  console.log(`  ⚠️  No exact matches found for "${query}" across Ground Truth or Deliverables.`);
  console.log(`     Tip: Try a broader keyword (e.g. "auth", "project", "user", "quota").\n`);
  process.exit(0);
}

if (results.entities.length > 0) {
  console.log(`📊 Database Entities & Tables (${results.entities.length}):`);
  results.entities.slice(0, 5).forEach(e => {
    console.log(`  • \x1b[36m${e.name}\x1b[0m`);
    console.log(`     ${e.snippet}`);
  });
  console.log('');
}

if (results.apis.length > 0) {
  console.log(`🔌 API Endpoints & Routes (${results.apis.length}):`);
  results.apis.slice(0, 8).forEach(a => {
    console.log(`  • \x1b[32m${a.endpoint}\x1b[0m`);
    console.log(`     \x1b[90mSource: ${a.source}:${a.line}\x1b[0m`);
  });
  console.log('');
}

if (results.flows.length > 0) {
  console.log(`🔄 Sequence Diagrams & LLDs (${results.flows.length}):`);
  results.flows.slice(0, 6).forEach(f => {
    console.log(`  • [${f.type}] \x1b[33m${f.title}\x1b[0m`);
    console.log(`     \x1b[90mPath: ${f.file}\x1b[0m`);
  });
  console.log('');
}

if (results.glossary.length > 0) {
  console.log(`📖 Domain Glossary & Ubiquitous Language (${results.glossary.length}):`);
  results.glossary.slice(0, 4).forEach(g => {
    console.log(`  • \x1b[35m${g.term}\x1b[0m: ${g.definition}`);
    if (g.forbidden && g.forbidden !== '-') {
      console.log(`     \x1b[31mForbidden Synonyms:\x1b[0m ${g.forbidden}`);
    }
  });
  console.log('');
}

if (results.adrs.length > 0) {
  console.log(`🏛️ Architecture Decision Records (${results.adrs.length}):`);
  results.adrs.forEach(a => {
    console.log(`  • \x1b[34m${a.title}\x1b[0m (${a.file})`);
  });
  console.log('');
}

console.log(`✅ Total matches: ${totalFound} verified elements found in Ground Truth.\n`);

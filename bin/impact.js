#!/usr/bin/env node

/**
 * Second Brain Level 5 Architecture Knowledge Graph (AKG) & Blast Radius Analyzer
 * 
 * Constructs an in-memory, zero-dependency Architecture Knowledge Graph (AKG)
 * from Ground Truth, Deliverables, Schemas, and ADRs.
 * 
 * Performs deterministic multi-hop reasoning (up to 3 hops) to evaluate
 * downstream blast radius across tables, columns, endpoints, sequence diagrams,
 * surrounding systems, and architectural decisions.
 * 
 * 100% Project-Agnostic & Zero-Cloud (no external graph DB / vector DB required).
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const args = process.argv.slice(2);
const isJson = args.includes('--json');
const hopsArg = args.find(a => a.startsWith('--hops='))?.split('=')[1] ||
  (args.indexOf('--hops') !== -1 ? args[args.indexOf('--hops') + 1] : '3');
const maxHops = parseInt(hopsArg, 10) || 3;

// Filter out flag arguments to get query target
const targetTokens = args.filter(a => !a.startsWith('--') && a !== hopsArg);
const targetQuery = targetTokens.join(' ').trim();

if (!targetQuery) {
  console.log(`
⚡ Second Brain Level 5 Architecture Knowledge Graph & Blast Radius Analyzer

Usage: ./brain impact <target> [options]
   or: node ./bin/impact.js <target> [options]

Arguments:
  <target>          Table, column, API route, service, or surrounding system to evaluate
                    (e.g., 'tbl_auth', 'email', '/v1/research', 'Salesforce', 'Azure AD')

Options:
  --hops=<N>        Maximum graph traversal depth (default: 3)
  --json            Output complete multi-hop blast radius as JSON

Examples:
  ./brain impact tbl_orders
  ./brain impact email
  ./brain impact /apis/v1/auth/azure/callback
  ./brain impact "Salesforce"
`);
  process.exit(0);
}

// -------------------------------------------------------------
// 1. Safe File & Directory Readers
// -------------------------------------------------------------
function readFileSafe(relPath) {
  const fullPath = path.join(targetDir, relPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf8');
}

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

// -------------------------------------------------------------
// 2. In-Memory Graph Data Structures
// -------------------------------------------------------------
class KnowledgeGraph {
  constructor() {
    this.nodes = new Map(); // id -> { id, type, label, provenance, meta }
    this.edges = [];        // [{ from, to, type, label, provenance }]
    this.adjacency = new Map(); // id -> Set of edge indices
  }

  addNode(node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, {
        id: node.id,
        type: node.type,
        label: node.label,
        provenance: node.provenance || '',
        meta: node.meta || {}
      });
      this.adjacency.set(node.id, new Set());
    }
    return this.nodes.get(node.id);
  }

  addEdge(fromId, toId, type, label = '', provenance = '') {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return;
    const edge = { from: fromId, to: toId, type, label, provenance };
    const edgeIdx = this.edges.length;
    this.edges.push(edge);
    this.adjacency.get(fromId).add(edgeIdx);
  }

  findNodesByQuery(query) {
    const q = query.toLowerCase().trim();
    const cleanQ = q.replace(/^tbl_|^t_/, '');
    const matched = [];

    for (const [id, node] of this.nodes.entries()) {
      const idLower = id.toLowerCase();
      const labelLower = node.label.toLowerCase();

      if (idLower === q || labelLower === q) {
        matched.push({ node, score: 100 });
        continue;
      }
      if (idLower.includes(q) || labelLower.includes(q)) {
        matched.push({ node, score: 75 });
        continue;
      }
      if (cleanQ && (idLower.includes(cleanQ) || labelLower.includes(cleanQ))) {
        matched.push({ node, score: 50 });
      }
    }

    matched.sort((a, b) => b.score - a.score);
    return matched.map(m => m.node);
  }

  traverse(startNodeIds, maxDepth = 3) {
    const visitedNodes = new Set(startNodeIds);
    const visitedEdges = new Set();
    const hops = []; // array of { depth, edges, targetNodes }

    let currentLevelNodes = new Set(startNodeIds);

    for (let depth = 1; depth <= maxDepth; depth++) {
      const nextLevelNodes = new Set();
      const currentLevelEdges = [];

      for (const nodeId of currentLevelNodes) {
        const edgeIndices = this.adjacency.get(nodeId) || new Set();
        for (const idx of edgeIndices) {
          if (visitedEdges.has(idx)) continue;
          const edge = this.edges[idx];
          visitedEdges.add(idx);
          currentLevelEdges.push(edge);

          const neighborId = edge.to === nodeId ? edge.from : edge.to;
          if (!visitedNodes.has(neighborId)) {
            visitedNodes.add(neighborId);
            nextLevelNodes.add(neighborId);
          }
        }

        // Also check inbound edges (undirected exploration for full blast radius)
        for (let i = 0; i < this.edges.length; i++) {
          if (visitedEdges.has(i)) continue;
          const edge = this.edges[i];
          if (edge.to === nodeId) {
            visitedEdges.add(i);
            currentLevelEdges.push(edge);
            if (!visitedNodes.has(edge.from)) {
              visitedNodes.add(edge.from);
              nextLevelNodes.add(edge.from);
            }
          }
        }
      }

      if (currentLevelEdges.length === 0 && nextLevelNodes.size === 0) break;

      hops.push({
        depth,
        edges: currentLevelEdges,
        nodes: Array.from(nextLevelNodes).map(id => this.nodes.get(id)).filter(Boolean)
      });

      currentLevelNodes = nextLevelNodes;
    }

    return hops;
  }
}

// -------------------------------------------------------------
// 3. Build Architecture Knowledge Graph (Zero-Cloud Ingestion)
// -------------------------------------------------------------
const graph = new KnowledgeGraph();

// A. Ingest Database Tables and Columns from 01-ground-truth/entity-catalog.md
const entityCatalogContent = readFileSafe('01-ground-truth/entity-catalog.md');
if (entityCatalogContent) {
  const tableSections = entityCatalogContent.split(/(?:^##\s+\d+\.\s+Entity:\s+`|^- \*\*Database Table\*\*:\s+`)/m);

  tableSections.forEach(section => {
    const headerMatch = section.match(/^([^`\n]+)`/);
    if (!headerMatch) return;
    const fullTableName = headerMatch[1].trim();
    const tableNodeId = `table:${fullTableName.toLowerCase()}`;
    const simpleName = fullTableName.includes('.') ? fullTableName.split('.')[1] : fullTableName;

    graph.addNode({
      id: tableNodeId,
      type: 'TABLE',
      label: fullTableName,
      provenance: `[SRC:DDL:${fullTableName}]`,
      meta: { simpleName }
    });

    // Also alias by simple name if schema is prefixed
    if (simpleName !== fullTableName) {
      const aliasId = `table:${simpleName.toLowerCase()}`;
      graph.addNode({ id: aliasId, type: 'TABLE', label: simpleName, provenance: `[SRC:DDL:${fullTableName}]` });
      graph.addEdge(aliasId, tableNodeId, 'SCHEMA_ALIAS', 'resolves to');
    }

    // Extract columns from table schema markdown
    const colMatches = section.matchAll(/\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]*)\|/g);
    for (const cm of colMatches) {
      const colName = cm[1].trim();
      const colType = cm[2].trim();
      const isNullable = cm[3].trim();
      if (colName === 'Column' || colName.includes('---')) continue;

      const colNodeId = `column:${fullTableName.toLowerCase()}.${colName.toLowerCase()}`;
      graph.addNode({
        id: colNodeId,
        type: 'COLUMN',
        label: `${fullTableName}.${colName}`,
        provenance: `[SRC:DDL:${fullTableName}#${colName}]`,
        meta: { table: fullTableName, column: colName, type: colType, isNullable }
      });
      graph.addEdge(tableNodeId, colNodeId, 'CONTAINS_COLUMN', 'has column');

      // Standalone column name alias for search
      const simpleColId = `col_name:${colName.toLowerCase()}`;
      graph.addNode({ id: simpleColId, type: 'COLUMN_NAME', label: colName });
      graph.addEdge(simpleColId, colNodeId, 'DEFINED_IN', fullTableName);
    }
  });
}

// B. Ingest Internal Microservice Endpoints from 01-ground-truth/api-inventory.md Part 1
const apiInventoryContent = readFileSafe('01-ground-truth/api-inventory.md');
if (apiInventoryContent) {
  const internalSection = apiInventoryContent.split('## 🌐 Part 2: External Surrounding Systems')[0];
  const serviceBlocks = internalSection.split(/^####\s+📦\s+`([^`]+)`/m);

  for (let i = 1; i < serviceBlocks.length; i += 2) {
    const svcName = serviceBlocks[i].trim();
    const svcContent = serviceBlocks[i + 1] || '';
    const svcNodeId = `service:${svcName.toLowerCase()}`;

    graph.addNode({
      id: svcNodeId,
      type: 'SERVICE',
      label: svcName,
      provenance: `[SRC:CODE:${svcName}]`
    });

    const epMatches = svcContent.matchAll(/^-\s+`([A-Z]+)\s+([^`]+)`\s*(?:—\s*(.*?))?(?:\[SRC:([^\]]+)\])?$/gm);
    for (const em of epMatches) {
      const method = em[1].toUpperCase();
      const epPath = em[2].trim();
      const desc = em[3] ? em[3].trim() : 'API Operation';
      const prov = em[4] ? `[SRC:${em[4]}]` : `[SRC:CODE:${svcName}]`;

      const epNodeId = `endpoint:${method} ${epPath.toLowerCase()}`;
      graph.addNode({
        id: epNodeId,
        type: 'ENDPOINT',
        label: `${method} ${epPath}`,
        provenance: prov,
        meta: { service: svcName, method, path: epPath, description: desc }
      });

      graph.addEdge(svcNodeId, epNodeId, 'EXPOSES_ENDPOINT', `${method} ${epPath}`);

      // Link endpoint to potential database tables by keyword match
      const pathTokens = epPath.toLowerCase().split(/[^a-z0-9]+/);
      pathTokens.forEach(token => {
        if (!token || ['api', 'apis', 'v1', 'v2', 'v3', 'internal', 'public'].includes(token)) return;
        const potentialTableId = `table:${token}`;
        const potentialTblId = `table:tbl_${token}`;
        if (graph.nodes.has(potentialTableId)) {
          graph.addEdge(epNodeId, potentialTableId, 'PERSISTS_TO', 'reads/writes data');
        } else if (graph.nodes.has(potentialTblId)) {
          graph.addEdge(epNodeId, potentialTblId, 'PERSISTS_TO', 'reads/writes data');
        }
      });
    }
  }

  // C. Ingest External Surrounding Systems from 01-ground-truth/api-inventory.md Part 2
  if (apiInventoryContent.includes('## 🌐 Part 2: External Surrounding Systems')) {
    const externalSection = apiInventoryContent.split('## 🌐 Part 2: External Surrounding Systems')[1];
    const sysBlocks = externalSection.split(/^####\s+🌐\s+`([^`]+)`(?::\s*(.*))?/m);

    for (let i = 1; i < sysBlocks.length; i += 3) {
      const sysCode = sysBlocks[i].trim();
      const sysName = sysBlocks[i + 1] ? sysBlocks[i + 1].trim() : sysCode;
      const sysContent = sysBlocks[i + 2] || '';
      const sysNodeId = `surrounding:${sysCode.toLowerCase()}`;

      graph.addNode({
        id: sysNodeId,
        type: 'SURROUNDING_SYSTEM',
        label: `${sysCode} (${sysName})`,
        provenance: `[SRC:IFA:${sysCode}]`,
        meta: { code: sysCode, name: sysName }
      });

      const extEpMatches = sysContent.matchAll(/^-\s+`([A-Z]+)\s+([^`]+)`\s*(?:—\s*(.*?))?(?:\[SRC:([^\]]+)\])?$/gm);
      for (const em of extEpMatches) {
        const method = em[1].toUpperCase();
        const epPath = em[2].trim();
        const desc = em[3] ? em[3].trim() : 'External Integration';
        const prov = em[4] ? `[SRC:${em[4]}]` : `[SRC:IFA:${sysCode}]`;

        const extEpNodeId = `external_endpoint:${method} ${epPath.toLowerCase()}`;
        graph.addNode({
          id: extEpNodeId,
          type: 'EXTERNAL_ENDPOINT',
          label: `${method} ${epPath}`,
          provenance: prov,
          meta: { system: sysCode, description: desc }
        });

        graph.addEdge(sysNodeId, extEpNodeId, 'PROVIDES_API', `${method} ${epPath}`);

        // If provenance links to an internal service, add caller edge
        const callerMatch = prov.match(/CODE:(?:potloc-sitesense\/|repo\/backend\/)?([a-zA-Z0-9_-]+)\//i);
        if (callerMatch) {
          const callerSvcId = `service:${callerMatch[1].toLowerCase()}`;
          if (graph.nodes.has(callerSvcId)) {
            graph.addEdge(callerSvcId, sysNodeId, 'CALLS_EXTERNAL', `${method} ${epPath}`);
            graph.addEdge(callerSvcId, extEpNodeId, 'INVOKES', prov);
          }
        }
      }
    }
  }
}

// D. Ingest Sequence Diagrams from 04-deliverables/sequence-diagrams/
const pumlFiles = findFiles('04-deliverables/sequence-diagrams', '.puml');
pumlFiles.forEach(file => {
  const content = readFileSafe(path.relative(targetDir, file));
  const relPath = path.relative(targetDir, file);
  const baseName = path.basename(file, '.puml');
  const seqNodeId = `sequence:${baseName.toLowerCase()}`;

  graph.addNode({
    id: seqNodeId,
    type: 'SEQUENCE_DIAGRAM',
    label: baseName,
    provenance: `[SRC:${relPath}]`,
    meta: { file: relPath }
  });

  // Extract endpoints mentioned in sequence ingress
  const ingressMatch = content.match(/f\s*->\s*gw\s*:\s*([A-Z]+)\s+([^\n\\]+)/i);
  if (ingressMatch) {
    const method = ingressMatch[1].toUpperCase();
    const epPath = ingressMatch[2].trim();
    const epNodeId = `endpoint:${method} ${epPath.toLowerCase()}`;
    if (graph.nodes.has(epNodeId)) {
      graph.addEdge(seqNodeId, epNodeId, 'MODELS_ENDPOINT', `${method} ${epPath}`);
    }
  }

  // Extract database tables accessed in sequence diagram
  const dbMatches = content.matchAll(/\[SRC:DDL:([^\]]+)\]/g);
  for (const dm of dbMatches) {
    const tblName = dm[1].trim().toLowerCase();
    const tableNodeId = `table:${tblName}`;
    if (graph.nodes.has(tableNodeId)) {
      graph.addEdge(seqNodeId, tableNodeId, 'MODELS_PERSISTENCE', `accesses ${tblName}`);
    }
  }

  // Extract external participants
  const extParticipantMatches = content.matchAll(/participant\s+"[^"]*?([A-Za-z0-9\s/_-]+)[^"]*?"\s+as\s+([a-zA-Z0-9_]+)/g);
  for (const pm of extParticipantMatches) {
    const rawLabel = pm[1].replace(/[*_\n]/g, '').trim();
    const alias = pm[2].toLowerCase();
    if (alias === 'f' || alias === 'gw' || alias === 'svc' || alias === 'db' || alias === 'cache') continue;

    for (const [id, node] of graph.nodes.entries()) {
      if (node.type === 'SURROUNDING_SYSTEM' && (node.label.toLowerCase().includes(rawLabel.toLowerCase()) || rawLabel.toLowerCase().includes(node.meta.code.toLowerCase()))) {
        graph.addEdge(seqNodeId, id, 'MODELS_OUTBOUND_CALL', rawLabel);
      }
    }
  }
});

// E. Ingest Architectural Decision Records (ADRs) from 05-adrs/
const adrFiles = findFiles('05-adrs', '.md');
adrFiles.forEach(file => {
  const content = readFileSafe(path.relative(targetDir, file));
  const relPath = path.relative(targetDir, file);
  const baseName = path.basename(file, '.md');
  const adrNodeId = `adr:${baseName.toLowerCase()}`;

  const titleMatch = content.match(/^#\s+(?:ADR-?\d*[:\s]+)?(.*)/m);
  const title = titleMatch ? titleMatch[1].trim() : baseName;

  graph.addNode({
    id: adrNodeId,
    type: 'ADR',
    label: `${baseName}: ${title}`,
    provenance: `[SRC:${relPath}]`,
    meta: { file: relPath }
  });

  // Link ADR to mentioned services, tables, or surrounding systems
  for (const [id, node] of graph.nodes.entries()) {
    if (node.type === 'SERVICE' || node.type === 'TABLE' || node.type === 'SURROUNDING_SYSTEM') {
      const needle = node.label.toLowerCase();
      if (content.toLowerCase().includes(needle)) {
        graph.addEdge(adrNodeId, id, 'GOVERNS', `governs ${node.label}`);
      }
    }
  }
});

// F. Ingest Constraint Branch Scenarios from 03-constraint-branches/
const scenarioFiles = findFiles('03-constraint-branches', '.md');
scenarioFiles.forEach(file => {
  const content = readFileSafe(path.relative(targetDir, file));
  const relPath = path.relative(targetDir, file);
  const baseName = path.basename(file, '.md');
  const scnNodeId = `scenario:${baseName.toLowerCase()}`;

  graph.addNode({
    id: scnNodeId,
    type: 'SCENARIO',
    label: baseName,
    provenance: `[SRC:${relPath}]`,
    meta: { file: relPath }
  });

  // Link scenario to mentioned components
  for (const [id, node] of graph.nodes.entries()) {
    if (['SERVICE', 'TABLE', 'SURROUNDING_SYSTEM', 'ENDPOINT'].includes(node.type)) {
      if (content.toLowerCase().includes(node.label.toLowerCase())) {
        graph.addEdge(scnNodeId, id, 'EXPLORES_CONSTRAINT', `affects ${node.label}`);
      }
    }
  }
});

// -------------------------------------------------------------
// 4. Execute Multi-Hop Reasoning & Traversal
// -------------------------------------------------------------
const matchingRoots = graph.findNodesByQuery(targetQuery);

if (matchingRoots.length === 0) {
  console.log(`\n❌ [NOT FOUND IN ARCHITECTURE GRAPH] No node matching '${targetQuery}' detected.`);
  console.log(`   Checked tables, columns, endpoints, services, surrounding systems, ADRs, and scenarios.`);
  console.log(`   Run './brain query ${targetQuery}' or inspect '01-ground-truth/' for canonical definitions.\n`);
  process.exit(1);
}

const rootNode = matchingRoots[0];
const rootIds = [rootNode.id];
const traversalHops = graph.traverse(rootIds, maxHops);

// Aggregate all unique affected nodes across hops
const affectedByPillar = {
  data: [],
  interfaces: [],
  deliverables: [],
  governance: [],
  integrations: []
};

const allAffectedNodeIds = new Set();
traversalHops.forEach(hop => {
  hop.nodes.forEach(node => {
    if (allAffectedNodeIds.has(node.id) || node.id === rootNode.id) return;
    allAffectedNodeIds.add(node.id);

    if (node.type === 'TABLE' || node.type === 'COLUMN' || node.type === 'COLUMN_NAME') {
      affectedByPillar.data.push(node);
    } else if (node.type === 'ENDPOINT' || node.type === 'SERVICE') {
      affectedByPillar.interfaces.push(node);
    } else if (node.type === 'SEQUENCE_DIAGRAM' || node.type === 'CONTRACT') {
      affectedByPillar.deliverables.push(node);
    } else if (node.type === 'ADR' || node.type === 'SCENARIO') {
      affectedByPillar.governance.push(node);
    } else if (node.type === 'SURROUNDING_SYSTEM' || node.type === 'EXTERNAL_ENDPOINT') {
      affectedByPillar.integrations.push(node);
    }
  });
});

// -------------------------------------------------------------
// 5. Deterministic Risk Assessment Calculation
// -------------------------------------------------------------
let riskLevel = 'LOW';
let riskBadge = '[PASS] LOW RISK';
let riskRationale = 'Localized modification with contained internal blast radius.';

const totalAffected = allAffectedNodeIds.size;
const hasExternalImpact = affectedByPillar.integrations.length > 0;
const hasDataImpact = affectedByPillar.data.length > 0;
const hasGovernanceImpact = affectedByPillar.governance.length > 0;

if (hasExternalImpact && totalAffected >= 5) {
  riskLevel = 'CRITICAL';
  riskBadge = '[BLOCK] CRITICAL RISK';
  riskRationale = 'Multi-hop ripple directly impacts external surrounding systems and cross-service boundaries.';
} else if (totalAffected >= 6 || (hasDataImpact && affectedByPillar.interfaces.length >= 3)) {
  riskLevel = 'HIGH';
  riskBadge = '[BLOCK] HIGH RISK';
  riskRationale = 'Widespread blast radius spanning database persistence, multiple API ingress routes, and sequence deliverables.';
} else if (totalAffected >= 2) {
  riskLevel = 'MEDIUM';
  riskBadge = '[WARN] MEDIUM RISK';
  riskRationale = 'Moderate blast radius affecting localized service contracts, database schemas, and associated sequence diagrams.';
}

// -------------------------------------------------------------
// 6. Output Formatting (JSON or Monospace Terminal UI)
// -------------------------------------------------------------
if (isJson) {
  console.log(JSON.stringify({
    targetQuery,
    matchedRoot: rootNode,
    maxHops,
    risk: { level: riskLevel, rationale: riskRationale },
    totalNodesInGraph: graph.nodes.size,
    totalEdgesInGraph: graph.edges.length,
    totalAffectedComponents: totalAffected,
    traversalHops: traversalHops.map(h => ({
      depth: h.depth,
      edgeCount: h.edges.length,
      nodeCount: h.nodes.length,
      nodes: h.nodes.map(n => ({ id: n.id, type: n.type, label: n.label, provenance: n.provenance }))
    })),
    pillarBreakdown: affectedByPillar
  }, null, 2));
  process.exit(0);
}

console.log(`\n⚡ Second Brain Level 5 Architecture Knowledge Graph (AKG) Blast Radius Analyzer\n`);

console.log(`┌────────────────────────────────────────────────────────────┐`);
console.log(`│             BLAST RADIUS & CR IMPACT SCORECARD             │`);
console.log(`├────────────────────────────────────────────────────────────┤`);
console.log(`│ Target Element Evaluated           : ${String(rootNode.label).padEnd(21)} │`);
console.log(`│ Element Type / Provenance          : ${String(rootNode.type).padEnd(21)} │`);
console.log(`│ Multi-Hop Graph Traversal Depth    : ${String(maxHops + ' Hops (Level 5 AKG)').padEnd(21)} │`);
console.log(`│ Total Graph Nodes / Edges Indexed  : ${String(graph.nodes.size + ' Nodes | ' + graph.edges.length + ' Edges').padEnd(21)} │`);
console.log(`│ Total Affected Downstream Elements : ${String(totalAffected + ' Components').padEnd(21)} │`);
console.log(`├────────────────────────────────────────────────────────────┤`);
console.log(`│ OVERALL CHANGE RISK ASSESSMENT     : ${riskBadge.padEnd(21)} │`);
console.log(`│ RATIONALE                          : ${riskRationale.slice(0, 21).padEnd(21)} │`);
console.log(`└────────────────────────────────────────────────────────────┘\n`);

console.log(`🌐 Multi-Hop Traversal Chain for '${rootNode.label}':`);
traversalHops.forEach(hop => {
  console.log(`\n  📍 Hop ${hop.depth} (Depth ${hop.depth} Connections — ${hop.nodes.length} Component(s)):`);
  hop.edges.slice(0, 8).forEach(edge => {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    console.log(`     • [${edge.type}] ${fromNode?.label || edge.from} ──(${edge.label || 'relates to'})──> ${toNode?.label || edge.to}`);
  });
  if (hop.edges.length > 8) {
    console.log(`     ... and ${hop.edges.length - 8} additional relationship edge(s)`);
  }
});

console.log(`\n📊 5-Vector Architectural Blast Radius Matrix:`);

console.log(`\n  1. 🗄️ Database & Schema Layer (${affectedByPillar.data.length} Component(s)):`);
if (affectedByPillar.data.length > 0) {
  affectedByPillar.data.forEach(d => console.log(`     • [${d.type}] ${d.label} ${d.provenance ? `<${d.provenance}>` : ''}`));
} else {
  console.log(`     • No direct database schema modifications required.`);
}

console.log(`\n  2. 🔌 Internal APIs & Services (${affectedByPillar.interfaces.length} Component(s)):`);
if (affectedByPillar.interfaces.length > 0) {
  affectedByPillar.interfaces.forEach(i => console.log(`     • [${i.type}] ${i.label} ${i.provenance ? `<${i.provenance}>` : ''}`));
} else {
  console.log(`     • No internal API routing adjustments identified.`);
}

console.log(`\n  3. 📑 Deliverables & Sequence Flows (${affectedByPillar.deliverables.length} Component(s)):`);
if (affectedByPillar.deliverables.length > 0) {
  affectedByPillar.deliverables.slice(0, 10).forEach(dl => console.log(`     • [${dl.type}] ${dl.label} (${dl.meta.file || ''})`));
  if (affectedByPillar.deliverables.length > 10) {
    console.log(`     ... and ${affectedByPillar.deliverables.length - 10} more sequence diagram(s)`);
  }
} else {
  console.log(`     • Existing sequence diagrams remain valid.`);
}

console.log(`\n  4. 🌐 External Surrounding Systems & IFAs (${affectedByPillar.integrations.length} Component(s)):`);
if (affectedByPillar.integrations.length > 0) {
  affectedByPillar.integrations.forEach(intg => console.log(`     • [${intg.type}] ${intg.label} ${intg.provenance ? `<${intg.provenance}>` : ''}`));
} else {
  console.log(`     • Zero outbound partner/surrounding integration fallout.`);
}

console.log(`\n  5. 🏛️ Architectural Governance & ADRs (${affectedByPillar.governance.length} Component(s)):`);
if (affectedByPillar.governance.length > 0) {
  affectedByPillar.governance.forEach(gov => console.log(`     • [${gov.type}] ${gov.label}`));
} else {
  console.log(`     • Governed by existing canonical system rules.`);
}

console.log(`\n🛠️ Actionable Technical Recommendations:`);
if (rootNode.type === 'TABLE' || rootNode.type === 'COLUMN') {
  console.log(`  1. Schema Migration: If modifying schema, verify NULLABLE constraints or provide a DEFAULT to avoid table-lock on production.`);
  console.log(`  2. Backward Compatibility: Maintain legacy column reading during rolling deployment.`);
  console.log(`  3. Deliverable Sync: Run './brain deliver apis' to synchronize sequence diagram payloads.`);
} else if (rootNode.type === 'ENDPOINT') {
  console.log(`  1. Ingress SLA: Verify API Gateway (KrakenD) timeout mappings and rate-limiting rules.`);
  console.log(`  2. Consumer Notification: If changing contract shape, verify client web/mobile teams are aligned.`);
} else if (rootNode.type === 'SURROUNDING_SYSTEM') {
  console.log(`  1. IFA Alignment: Verify enterprise partner SLA and circuit breaker / retry parameters.`);
  console.log(`  2. Fallout Playbook: Ensure failed callbacks or timeout exceptions route to dead-letter queue (DLQ).`);
} else {
  console.log(`  1. Standard change review and regression test suite execution recommended.`);
}
console.log('');

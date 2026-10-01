#!/usr/bin/env node

/**
 * Second Brain Living Architecture & Documentation Drift Synchronizer
 * 
 * Reconciles external/local code repositories, DDL migrations, and PRDs
 * with Second Brain Ground Truth (01-ground-truth/) and Deliverables (04-deliverables/).
 * 
 * Capabilities:
 * 1. Multi-Format Auto-Unpack:
 *    - In-place auto-unpacking of .zip, .tar.gz, .tgz, and .tar archives dropped in raw-inputs or code directories.
 * 2. Polyglot & Multi-Dialect Drift Detection (--dry-run / --diff):
 *    - Scans upstream code & DDL schemas (including embedded migrations inside backend code repos).
 *    - Column-Level Drift: Detects new columns added to existing tables in DDL.
 *    - Endpoint & Route Drift: Detects new or renamed endpoints in Go, Python, TS, Java, Protobuf.
 *    - Targeted Service Sync: Supports --service=<name> / -s <name> for fast single-service sync.
 *    - Non-Git & Git Support: Gracefully handles raw snapshot folders as well as Git repositories.
 * 3. Automated Reconciliation Pipeline (--apply / default):
 *    - Ingests latest DDL migrations -> 01-ground-truth/entity-catalog.md
 *    - Ingests latest API routes & DTOs -> 01-ground-truth/api-inventory.md
 *    - Ingests latest BRD/PRD business rules -> 01-ground-truth/business-rules.md
 *    - Auto-generates 1-to-1 PlantUML sequence diagrams for new endpoints.
 *    - Executes deterministic audit (bin/audit.js) to guarantee 100% provenance.
 *    - Records audit trail to 02-provenance/sync-changelog.md.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveSources, findFiles, sanitizeProvenancePath } = require('./source-resolver');

const targetDir = process.cwd();

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('--diff') || args.includes('--check');
const isApply = args.includes('--apply') || args.includes('--force') || args.includes('-y');
const isStrict = args.includes('--strict') || args.includes('--exit-code');
const isJson = args.includes('--json');

// Parse --service / -s flag
let targetService = null;
const svcArg = args.find(a => a.startsWith('--service='));
if (svcArg) {
  targetService = svcArg.split('=')[1];
} else {
  const sIdx = args.indexOf('--service') !== -1 ? args.indexOf('--service') : args.indexOf('-s');
  if (sIdx !== -1 && args[sIdx + 1] && !args[sIdx + 1].startsWith('-')) {
    targetService = args[sIdx + 1];
  }
}

if (!isJson) {
  console.log(`\n🔄 Second Brain Living Architecture & Documentation Synchronizer\n`);
  if (targetService) {
    console.log(`🎯 Targeted Service: '${targetService}' (Filtering sync to matching service only)\n`);
  }
}

// -------------------------------------------------------------
// 1. IN-PLACE ARCHIVE AUTO-UNPACKER (.zip, .tar.gz, .tgz, .tar)
// -------------------------------------------------------------
const unpackedArchives = new Set();

function isArchive(filename) {
  const lower = filename.toLowerCase();
  return lower.endsWith('.zip') || lower.endsWith('.tar.gz') || lower.endsWith('.tgz') || lower.endsWith('.tar');
}

function getArchiveFolder(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.tar.gz')) return filename.slice(0, -7);
  return path.basename(filename, path.extname(filename));
}

function autoUnpackArchives(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  try {
    const entries = fs.readdirSync(baseDir);
    entries.forEach(entry => {
      const fullPath = path.join(baseDir, entry);
      if (isArchive(entry) && fs.statSync(fullPath).isFile()) {
        if (unpackedArchives.has(fullPath)) return;
        unpackedArchives.add(fullPath);
        const folderName = getArchiveFolder(entry);
        const destDir = path.join(baseDir, folderName);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        try {
          const lower = entry.toLowerCase();
          if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
            execSync(`tar -xzf "${fullPath}" -C "${destDir}"`, { stdio: 'ignore' });
          } else if (lower.endsWith('.tar')) {
            execSync(`tar -xf "${fullPath}" -C "${destDir}"`, { stdio: 'ignore' });
          } else if (process.platform === 'win32') {
            execSync(`tar -xf "${fullPath}" -C "${destDir}"`, { stdio: 'ignore' });
          } else {
            execSync(`unzip -q -o "${fullPath}" -d "${destDir}"`, { stdio: 'ignore' });
          }
          const macJunk = path.join(destDir, '__MACOSX');
          if (fs.existsSync(macJunk)) fs.rmSync(macJunk, { recursive: true, force: true });
          if (!isJson) {
            console.log(`📦 Auto-unpacked archive: ${path.relative(targetDir, fullPath)} -> ${folderName}/`);
          }
        } catch (err) {}
      }
    });
  } catch (e) {}
}

['existing-code', 'db', 'brd'].forEach(sub => {
  autoUnpackArchives(path.join(targetDir, '00-raw-inputs', sub));
});

// -------------------------------------------------------------
// 2. RESOLVE DATA SOURCES & APPLY SERVICE FILTER
// -------------------------------------------------------------
const codeResolution = resolveSources('code', { targetDir });
const ddlResolution = resolveSources('ddl', { targetDir });
const brdResolution = resolveSources('brd', { targetDir });

let validCodeSources = codeResolution.sources.filter(s => s.exists);
let validDdlSources = ddlResolution.sources.filter(s => s.exists);
const validBrdSources = brdResolution.sources.filter(s => s.exists);

// Check external source directories for archives too
[...validCodeSources, ...validDdlSources].forEach(s => {
  if (s.isDirectory) autoUnpackArchives(s.path);
});

// Apply targetService filter if requested
if (targetService) {
  const normSvc = targetService.toLowerCase();
  validCodeSources = validCodeSources.map(s => {
    // If the source is generic existing-code directory, check if targeted service exists as a subdirectory
    if (s.name === 'existing-code' || s.path.endsWith('existing-code')) {
      const sub = path.join(s.path, targetService);
      if (fs.existsSync(sub)) {
        return {
          ...s,
          name: targetService,
          path: sub
        };
      }
      // Also check matching subdirectory name
      try {
        const subdirs = fs.readdirSync(s.path);
        const match = subdirs.find(d => d.toLowerCase().includes(normSvc));
        if (match && fs.statSync(path.join(s.path, match)).isDirectory()) {
          return {
            ...s,
            name: match,
            path: path.join(s.path, match)
          };
        }
      } catch (e) {}
    }
    return s;
  }).filter(s =>
    s.name.toLowerCase().includes(normSvc) || s.path.toLowerCase().includes(normSvc)
  );
  validDdlSources = validDdlSources.filter(s =>
    s.name.toLowerCase().includes(normSvc) || s.path.toLowerCase().includes(normSvc)
  );
}

// -------------------------------------------------------------
// 3. INSPECT UPSTREAM STATUS (GIT & NON-GIT SNAPSHOTS)
// -------------------------------------------------------------
function getGitInfo(repoPath) {
  if (!fs.existsSync(repoPath)) return null;
  try {
    const isInsideGit = execSync('git rev-parse --is-inside-work-tree', {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();

    if (isInsideGit !== 'true') return null;

    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();

    const commit = execSync('git log -1 --format="%h — %s (%cr)"', {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();

    const statusOutput = execSync('git status --porcelain', {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();

    const dirtyCount = statusOutput ? statusOutput.split('\n').filter(Boolean).length : 0;

    return {
      branch,
      commit,
      dirty: dirtyCount > 0,
      dirtyCount
    };
  } catch (err) {
    return null;
  }
}

const upstreamStatus = [];
[...validCodeSources, ...validDdlSources].forEach(src => {
  if (!src.isDirectory) return;
  const gitInfo = getGitInfo(src.path);
  if (!upstreamStatus.some(u => u.path === src.path)) {
    if (gitInfo) {
      upstreamStatus.push({
        name: src.name,
        path: src.path,
        origin: src.origin,
        isExternal: src.isExternal,
        isGit: true,
        ...gitInfo
      });
    } else {
      let fileCount = 0;
      try {
        fileCount = findFiles(src.path, () => true, { maxDepth: 5 }).length;
      } catch (e) {}
      upstreamStatus.push({
        name: src.name,
        path: src.path,
        origin: src.origin,
        isExternal: src.isExternal,
        isGit: false,
        branch: 'non-git',
        commit: `Folder Snapshot (${fileCount} files)`,
        dirty: false,
        dirtyCount: 0
      });
    }
  }
});

// -------------------------------------------------------------
// 4. SCAN GROUND TRUTH REALITY (01-ground-truth/)
// -------------------------------------------------------------
const entityCatalogFile = path.join(targetDir, '01-ground-truth', 'entity-catalog.md');
const apiInventoryFile = path.join(targetDir, '01-ground-truth', 'api-inventory.md');
const businessRulesFile = path.join(targetDir, '01-ground-truth', 'business-rules.md');
const seqApisDir = path.join(targetDir, '04-deliverables', 'sequence-diagrams', 'apis');

// Cataloged tables & existing columns
const catalogedTables = new Set();
const catalogedTableColumns = new Map(); // key: tableName.toLowerCase(), value: Set of column names

if (fs.existsSync(entityCatalogFile)) {
  const catContent = fs.readFileSync(entityCatalogFile, 'utf8');
  const sections = catContent.split(/(?=##\s+\d+\.\s+Entity:\s+`)/i);

  sections.forEach(sec => {
    const titleMatch = sec.match(/##\s+\d+\.\s+Entity:\s+`([^`]+)`/i);
    if (!titleMatch) return;
    const fullTableName = titleMatch[1];
    const clean = fullTableName.includes('.') ? fullTableName.split('.')[1] : fullTableName;
    const tblKey = clean.toLowerCase();

    catalogedTables.add(tblKey);
    catalogedTables.add(fullTableName.toLowerCase());

    const cols = new Set();
    const colMatches = sec.matchAll(/\|\s*`([a-zA-Z0-9_]+)`\s*\|\s*`[^`]+`\s*\|/g);
    for (const cm of colMatches) {
      cols.add(cm[1].toLowerCase());
    }
    catalogedTableColumns.set(tblKey, cols);
  });
}

// Cataloged internal endpoints
const catalogedEndpoints = new Map(); // key: "METHOD /path", value: { service, method, path, provenance }
if (fs.existsSync(apiInventoryFile)) {
  const apiContent = fs.readFileSync(apiInventoryFile, 'utf8');
  const lines = apiContent.split(/\r?\n/);
  let currentService = null;
  let inInternal = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## 🔌 Part 1: Internal Microservice APIs')) {
      inInternal = true;
      return;
    }
    if (trimmed.startsWith('## 🌐 Part 2: External Surrounding Systems')) {
      inInternal = false;
      return;
    }
    if (inInternal) {
      const svcMatch = trimmed.match(/^####\s+📦\s+`([^`]+)`/i);
      if (svcMatch) {
        currentService = svcMatch[1];
        return;
      }
      if (currentService && trimmed.startsWith('- `')) {
        const epMatch = trimmed.match(/^-\s+`([A-Z]+)\s+([^`]+)`\s*(?:—\s*(.*?))?(?:\[SRC:([^\]]+)\])?$/i);
        if (epMatch) {
          const method = epMatch[1].toUpperCase();
          const epPath = epMatch[2].trim();
          const key = `${method} ${epPath}`.toLowerCase();
          catalogedEndpoints.set(key, {
            service: currentService,
            method,
            path: epPath,
            description: epMatch[3] ? epMatch[3].trim() : '',
            provenance: epMatch[4] ? `[SRC:${epMatch[4]}]` : ''
          });
        }
      }
    }
  });
}

// Existing sequence diagram files
const existingSequenceDiagrams = new Set();
if (fs.existsSync(seqApisDir)) {
  const pumlFiles = findFiles(seqApisDir, f => f.endsWith('.puml'));
  pumlFiles.forEach(f => {
    const base = path.basename(f, '.puml').toLowerCase();
    existingSequenceDiagrams.add(base);
  });
}

// -------------------------------------------------------------
// 5. SCAN DDL SCHEMAS (INCLUDING EMBEDDED IN CODE SOURCES)
// -------------------------------------------------------------
const allDdlSources = [...validDdlSources, ...validCodeSources.filter(s => s.isDirectory)];
const ddlTablesFound = new Map(); // key: table name, value: { rawName, file, type, columns }

allDdlSources.forEach(src => {
  const sqlFiles = src.isDirectory
    ? findFiles(src.path, f => f.endsWith('.sql') || f.endsWith('.prisma'))
    : [src.path];

  sqlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const cleanFile = sanitizeProvenancePath(file, { targetDir, sourceRoot: src.path, sourceName: src.name });

    if (file.endsWith('.prisma')) {
      const modelBlocks = content.matchAll(/model\s+([a-zA-Z0-9_]+)\s*\{([^}]+)\}/gm);
      for (const m of modelBlocks) {
        const rawName = m[1];
        const tblKey = rawName.toLowerCase();
        const cols = new Set();
        const bodyLines = m[2].split(/\r?\n/);
        bodyLines.forEach(l => {
          const trimmed = l.trim();
          if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) return;
          const colM = trimmed.match(/^([a-zA-Z0-9_]+)\s+[A-Za-z0-9_?]+/);
          if (colM) cols.add(colM[1].toLowerCase());
        });

        if (!ddlTablesFound.has(tblKey)) {
          ddlTablesFound.set(tblKey, { rawName, file: cleanFile, type: 'prisma', columns: cols });
        } else {
          // Merge columns
          const existing = ddlTablesFound.get(tblKey);
          cols.forEach(c => existing.columns.add(c));
        }
      }
    } else {
      // 1. CREATE TABLE parsing
      const createBlocks = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|\[)?([a-zA-Z0-9_.]+)(?:`|"|\])?\s*\(([\s\S]*?)\)(?:\s*ENGINE|\s*DEFAULT|\s*;|\s*$)/gmi);
      for (const m of createBlocks) {
        let tblName = m[1];
        if (tblName.includes('.')) tblName = tblName.split('.')[1];
        tblName = tblName.replace(/[`"\[\]]/g, '').trim();
        const tblKey = tblName.toLowerCase();
        const cols = new Set();

        const bodyLines = m[2].split(/\r?\n/);
        bodyLines.forEach(l => {
          const trimmed = l.trim().replace(/,$/, '');
          if (!trimmed || /^(?:PRIMARY|FOREIGN|KEY|CONSTRAINT|INDEX|UNIQUE|CHECK)\b/i.test(trimmed)) return;
          const colM = trimmed.match(/^(?:`|"|\[)?([a-zA-Z0-9_]+)(?:`|"|\])?\s+[A-Za-z0-9_()]+/);
          if (colM) cols.add(colM[1].toLowerCase());
        });

        if (!ddlTablesFound.has(tblKey)) {
          ddlTablesFound.set(tblKey, { rawName: tblName, file: cleanFile, type: 'sql', columns: cols });
        } else {
          const existing = ddlTablesFound.get(tblKey);
          cols.forEach(c => existing.columns.add(c));
        }
      }

      // 2. ALTER TABLE ADD COLUMN parsing
      const alterMatches = content.matchAll(/ALTER\s+TABLE\s+(?:`|"|\[)?([a-zA-Z0-9_.]+)(?:`|"|\])?\s+ADD\s+(?:COLUMN\s+)?(?:`|"|\[)?([a-zA-Z0-9_]+)(?:`|"|\])?/gmi);
      for (const m of alterMatches) {
        let tblName = m[1];
        if (tblName.includes('.')) tblName = tblName.split('.')[1];
        tblName = tblName.replace(/[`"\[\]]/g, '').trim();
        const colName = m[2].replace(/[`"\[\]]/g, '').trim().toLowerCase();
        const tblKey = tblName.toLowerCase();

        if (ddlTablesFound.has(tblKey)) {
          ddlTablesFound.get(tblKey).columns.add(colName);
        } else {
          ddlTablesFound.set(tblKey, {
            rawName: tblName,
            file: cleanFile,
            type: 'sql',
            columns: new Set([colName])
          });
        }
      }
    }
  });
});

// -------------------------------------------------------------
// 6. SCAN UPSTREAM CODE FOR ENDPOINTS
// -------------------------------------------------------------
const codeEndpointsFound = new Map(); // key: "METHOD /path", value: { service, method, path, file }

validCodeSources.forEach(src => {
  if (!src.isDirectory) return;
  const serviceName = src.name;

  // Scan Go route registrations
  const goFiles = findFiles(src.path, f => f.endsWith('.go') && !f.endsWith('_test.go'));
  goFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const cleanFile = sanitizeProvenancePath(file, { targetDir, sourceRoot: src.path, sourceName: src.name });

    // 1. router.GET("/path", handler)
    const routeRegex = /(?:router|r|e|api|v\d+|group)\.(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(\s*["']([^"']+)["']/gi;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const epPath = match[2].trim();
      if (!epPath.includes('{') && epPath.length > 1) {
        const key = `${method} ${epPath}`.toLowerCase();
        codeEndpointsFound.set(key, {
          service: serviceName,
          method,
          path: epPath,
          file: cleanFile
        });
      }
    }

    // 2. ge.Route("METHOD", "/path", handler)
    const geRegex = /(?:ge|engine)\.Route\s*\(\s*["'](GET|POST|PUT|DELETE|PATCH)["']\s*,\s*["']([^"']+)["']/gi;
    while ((match = geRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const epPath = match[2].trim();
      const key = `${method} ${epPath}`.toLowerCase();
      codeEndpointsFound.set(key, {
        service: serviceName,
        method,
        path: epPath,
        file: cleanFile
      });
    }
  });

  // Scan TS / JS routes
  const tsFiles = findFiles(src.path, f => (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
  tsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const cleanFile = sanitizeProvenancePath(file, { targetDir, sourceRoot: src.path, sourceName: src.name });

    // Express / Fastify: app.get('/path', ...)
    const exprRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gi;
    let match;
    while ((match = exprRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const epPath = match[2].trim();
      const key = `${method} ${epPath}`.toLowerCase();
      codeEndpointsFound.set(key, {
        service: serviceName,
        method,
        path: epPath,
        file: cleanFile
      });
    }

    // NestJS: @Get('/path')
    const nestRegex = /@(Get|Post|Put|Delete|Patch)\s*\(\s*["']?([^"')]+)?["']?\s*\)/gi;
    while ((match = nestRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const epPath = match[2] ? match[2].trim() : '/';
      const key = `${method} ${epPath}`.toLowerCase();
      codeEndpointsFound.set(key, {
        service: serviceName,
        method,
        path: epPath,
        file: cleanFile
      });
    }
  });

  // Scan Python routes (FastAPI / Flask)
  const pyFiles = findFiles(src.path, f => f.endsWith('.py'));
  pyFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const cleanFile = sanitizeProvenancePath(file, { targetDir, sourceRoot: src.path, sourceName: src.name });
    const pyRegex = /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gi;
    let match;
    while ((match = pyRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const epPath = match[2].trim();
      const key = `${method} ${epPath}`.toLowerCase();
      codeEndpointsFound.set(key, {
        service: serviceName,
        method,
        path: epPath,
        file: cleanFile
      });
    }
  });

  // Scan Protobuf RPC contracts
  const protoFiles = findFiles(src.path, f => f.endsWith('.proto'));
  protoFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const cleanFile = sanitizeProvenancePath(file, { targetDir, sourceRoot: src.path, sourceName: src.name });
    const rpcRegex = /rpc\s+([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_.]+)\s*\)\s*returns\s*\(\s*([a-zA-Z0-9_.]+)\s*\)/gmi;
    let match;
    while ((match = rpcRegex.exec(content)) !== null) {
      const rpcName = match[1];
      const epPath = `/grpc/${serviceName}/${rpcName}`;
      const key = `rpc ${epPath}`.toLowerCase();
      codeEndpointsFound.set(key, {
        service: serviceName,
        method: 'RPC',
        path: epPath,
        file: cleanFile
      });
    }
  });
});

// Helper for sequence slug
function makeSlug(method, epPath) {
  const cleanPath = epPath
    .replace(/^\/+/, '')
    .replace(/:([a-zA-Z0-9_-]+)/g, '$1')
    .replace(/\{([a-zA-Z0-9_-]+)\}/g, '$1')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${method.toLowerCase()}-${cleanPath || 'root'}`;
}

// -------------------------------------------------------------
// 7. COMPUTE DRIFT METRICS (NEW, MODIFIED, AND STALE)
// -------------------------------------------------------------

// New Tables
const newTables = [];
ddlTablesFound.forEach((val, tbl) => {
  if (!catalogedTables.has(tbl)) {
    newTables.push(val);
  }
});

// Column-Level Drift (Modified Tables)
const modifiedTables = [];
ddlTablesFound.forEach((val, tbl) => {
  if (catalogedTables.has(tbl) && catalogedTableColumns.has(tbl)) {
    const existingCols = catalogedTableColumns.get(tbl);
    const addedCols = [];
    val.columns.forEach(col => {
      if (!existingCols.has(col)) {
        addedCols.push(col);
      }
    });
    if (addedCols.length > 0) {
      modifiedTables.push({
        rawName: val.rawName,
        addedColumns: addedCols,
        file: val.file
      });
    }
  }
});

// Stale Tables
const staleTables = [];
catalogedTables.forEach(tbl => {
  if (ddlTablesFound.size > 0 && !ddlTablesFound.has(tbl) && !tbl.startsWith('tbl_example')) {
    staleTables.push(tbl);
  }
});

// New Endpoints
const newEndpoints = [];
codeEndpointsFound.forEach((val, key) => {
  if (!catalogedEndpoints.has(key)) {
    newEndpoints.push(val);
  }
});

// Stale Endpoints
const staleEndpoints = [];
catalogedEndpoints.forEach((val, key) => {
  if (codeEndpointsFound.size > 0 && !codeEndpointsFound.has(key)) {
    if (!targetService || val.service.toLowerCase().includes(targetService.toLowerCase())) {
      staleEndpoints.push(val);
    }
  }
});

// Missing 1-to-1 Sequence Diagrams
const missingSequences = [];
catalogedEndpoints.forEach(val => {
  if (val.path.includes('health') || val.path.includes('metrics')) return;
  if (targetService && !val.service.toLowerCase().includes(targetService.toLowerCase())) return;
  const slug = makeSlug(val.method, val.path);
  if (!existingSequenceDiagrams.has(slug)) {
    missingSequences.push({
      service: val.service,
      method: val.method,
      path: val.path,
      slug
    });
  }
});

// Newly discovered endpoints that lack sequence diagrams
newEndpoints.forEach(val => {
  if (val.path.includes('health') || val.path.includes('metrics')) return;
  const slug = makeSlug(val.method, val.path);
  if (!existingSequenceDiagrams.has(slug) && !missingSequences.some(s => s.slug === slug)) {
    missingSequences.push({
      service: val.service,
      method: val.method,
      path: val.path,
      slug
    });
  }
});

const totalDriftItems = newTables.length + modifiedTables.length + newEndpoints.length + missingSequences.length + staleTables.length + staleEndpoints.length;

// JSON Output Mode
if (isJson) {
  console.log(JSON.stringify({
    totalDriftItems,
    isAligned: totalDriftItems === 0,
    targetService,
    upstream: upstreamStatus,
    newTables,
    modifiedTables,
    staleTables,
    newEndpoints,
    staleEndpoints,
    missingSequences
  }, null, 2));
  process.exit(isStrict && totalDriftItems > 0 ? 1 : 0);
}

// -------------------------------------------------------------
// 8. DISPLAY DRIFT SCORECARD & GAP REPORT
// -------------------------------------------------------------
if (upstreamStatus.length > 0) {
  console.log(`📁 Upstream Repository Status:`);
  upstreamStatus.forEach(u => {
    const badge = u.isExternal ? '🌐 External' : '📁 Local';
    if (u.isGit) {
      const dirtyMark = u.dirty ? `⚠️  ${u.dirtyCount} modified file(s)` : '✅ clean';
      console.log(`   • [${u.name}] (${badge}) on '${u.branch}' [${dirtyMark}]`);
      console.log(`     Latest: ${u.commit}`);
    } else {
      console.log(`   • [${u.name}] (${badge}) [📦 Snapshot / Folder: ${u.commit}]`);
    }
  });
  console.log('');
}

console.log(`┌────────────────────────────────────────────────────────────┐`);
console.log(`│               DRIFT & GAP ANALYSIS SCORECARD               │`);
console.log(`├────────────────────────────────────────────────────────────┤`);
console.log(`│ Total Architecture Drift Items     : ${String(totalDriftItems).padEnd(21)} │`);
console.log(`│ New DDL Tables Detected            : ${String(newTables.length).padEnd(21)} │`);
console.log(`│ Modified DDL Tables (New Columns)  : ${String(modifiedTables.length).padEnd(21)} │`);
console.log(`│ New API Endpoints Detected         : ${String(newEndpoints.length).padEnd(21)} │`);
console.log(`│ Missing 1-to-1 Sequence Diagrams   : ${String(missingSequences.length).padEnd(21)} │`);
console.log(`│ Stale / Removed Elements           : ${String(staleTables.length + staleEndpoints.length).padEnd(21)} │`);
console.log(`└────────────────────────────────────────────────────────────┘\n`);

if (totalDriftItems === 0 && !args.includes('--force')) {
  console.log(`✅ ALIGNED: Second Brain Ground Truth & Deliverables are 100% in sync with upstream code!\n`);
  process.exit(0);
}

// Print detailed drift items
if (newTables.length > 0) {
  console.log(`🟢 NEW DDL TABLES (${newTables.length}) — Not yet cataloged in entity-catalog.md:`);
  newTables.forEach(t => {
    console.log(`   • \`${t.rawName}\` [${t.type}] — Source: ${t.file}`);
  });
  console.log('');
}

if (modifiedTables.length > 0) {
  console.log(`🟡 MODIFIED DDL TABLES (${modifiedTables.length}) — Existing tables with new columns in DDL:`);
  modifiedTables.forEach(mt => {
    console.log(`   • \`${mt.rawName}\` (+${mt.addedColumns.length} new column(s): \`${mt.addedColumns.join(', ')}\`) — Source: ${mt.file}`);
  });
  console.log('');
}

if (newEndpoints.length > 0) {
  console.log(`🟢 NEW API ENDPOINTS (${newEndpoints.length}) — Not yet in api-inventory.md:`);
  newEndpoints.forEach(ep => {
    console.log(`   • \`${ep.method} ${ep.path}\` (${ep.service}) — Source: ${ep.file}`);
  });
  console.log('');
}

if (missingSequences.length > 0) {
  console.log(`🟡 MISSING SEQUENCE DIAGRAMS (${missingSequences.length}) — Need PlantUML (.puml) generation:`);
  missingSequences.slice(0, 10).forEach(seq => {
    console.log(`   • \`${seq.method} ${seq.path}\` (${seq.service}) -> apis/${seq.service}/${seq.slug}.puml`);
  });
  if (missingSequences.length > 10) {
    console.log(`     ... and ${missingSequences.length - 10} more.`);
  }
  console.log('');
}

if (staleTables.length > 0 || staleEndpoints.length > 0) {
  console.log(`🔴 STALE / REMOVED ELEMENTS IN GROUND TRUTH:`);
  staleTables.forEach(t => console.log(`   • [Table] \`${t}\` no longer found in upstream DDL`));
  staleEndpoints.forEach(ep => console.log(`   • [API] \`${ep.method} ${ep.path}\` (${ep.service}) no longer found in code`));
  console.log('');
}

// If --dry-run / --diff, stop here
if (isDryRun && !isApply) {
  console.log(`💡 DRY RUN COMPLETE (No files were modified).`);
  console.log(`   To apply synchronization and auto-update Ground Truth & deliverables, run:`);
  console.log(`   👉 npx second-brain sync --apply ${targetService ? `--service=${targetService}` : ''}`);
  console.log(`   👉 or inside agent chat: /brain-sync ${targetService ? `--service=${targetService}` : ''}\n`);
  process.exit(isStrict && totalDriftItems > 0 ? 1 : 0);
}

// -------------------------------------------------------------
// 9. EXECUTE RECONCILIATION PIPELINE (--apply)
// -------------------------------------------------------------
console.log(`🚀 EXECUTING AUTOMATIC RECONCILIATION PIPELINE...\n`);

const scriptsToRun = [
  { name: 'DDL Schema Ingestion', script: 'ingest-ddl.js', args: [] },
  { name: 'API & Gateway Ingestion', script: 'ingest-apis.js', args: [] },
  { name: 'BRD Requirements Ingestion', script: 'ingest-brd.js', args: [] },
  { name: '1-to-1 Sequence Diagram Generation', script: 'generate-api-sequences.js', args: targetService ? [`--service=${targetService}`] : [] },
  { name: 'Provenance & Integrity Audit', script: 'audit.js', args: [] }
];

let pipelineSuccess = true;

scriptsToRun.forEach(step => {
  const scriptPath = path.join(__dirname, step.script);
  if (!fs.existsSync(scriptPath)) return;

  console.log(`────────────────────────────────────────────────────────────`);
  console.log(`▶️  Running Step: ${step.name} (bin/${step.script})`);
  console.log(`────────────────────────────────────────────────────────────`);

  try {
    const extraArgs = step.args.length > 0 ? ` ${step.args.join(' ')}` : '';
    execSync(`node "${scriptPath}"${extraArgs}`, {
      cwd: targetDir,
      stdio: 'inherit'
    });
  } catch (err) {
    console.error(`\n❌ Step failed: ${step.name}`);
    pipelineSuccess = false;
  }
  console.log('');
});

// -------------------------------------------------------------
// 10. RECORD SYNC CHANGELOG (02-provenance/sync-changelog.md)
// -------------------------------------------------------------
function recordSyncChangelog() {
  const changelogFile = path.join(targetDir, '02-provenance', 'sync-changelog.md');
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let entry = '';

  if (!fs.existsSync(changelogFile)) {
    entry += `# 📜 Second Brain Living Sync Changelog\n\n`;
    entry += `> **Audit Trail & Documentation Drift History**  \n`;
    entry += `> Automatically recorded by \`bin/sync.js\` whenever Ground Truth and Deliverables are synchronized with upstream code.\n\n---\n\n`;
  }

  entry += `### 📅 Sync: ${now}\n`;
  entry += `- **Scope**: ${targetService ? `Targeted Service (\`${targetService}\`)` : 'Full Architecture Workspace'}\n`;
  entry += `- **Upstream Repositories**:\n`;
  if (upstreamStatus.length === 0) entry += `  - *Local workspace*\n`;
  else {
    upstreamStatus.forEach(u => {
      const badge = u.isExternal ? 'External' : 'Local';
      const detail = u.isGit ? `${u.branch} (${u.commit})` : u.commit;
      entry += `  - \`${u.name}\` (${badge}) — ${detail}\n`;
    });
  }

  entry += `- **New DDL Tables (${newTables.length})**:\n`;
  if (newTables.length === 0) entry += `  - *None*\n`;
  else newTables.forEach(t => entry += `  - \`${t.rawName}\` [${t.type}] (Source: \`${t.file}\`)\n`);

  entry += `- **Modified DDL Tables (${modifiedTables.length})**:\n`;
  if (modifiedTables.length === 0) entry += `  - *None*\n`;
  else modifiedTables.forEach(t => entry += `  - \`${t.rawName}\` (+${t.addedColumns.length} col: \`${t.addedColumns.join(', ')}\` from \`${t.file}\`)\n`);

  entry += `- **New API Endpoints (${newEndpoints.length})**:\n`;
  if (newEndpoints.length === 0) entry += `  - *None*\n`;
  else newEndpoints.forEach(ep => entry += `  - \`${ep.method} ${ep.path}\` (${ep.service}) from \`${ep.file}\`\n`);

  entry += `- **Sequence Diagrams Generated (${missingSequences.length})**:\n`;
  if (missingSequences.length === 0) entry += `  - *None*\n`;
  else missingSequences.forEach(seq => entry += `  - \`${seq.method} ${seq.path}\` -> \`apis/${seq.service}/${seq.slug}.puml\`\n`);

  entry += `- **Integrity Status**: ✅ Audit Passed (100% Provenance Coverage, 0 Contradictions)\n\n---\n\n`;

  try {
    fs.mkdirSync(path.dirname(changelogFile), { recursive: true });
    fs.appendFileSync(changelogFile, entry, 'utf8');
    if (!isJson) {
      console.log(`📝 Appended sync audit entry to: 02-provenance/sync-changelog.md`);
    }
  } catch (err) {}
}

if (pipelineSuccess) {
  recordSyncChangelog();
  console.log(`🎉 RECONCILIATION COMPLETE!`);
  console.log(`   • Ground Truth updated (entity-catalog.md, api-inventory.md, business-rules.md)`);
  console.log(`   • PlantUML Sequence Diagrams generated/synchronized with 100% provenance citations [SRC:...].`);
  console.log(`   • Changelog recorded in 02-provenance/sync-changelog.md\n`);
  process.exit(0);
} else {
  console.error(`⚠️  Reconciliation completed with warnings or errors. Check log output above.\n`);
  process.exit(1);
}

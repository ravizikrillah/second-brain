#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const rawInputBase = path.join(targetDir, '00-raw-inputs');

console.log(`\n🧠 Universal Second Brain Auto-Triage & Organizer\n`);

// 1. Determine Source Directory
let sourceArg = process.argv[2];
let isMove = process.argv.includes('--move');

let sourceDir = null;
if (sourceArg && !sourceArg.startsWith('--')) {
  sourceDir = path.resolve(targetDir, sourceArg);
} else {
  // Auto-detect common raw vaults or legacy folders
  const candidates = ['artifacts', 'raw', 'vault', 'legacy-docs', 'docs', 'specs'];
  for (const c of candidates) {
    const candidatePath = path.join(targetDir, c);
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
      sourceDir = candidatePath;
      break;
    }
  }
}

if (!sourceDir || !fs.existsSync(sourceDir)) {
  console.log(`❌ Source directory not found.`);
  console.log(`   Usage: node ./bin/organize.js <source_folder> [--move]`);
  console.log(`   Example: node ./bin/organize.js artifacts\n`);
  process.exit(1);
}

console.log(`📂 Source Directory : ${path.relative(targetDir, sourceDir) || sourceDir}`);
console.log(`🎯 Destination      : 00-raw-inputs/ (db, brd, existing-code, mom, figma)`);
console.log(`⚙️  Operation        : ${isMove ? 'MOVE (Cut)' : 'COPY (Preserve source)'}\n`);

// 2. Ensure standard 5 raw input subdirectories exist
const targetDirs = {
  db: path.join(rawInputBase, 'db'),
  brd: path.join(rawInputBase, 'brd'),
  code: path.join(rawInputBase, 'existing-code'),
  mom: path.join(rawInputBase, 'mom'),
  figma: path.join(rawInputBase, 'figma')
};

Object.values(targetDirs).forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Transfer helper (move or copy)
function transfer(src, dest) {
  const destParent = path.dirname(dest);
  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
  }

  if (isMove) {
    try {
      fs.renameSync(src, dest);
    } catch (err) {
      // Fallback if moving across different mount points / partitions
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true, force: true });
    }
  } else {
    fs.cpSync(src, dest, { recursive: true });
  }
}

// 3. Universal Ecosystem Markers
const REPO_MARKERS = [
  'go.mod', 'go.sum',
  'package.json', 'tsconfig.json',
  'pom.xml', 'build.gradle', 'build.gradle.kts',
  'requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile',
  'Cargo.toml', 'composer.json',
  'Makefile', 'Dockerfile', 'docker-compose.yml',
  '.git'
];

const CODE_DIR_NAMES = new Set([
  'src', 'code', 'repo', 'repos', 'repository', 'repositories',
  'backend', 'frontend', 'services', 'microservices', 'packages',
  'apps', 'api', 'server', 'client', 'infra', 'pipeline'
]);

function isCodeRepository(dirPath, dirName) {
  const lower = dirName.toLowerCase();
  if (CODE_DIR_NAMES.has(lower)) return true;
  try {
    const entries = fs.readdirSync(dirPath);
    return entries.some(f => REPO_MARKERS.includes(f));
  } catch (e) {
    return false;
  }
}

const IGNORED_EXTS = new Set([
  '.mp4', '.mov', '.avi', '.mkv', '.wmv',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar',
  '.dmg', '.exe', '.iso', '.bin',
  '.ds_store'
]);

const IGNORED_NAMES = new Set([
  '.git', 'node_modules', 'dist', 'build', 'target', 'vendor',
  'videos', 'assets', 'miro-backups', 'incidents'
]);

const stats = {
  db: [],
  brd: [],
  code: [],
  mom: [],
  figma: [],
  skipped: []
};

// 4. Recursive Discovery & Dynamic Classification
function scanAndOrganize(currentDir, relativeScope = '') {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    const lowerName = entry.name.toLowerCase();
    const relPath = path.join(relativeScope, entry.name);

    if (IGNORED_NAMES.has(lowerName) || entry.name.startsWith('.')) {
      if (entry.name !== '.cursorrules') {
        stats.skipped.push({ name: relPath, reason: 'Ignored directory / file' });
        continue;
      }
    }

    // A. DIRECTORY CLASSIFICATION
    if (entry.isDirectory()) {
      // Rule 1: Dynamic Code Repository Detection
      // If a folder has go.mod, package.json, pom.xml, or is a known codebase directory:
      // Transfer the entire repository as an INTACT UNIT. NEVER unpack or flatten its files.
      if (isCodeRepository(entryPath, entry.name)) {
        const dest = path.join(targetDirs.code, entry.name);
        transfer(entryPath, dest);
        stats.code.push(`📁 Repository [${entry.name}]: 00-raw-inputs/existing-code/${entry.name}/ (Intact Folder)`);
        continue;
      }

      // Rule 2: Dedicated configurations directory (YAML configs, cURL)
      if (lowerName.includes('config') || lowerName.includes('curl') || lowerName.includes('properties')) {
        const dest = path.join(targetDirs.code, entry.name);
        transfer(entryPath, dest);
        stats.code.push(`📁 Configs [${entry.name}]: 00-raw-inputs/existing-code/${entry.name}/`);
        continue;
      }

      // Rule 3: Dedicated UI/UX / Figma directory
      if (lowerName.includes('figma') || lowerName.includes('ui-spec') || lowerName.includes('screen-flow') || lowerName === 'drafts') {
        const dest = path.join(targetDirs.figma, entry.name);
        transfer(entryPath, dest);
        stats.figma.push(`🎨 UI Specs [${entry.name}]: 00-raw-inputs/figma/${entry.name}/`);
        continue;
      }

      // Rule 4: Dedicated Meeting / MoM directory
      if (lowerName.includes('meeting') || lowerName.includes('mom') || lowerName.includes('huddle') || lowerName.includes('minutes') || lowerName.includes('notes')) {
        const dest = path.join(targetDirs.mom, entry.name);
        transfer(entryPath, dest);
        stats.mom.push(`📝 Meeting Notes [${entry.name}]: 00-raw-inputs/mom/${entry.name}/`);
        continue;
      }

      // Rule 5: Dedicated BRD / Requirements directory
      if (lowerName.includes('assessment') || lowerName.includes('brd') || lowerName.includes('prd') || lowerName.includes('spec') || lowerName.includes('document')) {
        const dest = path.join(targetDirs.brd, entry.name);
        transfer(entryPath, dest);
        stats.brd.push(`📋 Requirements [${entry.name}]: 00-raw-inputs/brd/${entry.name}/`);
        continue;
      }

      // Fallback: Recurse deeper into unstructured directories
      scanAndOrganize(entryPath, relPath);
      continue;
    }

    // B. FILE CLASSIFICATION
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();

      // Skip media / binaries
      if (IGNORED_EXTS.has(ext) || lowerName === 'readme.md') {
        stats.skipped.push({ name: relPath, reason: 'Media/binary/readme' });
        continue;
      }

      // 1. SQL DDL / DML
      if (ext === '.sql') {
        const dest = path.join(targetDirs.db, entry.name);
        transfer(entryPath, dest);
        stats.db.push(entry.name);
        continue;
      }

      // 2. Code files loose in root
      if (['.go', '.java', '.ts', '.js', '.py', '.rs', '.proto', '.yml', '.yaml'].includes(ext)) {
        const dest = path.join(targetDirs.code, entry.name);
        transfer(entryPath, dest);
        stats.code.push(entry.name);
        continue;
      }

      // 3. Meeting notes loose files
      if (lowerName.includes('meeting') || lowerName.includes('mom') || lowerName.includes('notulen')) {
        const dest = path.join(targetDirs.mom, entry.name);
        transfer(entryPath, dest);
        stats.mom.push(entry.name);
        continue;
      }

      // 4. Requirements / BRD loose files
      if (['.md', '.txt', '.pdf', '.docx', '.xlsx', '.pptx'].includes(ext)) {
        const dest = path.join(targetDirs.brd, entry.name);
        transfer(entryPath, dest);
        stats.brd.push(entry.name);
        continue;
      }
    }
  }
}

scanAndOrganize(sourceDir);

// 5. Output Universal Summary Report
console.log(`📊 Universal Auto-Triage Summary:\n`);

console.log(`  🗄️  00-raw-inputs/db/ (Database & DDL):`);
if (stats.db.length === 0) console.log(`     └─ (None)`);
stats.db.forEach(f => console.log(`     └─ 📄 ${f}`));

console.log(`\n  💻 00-raw-inputs/existing-code/ (Code Repositories & Configs):`);
if (stats.code.length === 0) console.log(`     └─ (None)`);
stats.code.forEach(c => console.log(`     └─ ${c}`));

console.log(`\n  📋 00-raw-inputs/brd/ (Requirements & BRDs):`);
if (stats.brd.length === 0) console.log(`     └─ (None)`);
stats.brd.slice(0, 10).forEach(f => console.log(`     └─ 📄 ${f}`));
if (stats.brd.length > 10) console.log(`     └─ ...and ${stats.brd.length - 10} more files/folders`);

console.log(`\n  📝 00-raw-inputs/mom/ (Meeting Notes & Discussions):`);
if (stats.mom.length === 0) console.log(`     └─ (None)`);
stats.mom.slice(0, 6).forEach(f => console.log(`     └─ 📄 ${f}`));
if (stats.mom.length > 6) console.log(`     └─ ...and ${stats.mom.length - 6} more`);

console.log(`\n  🎨 00-raw-inputs/figma/ (UI Flows & Feedback):`);
if (stats.figma.length === 0) console.log(`     └─ (None)`);
stats.figma.forEach(f => console.log(`     └─ 🎨 ${f}`));

console.log(`\n  🚫 Skipped Elements (Media / Binaries / NodeModules):`);
console.log(`     └─ Total: ${stats.skipped.length} items skipped\n`);

console.log(`✅ Universal Organization Complete! Codebase trees and directories preserved intact.`);
console.log(`👉 Next Step: Run '/brain-ingest' to process the materials.\n`);

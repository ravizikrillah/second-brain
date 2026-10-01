#!/usr/bin/env node

/**
 * Second Brain Repository & Markdown Integrity Linter
 * 
 * Verifies repository consistency, link integrity, zone structure, and format compliance.
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const args = process.argv.slice(2);
const isStrict = args.includes('--strict');

console.log(`\n🔍 Second Brain Repository & Integrity Linter\n`);

let errors = 0;
let warnings = 0;

function reportError(check, file, msg) {
  errors++;
  console.log(`  ❌ [${check}] ${file}: ${msg}`);
}

function reportWarning(check, file, msg) {
  warnings++;
  console.log(`  ⚠️  [${check}] ${file}: ${msg}`);
}

// Helper to walk directory
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === '.git' || file === 'node_modules') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

// 1. Check Zone Structure
const requiredZones = [
  '00-raw-inputs',
  '01-ground-truth',
  '02-provenance',
  '03-constraint-branches',
  '04-deliverables',
  '05-adrs'
];

requiredZones.forEach(zone => {
  const zonePath = path.join(targetDir, zone);
  if (!fs.existsSync(zonePath)) {
    reportError('ZONE_MISSING', zone, 'Required repository zone directory is missing.');
  }
});

// 2. Check Ground Truth Files
const groundTruthFiles = [
  'entity-catalog.md',
  'api-inventory.md',
  'business-rules.md',
  'domain-glossary.md'
];

groundTruthFiles.forEach(gt => {
  const gtPath = path.join(targetDir, '01-ground-truth', gt);
  if (!fs.existsSync(gtPath)) {
    reportWarning('GROUND_TRUTH_SPARSE', `01-ground-truth/${gt}`, 'Core ground truth file not found.');
  }
});

// 3. Scan Markdown Files for Links, Placeholders & ADR Format
walkDir(targetDir, fullPath => {
  const relPath = path.relative(targetDir, fullPath);

  // Check Placeholder tags {{...}}
  if (fullPath.endsWith('.md')) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const placeholderMatches = content.match(/\{\{[A-Z0-9_]+\}\}/g);
    if (placeholderMatches && !relPath.includes('template') && !relPath.includes('node_modules')) {
      reportWarning('UNRESOLVED_PLACEHOLDER', relPath, `Unresolved placeholder tags found: ${placeholderMatches.join(', ')}`);
    }

    // Check broken relative links in markdown [text](rel/path) (ignoring fenced code blocks)
    const contentForLinks = content.replace(/```[\s\S]*?```/g, '');
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(contentForLinks)) !== null) {
      const linkUrl = match[2];
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('#') || linkUrl.startsWith('mailto:')) {
        continue;
      }
      let targetFile = linkUrl.split('#')[0];
      if (!targetFile) continue;
      try {
        targetFile = decodeURIComponent(targetFile);
      } catch (e) {}
      if (targetFile.startsWith('file://')) {
        targetFile = targetFile.replace('file://', '');
        if (!fs.existsSync(targetFile)) {
          reportWarning('BROKEN_ABSOLUTE_LINK', relPath, `Referenced file does not exist: ${targetFile}`);
        }
      } else {
        const resolvedTarget = path.resolve(path.dirname(fullPath), targetFile);
        if (!fs.existsSync(resolvedTarget)) {
          reportWarning('BROKEN_RELATIVE_LINK', relPath, `Referenced relative file does not exist: ${targetFile}`);
        }
      }
    }
  }

  // Check ADR format in 05-adrs/
  if (relPath.startsWith('05-adrs') && fullPath.endsWith('.md')) {
    const base = path.basename(fullPath);
    if (!/^\d{4}-[a-z0-9_-]+\.md$/.test(base) && !base.toLowerCase().includes('readme')) {
      reportWarning('ADR_NAMING', relPath, `ADR filename does not follow standard convention (e.g. 0001-title.md)`);
    }
  }

  // Check PUML syntax closure in 04-deliverables/sequence-diagrams
  if (fullPath.endsWith('.puml')) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('@startuml') || !content.includes('@enduml')) {
      reportError('PUML_SYNTAX', relPath, 'Missing @startuml or @enduml boundary tags.');
    }
  }
});

console.log(`┌────────────────────────────────────────────────────────────┐`);
console.log(`│                  LINTING AUDIT SUMMARY                     │`);
console.log(`├────────────────────────────────────────────────────────────┤`);
console.log(`│ Total Errors   : ${String(errors).padEnd(41)} │`);
console.log(`│ Total Warnings : ${String(warnings).padEnd(41)} │`);
console.log(`│ Status         : ${String(errors === 0 ? 'PASSED (CLEAN)' : 'FAILED').padEnd(41)} │`);
console.log(`└────────────────────────────────────────────────────────────┘\n`);

if (errors > 0 || (isStrict && warnings > 0)) {
  process.exit(1);
}

process.exit(0);

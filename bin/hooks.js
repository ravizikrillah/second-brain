#!/usr/bin/env node

/**
 * Second Brain Git Hooks Installer
 * 
 * Installs pre-commit hook to automatically enforce 100% provenance tag coverage,
 * zero active hard-block contradictions, and repository integrity before any commit.
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const gitDir = path.join(targetDir, '.git');
const hooksDir = path.join(gitDir, 'hooks');
const preCommitPath = path.join(hooksDir, 'pre-commit');

console.log(`\n🛡️ Second Brain Git Hooks Installer\n`);

if (!fs.existsSync(gitDir)) {
  console.log(`❌ Error: No .git directory found in ${targetDir}.`);
  console.log(`   Initialize git first using 'git init' before installing hooks.\n`);
  process.exit(1);
}

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

const hookContent = `#!/bin/sh
# Second Brain Pre-Commit Automated Quality & Integrity Gate

echo "🔍 Running Second Brain Pre-Commit Quality Gate..."

# 1. Run Linter (Checks for dead links, placeholders, zone integrity)
node ./bin/lint.js --strict
if [ $? -ne 0 ]; then
  echo "❌ Commit rejected: Repository integrity linter failed."
  exit 1
fi

# 2. Run Audit (Checks for 100% provenance coverage and zero hard blocks)
node ./bin/audit.js
if [ $? -ne 0 ]; then
  echo "❌ Commit rejected: Provenance audit failed. Resolve hard-blocks or missing tags."
  exit 1
fi

echo "✅ Pre-Commit Quality Gate Passed! Proceeding with commit."
exit 0
`;

fs.writeFileSync(preCommitPath, hookContent, { mode: 0o755 });
try {
  fs.chmodSync(preCommitPath, '755');
} catch (e) {}

console.log(`✅ Git pre-commit hook installed successfully!`);
console.log(`   Path: ${path.relative(targetDir, preCommitPath)}`);
console.log(`   Enforces:`);
console.log(`     • Zero broken markdown links & unresolved template placeholders`);
console.log(`     • 100% Provenance tag coverage across sequence diagrams & API contracts`);
console.log(`     • Zero active hard-block contradictions in 02-provenance/contradictions.md\n`);

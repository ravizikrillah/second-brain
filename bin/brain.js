#!/usr/bin/env node

/**
 * Second Brain Unified CLI Controller
 * 
 * Provides an authoritative, single-entrypoint CLI for all Second Brain operations.
 */

const { spawn } = require('child_process');
const path = require('path');

const command = process.argv[2] ? process.argv[2].toLowerCase() : 'help';
const extraArgs = process.argv.slice(3);

const binDir = __dirname;

const commandMap = {
  'init': 'init.js',
  'organize': 'organize.js',
  'convert': 'convert.js',
  'ingest:ddl': 'ingest-ddl.js',
  'ingest:apis': 'ingest-apis.js',
  'ingest:brd': 'ingest-brd.js',
  'audit': 'audit.js',
  'readiness': 'readiness.js',
  'eval': 'readiness.js',
  'handoff': 'handoff.js',
  'lint': 'lint.js',
  'qna': 'qna.js',
  'query': 'query.js',
  'search': 'query.js',
  'hooks': 'hooks.js',
  'branch': 'branch.js',
  'impact': 'impact.js',
  'blast': 'impact.js',
  'deliver': 'generate-api-sequences.js',
  'deliver:apis': 'generate-api-sequences.js',
  'sync': 'sync.js',
  'diff': 'sync.js'
};

function printHelp() {
  console.log(`
🧠 Second Brain Unified System Analyst CLI

Usage: ./brain <command> [options]
   or: node ./bin/brain.js <command> [options]

Core Commands:
  query <term>      Instant zero-hallucination query across schemas, APIs, and flows
  impact <target>   Level 5 Multi-Hop Blast Radius & Change Request (CR) Impact Analyzer
  readiness (eval)  Run 30-dimension Architecture Readiness & Completeness Benchmark (ARCS)
  audit             Audit 100% provenance tag coverage, DDL schemas, and hard blocks
  handoff           Generate/update 02-provenance/session-handoff.md for session continuity
  lint              Verify markdown links, zone structure, and repo consistency
  hooks             Install Git pre-commit quality gate hook (lint + audit)
  test              Run full quality gate suite (audit + readiness + lint)
  qna               Generate Stakeholder Q&A Refinement Matrix (02-provenance/stakeholder-qna.md)
  deliver [apis]    Generate authoritative 1-to-1 sequence diagrams for microservice endpoints
  branch <name>     Create and evaluate an isolated trade-off scenario branch
  sync [--diff]     Detect upstream drift and synchronize ground truth
  convert           Convert binary documents (PDF, Word, Excel) to Markdown via MarkItDown
  ingest            Ingest raw DDL, API routes, and BRD specifications (with auto-convert)
  init              Initialize or scaffold Second Brain directory hierarchy

Examples:
  ./brain query research
  ./brain readiness
  ./brain audit
  ./brain test
  ./brain handoff
  ./brain hooks
  ./brain lint
  ./brain qna
`);
  process.exit(0);
}

if (command === 'help' || command === '--help' || command === '-h') {
  printHelp();
}

if (command === 'test') {
  console.log(`\n🧪 Running Full Second Brain Verification Suite (Audit + Readiness + Lint)...\n`);
  const testScripts = ['audit.js', 'readiness.js', 'lint.js'];
  function runTestNext(index) {
    if (index >= testScripts.length) {
      console.log(`\n🎉 All Second Brain Verification Checks Passed Successfully!\n`);
      process.exit(0);
    }
    const proc = spawn('node', [path.join(binDir, testScripts[index])], { stdio: 'inherit' });
    proc.on('close', code => {
      if (code !== 0) process.exit(code);
      runTestNext(index + 1);
    });
  }
  runTestNext(0);
} else if (command === 'ingest') {
  // Run ddl, apis, brd in sequence
  console.log(`\n🚀 Ingesting all raw inputs into canonical ground truth (convert -> ddl -> apis -> brd)...\n`);
  const scripts = ['convert.js', 'ingest-ddl.js', 'ingest-apis.js', 'ingest-brd.js'];
  function runNext(index) {
    if (index >= scripts.length) {
      console.log(`\n✅ Full ground-truth ingestion completed successfully!\n`);
      process.exit(0);
    }
    const proc = spawn('node', [path.join(binDir, scripts[index])], { stdio: 'inherit' });
    proc.on('close', code => {
      if (code !== 0) process.exit(code);
      runNext(index + 1);
    });
  }
  runNext(0);
} else if (commandMap[command]) {
  const targetScript = path.join(binDir, commandMap[command]);
  const procArgs = command === 'diff' ? ['--diff', ...extraArgs] : extraArgs;
  const proc = spawn('node', [targetScript, ...procArgs], { stdio: 'inherit' });
  proc.on('close', code => {
    process.exit(code);
  });
} else {
  console.log(`\n❌ Unknown command: "${command}"\n`);
  printHelp();
}

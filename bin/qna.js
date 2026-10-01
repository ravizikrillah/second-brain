#!/usr/bin/env node

/**
 * Second Brain Stakeholder Q&A Roundtrip Matrix Generator
 * 
 * Extracts unconfirmed business rules, trade-offs, and contradictions into
 * a structured Stakeholder Q&A Matrix (Markdown + CSV for Excel compatibility).
 * Bridges technical ground truth to non-technical Product Owners and business stakeholders.
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const args = process.argv.slice(2);
const isImport = args.includes('--import');

console.log(`\n📋 Second Brain Stakeholder Q&A Matrix Engine\n`);

const mdOutputPath = path.join(targetDir, '02-provenance', 'stakeholder-qna.md');

// Helper to safely read file
function readFileSafe(relPath) {
  const p = path.join(targetDir, relPath);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

if (isImport) {
  // Import answers from filled stakeholder-qna.md or CSV
  console.log(`🔄 Inspecting stakeholder responses from ${path.relative(targetDir, mdOutputPath)}...`);
  if (!fs.existsSync(mdOutputPath)) {
    console.log(`❌ Error: ${path.relative(targetDir, mdOutputPath)} does not exist. Run "npm run qna" first.`);
    process.exit(1);
  }
  const content = fs.readFileSync(mdOutputPath, 'utf8');
  const rows = content.match(/\|\s+\*\*`QNA-\d+`\*\*\s+\|[^|\n]+\|[^|\n]+\|[^|\n]+\|([^|\n]+)\|/g) || [];
  let resolvedCount = 0;
  rows.forEach(r => {
    const parts = r.split('|').map(s => s.trim());
    const id = parts[1];
    const decision = parts[5];
    if (decision && !decision.toLowerCase().includes('pending') && decision.length > 3) {
      resolvedCount++;
      console.log(`  ✅ Stakeholder Decision captured for ${id}: "${decision}"`);
    }
  });
  console.log(`\n🎉 Processed ${resolvedCount} resolved stakeholder decisions. Update ADRs or ground truth accordingly.\n`);
  process.exit(0);
}

// ---------------------------------------------------------
// Extraction Logic: Scan Contradictions & Business Rules
// ---------------------------------------------------------
const questions = [];
let qCounter = 1;

// 1. Scan Contradictions
const contradictionsContent = readFileSafe('02-provenance/contradictions.md');
const lines = contradictionsContent.split(/\r?\n/);
lines.forEach(line => {
  if (line.includes('🔴') || /\|\s+\*\*`C-\d+`\*\*\s+\|/i.test(line)) {
    if (!line.includes('RESOLVED') && !line.includes('ADOPTED')) {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length >= 6) {
        questions.push({
          id: `QNA-${String(qCounter++).padStart(2, '0')}`,
          dimension: 'Contradiction / Conflict',
          ambiguity: parts[2] || parts[3],
          recommendation: parts[4] || 'Adopt Tier 1/2 Ground Truth',
          impact: 'Critical - Blocks Deliverable Generation (Hard Block)',
          status: 'PENDING_PO_DECISION'
        });
      }
    }
  }
});

// 2. Scan Business Rules for [UNCONFIRMED] or [PENDING]
const businessRulesContent = readFileSafe('01-ground-truth/business-rules.md');
const brLines = businessRulesContent.split(/\r?\n/);
brLines.forEach(line => {
  if (/\[(?:UNCONFIRMED|PENDING|TBD)\]/i.test(line)) {
    questions.push({
      id: `QNA-${String(qCounter++).padStart(2, '0')}`,
      dimension: 'Business Rules & Invariants',
      ambiguity: line.replace(/^[#\s*-]+/, '').trim(),
      recommendation: 'Formalize threshold in business-rules.md',
      impact: 'High - Affects system validation logic and user messaging',
      status: 'PENDING_BUSINESS_CONFIRMATION'
    });
  }
});

// 3. Scan Constraint Branches for Open Forks
const branchDir = path.join(targetDir, '03-constraint-branches');
if (fs.existsSync(branchDir)) {
  fs.readdirSync(branchDir).forEach(file => {
    if (file.endsWith('.md') && !file.toLowerCase().includes('readme')) {
      const bContent = fs.readFileSync(path.join(branchDir, file), 'utf8');
      if (!bContent.includes('STATUS: ADOPTED') && !bContent.includes('Status: ADOPTED')) {
        const titleMatch = bContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
        questions.push({
          id: `QNA-${String(qCounter++).padStart(2, '0')}`,
          dimension: 'Architectural Trade-Off Scenario',
          ambiguity: `Trade-off evaluation: ${title}`,
          recommendation: `Inspect ${file} and decide whether to /brain-adopt or reject`,
          impact: 'Medium - Evaluates alternative schema/flow implementations',
          status: 'PENDING_ADR_ARBITRATION'
        });
      }
    }
  });
}

// 4. Fallback baseline if all items are already resolved
if (questions.length === 0) {
  questions.push({
    id: 'QNA-01',
    dimension: 'Architecture Invariant Review',
    ambiguity: 'Are any new external third-party API rate limits or timeout SLAs anticipated for next quarter?',
    recommendation: 'Maintain default circuit breaker timeout threshold (5000ms).',
    impact: 'Low - Baseline verification',
    status: 'OPTIONAL_CONFIRMATION'
  });
}

// ---------------------------------------------------------
// Generate Markdown Q&A Document
// ---------------------------------------------------------
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

let mdContent = `# Stakeholder Q&A & Refinement Matrix

> **Authoritative Business & Technical Alignment Register**  
> Auto-generated by \`bin/qna.js\` to gather decisions from Product Owners, Business Analysts, and Clients.  
> **Synchronized**: \`${now} UTC\` | **Open Questions**: \`${questions.length}\`

---

## 📋 Instructions for Product Owners & Stakeholders
1. Review each item in the table below.
2. Provide your definitive answer in the **Stakeholder Decision / Answer** column.
3. Once completed, save and return this file (or run \`npm run qna:import\` to re-ingest).

---

| ID | Category / Dimension | Ambiguity / Architectural Fork | Technical Recommendation | Stakeholder Decision / Answer | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
`;

questions.forEach(q => {
  mdContent += `| **\`${q.id}\`** | ${q.dimension} | ${q.ambiguity} | ${q.recommendation} | *[Fill Decision Here]* | \`${q.status}\` |\n`;
});

mdContent += `\n---\n\n*Generated by Second Brain System Analyst Toolsuite*\n`;

fs.writeFileSync(mdOutputPath, mdContent, 'utf8');

console.log(`✅ Stakeholder Q&A Matrix generated:`);
console.log(`  📄 Markdown : 02-provenance/stakeholder-qna.md`);
console.log(`\nShare with Product Owner or business client for structured refinement.\n`);

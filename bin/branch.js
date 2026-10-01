#!/usr/bin/env node

/**
 * Second Brain Constraint Branch & Cross-Branch Intelligence CLI
 * 
 * Inspects all scenarios in 03-constraint-branches/, detects correlations,
 * cross-branch impacts, component overlaps, conflicts, and obsolete parts
 * (identifying components rendered obsolete if a scenario is adopted).
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const branchesDir = path.join(targetDir, '03-constraint-branches');
const groundTruthDir = path.join(targetDir, '01-ground-truth');
const templatePath = path.join(branchesDir, 'scenario-template.md');

const args = process.argv.slice(2);
const isListOnly = args.includes('--list') || args.includes('-l');
const isJsonOutput = args.includes('--json');
const scenarioArg = args.find(a => !a.startsWith('-'));

function parseScenarioFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  const name = filename.replace(/^scenario-/, '').replace(/\.md$/, '');

  const titleMatch = content.match(/^#\s+(?:Scenario Template:\s*)?([^\r\n]+)/m);
  const title = titleMatch ? titleMatch[1].trim() : name;

  const statusMatch = content.match(/Status:\s*\[?(PROPOSED|EVALUATING|ADOPTED|REJECTED)\]?/i);
  const status = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';

  // Extract impacted components section
  const impactedMatch = content.match(/## 2\.\s+Impacted Components([\s\S]*?)(?=## 3\.|$)/i);
  const impactedText = impactedMatch ? impactedMatch[1].trim() : '';

  // Extract components/tokens (words, services, tables)
  const components = [];
  const lines = impactedText.split(/\r?\n/);
  for (const line of lines) {
    const codeTokens = line.match(/`([^`]+)`/g);
    if (codeTokens) {
      codeTokens.forEach(t => components.push(t.replace(/`/g, '')));
    }
  }

  // Extract constraint description
  const constraintMatch = content.match(/## 1\.\s+Constraint Description([\s\S]*?)(?=## 2\.|$)/i);
  const constraintText = constraintMatch ? constraintMatch[1].trim() : '';

  // Extract obsolescence section if present
  const obsolescenceMatch = content.match(/## 5\.\s+Cross-Branch Correlations & Obsolescence[\s\S]*?(?=## 6\.|$)/i);
  const obsolescenceText = obsolescenceMatch ? obsolescenceMatch[0].trim() : '';

  return {
    filename,
    name,
    filePath,
    title,
    status,
    constraintText,
    impactedText,
    components: [...new Set(components)],
    obsolescenceText,
    content
  };
}

function loadAllScenarios() {
  if (!fs.existsSync(branchesDir)) return [];
  const files = fs.readdirSync(branchesDir);
  const scenarios = [];

  for (const file of files) {
    if (file.startsWith('scenario-') && file.endsWith('.md') && file !== 'scenario-template.md') {
      const fullPath = path.join(branchesDir, file);
      try {
        scenarios.push(parseScenarioFile(fullPath));
      } catch (err) {
        // Skip unreadable files
      }
    }
  }

  return scenarios;
}

function analyzeCrossBranch(targetScenario, allScenarios) {
  const correlations = [];
  const targetComponents = new Set(targetScenario.components);
  const targetName = targetScenario.name.toLowerCase();
  const targetText = (targetScenario.content || '').toLowerCase();

  for (const other of allScenarios) {
    if (other.name.toLowerCase() === targetName) continue;

    // Overlapping components
    const overlapping = other.components.filter(c => targetComponents.has(c));
    const otherText = (other.content || '').toLowerCase();

    // Check for potential conflicts / keywords
    const isConflictKeyword = 
      (targetText.includes('no-') && otherText.includes(targetText.replace('no-', ''))) ||
      (otherText.includes('no-') && targetText.includes(otherText.replace('no-', ''))) ||
      (targetText.includes('sync') && otherText.includes('async')) ||
      (targetText.includes('direct') && otherText.includes('event-driven'));

    let relType = 'INDEPENDENT';
    let details = 'No direct component overlap detected.';
    let obsoleteParts = '-';

    if (overlapping.length > 0) {
      relType = isConflictKeyword ? 'CONFLICT' : 'SYNERGY / OVERLAP';
      details = `Shares components: ${overlapping.map(c => `\`${c}\``).join(', ')}`;
    }

    // Check if target might obsolete parts of other
    if (targetText.includes('offline') && otherText.includes('online')) {
      relType = 'OBSOLETES_PARTIAL';
      obsoleteParts = 'Real-time online sync/polling mechanisms become optional/redundant.';
    } else if (targetText.includes('event') && otherText.includes('polling')) {
      relType = 'OBSOLETES';
      obsoleteParts = 'Periodic polling endpoints and cron workers are rendered unnecessary.';
    } else if (targetText.includes('direct') && otherText.includes('queue')) {
      relType = 'CONFLICT / BYPASS';
      obsoleteParts = 'Message queue intermediate buffer is bypassed.';
    }

    correlations.push({
      otherName: other.name,
      otherTitle: other.title,
      otherStatus: other.status,
      relType,
      overlapping,
      details,
      obsoleteParts
    });
  }

  return correlations;
}

// MAIN EXECUTION
const allScenarios = loadAllScenarios();

if (isListOnly || (!scenarioArg && args.length === 0)) {
  console.log(`\n🌿 Second Brain Constraint Branches (Total: ${allScenarios.length})\n`);
  if (allScenarios.length === 0) {
    console.log(`No active scenarios found in 03-constraint-branches/ (only template present).`);
    console.log(`Run \`/brain-branch <name>\` or \`node ./bin/branch.js <name>\` to explore a new constraint scenario.\n`);
    process.exit(0);
  }

  console.log(`| Scenario Name | Status | Title | Impacted Components |`);
  console.log(`| :--- | :--- | :--- | :--- |`);
  for (const s of allScenarios) {
    const comps = s.components.length > 0 ? s.components.map(c => `\`${c}\``).join(', ') : 'None documented';
    console.log(`| \`${s.name}\` | **${s.status}** | ${s.title} | ${comps} |`);
  }
  console.log(``);
  process.exit(0);
}

const cleanName = scenarioArg.replace(/^scenario-/, '').replace(/\.md$/, '');
const targetFilePath = path.join(branchesDir, `scenario-${cleanName}.md`);
let targetScenario;

if (fs.existsSync(targetFilePath)) {
  targetScenario = parseScenarioFile(targetFilePath);
} else {
  // Scenario doesn't exist yet, scaffold from template
  let templateContent = fs.existsSync(templatePath) 
    ? fs.readFileSync(templatePath, 'utf8')
    : `# Scenario Template: ${cleanName}\n`;

  const newContent = templateContent.replace(/\[Scenario Title\]/g, cleanName.replace(/[-_]/g, ' '));
  fs.writeFileSync(targetFilePath, newContent, 'utf8');
  targetScenario = parseScenarioFile(targetFilePath);
  console.log(`\n✨ Created new isolated scenario branch: 03-constraint-branches/scenario-${cleanName}.md`);
}

// Analyze against all existing scenarios
const correlations = analyzeCrossBranch(targetScenario, allScenarios);

if (isJsonOutput) {
  console.log(JSON.stringify({
    scenario: targetScenario,
    totalExistingScenarios: allScenarios.length,
    correlations
  }, null, 2));
  process.exit(0);
}

console.log(`\n🌿 Constraint Branch Analysis: scenario-${cleanName}.md`);
console.log(`Status: [${targetScenario.status}] | Title: ${targetScenario.title}\n`);

console.log(`📊 Cross-Branch Correlation & Obsolescence Intelligence:`);
if (correlations.length === 0) {
  console.log(`  (No other active scenarios to compare against in 03-constraint-branches/)\n`);
} else {
  console.log(`| Existing Scenario | Status | Relationship | Details / Overlaps | Rendered Obsolete / Deprecations |`);
  console.log(`| :--- | :--- | :--- | :--- | :--- |`);
  for (const c of correlations) {
    console.log(`| \`scenario-${c.otherName}\` | ${c.otherStatus} | **${c.relType}** | ${c.details} | ${c.obsoleteParts} |`);
  }
  console.log(``);

  const obsoletes = correlations.filter(c => c.obsoleteParts !== '-');
  if (obsoletes.length > 0) {
    console.log(`💡 Proactive Obsolescence Insights:`);
    obsoletes.forEach(o => {
      console.log(`  - 🗑️ If scenario-${cleanName} is implemented: ${o.obsoleteParts} (vs scenario-${o.otherName})`);
    });
    console.log(``);
  }

  const conflicts = correlations.filter(c => c.relType.includes('CONFLICT'));
  if (conflicts.length > 0) {
    console.log(`⚠️ Potential Conflicts Detected:`);
    conflicts.forEach(cf => {
      console.log(`  - ⚔️ Conflict with scenario-${cf.otherName}: ${cf.details}`);
    });
    console.log(``);
  }
}

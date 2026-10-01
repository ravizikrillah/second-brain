#!/usr/bin/env node

/**
 * Universal Polyglot API, gRPC, Gateway & Surrounding System Ingester for Second Brain
 * 
 * Supports Multi-Language Microservice Repositories:
 * 1. Golang: Gin, Echo, Chi, Net/HTTP + Go Struct DTOs
 * 2. Python: FastAPI, Starlette, Flask, Django REST + Pydantic BaseModels
 * 3. Node.js / TypeScript: Express, Fastify, NestJS + TypeScript DTOs
 * 4. Java / Kotlin: Spring Boot (@RestController, @GetMapping, etc.)
 * 5. Protocol Buffers: Language-agnostic gRPC RPC Contracts (.proto)
 * 6. Edge Gateways: KrakenD ingress routing (krakend.json)
 * 7. OpenAPI / Swagger: Language-agnostic swagger.json & openapi.yaml
 * 8. External Surrounding Systems: Curls, YAML web_api, & BRD IFAs
 */

const fs = require('fs');
const path = require('path');
const { resolveSources, findFiles: resolveFindFiles, sanitizeProvenancePath } = require('./source-resolver');

const targetDir = process.cwd();
const codeResolution = resolveSources('code', { targetDir });
const brdResolution = resolveSources('brd', { targetDir });
const outputFile = path.join(targetDir, '01-ground-truth', 'api-inventory.md');

let sbConfig = {};
try {
  const cfgFile = path.join(targetDir, 'second-brain.json');
  const localCfgFile = path.join(targetDir, 'second-brain.local.json');
  if (fs.existsSync(cfgFile)) sbConfig = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  if (fs.existsSync(localCfgFile)) sbConfig = { ...sbConfig, ...JSON.parse(fs.readFileSync(localCfgFile, 'utf8')) };
} catch (e) {}

function cleanRel(filePath, extra = {}) {
  return sanitizeProvenancePath(filePath, { targetDir, ...extra });
}

console.log(`\n🔌 Second Brain Universal Polyglot API & Surrounding System Ingester (Universal Source Resolver)\n`);

const validCodeSources = codeResolution.sources.filter(s => s.exists);
const validBrdSources = brdResolution.sources.filter(s => s.exists);

if (codeResolution.configPath) {
  console.log(`⚙️  Loaded configuration from: ${path.relative(targetDir, codeResolution.configPath) || codeResolution.configPath}`);
}

console.log(`📁 Resolved Code Source Directories:`);
if (validCodeSources.length === 0) {
  console.log(`   (None found)`);
} else {
  validCodeSources.forEach(s => {
    const badge = s.isExternal ? '🌐 External Repo' : '📁 Local Dir';
    console.log(`   • [${s.origin}] ${s.path} (${badge})`);
  });
}

console.log(`📁 Resolved BRD Source Directories:`);
if (validBrdSources.length === 0) {
  console.log(`   (None found)`);
} else {
  validBrdSources.forEach(s => {
    const badge = s.isExternal ? '🌐 External Path' : '📁 Local Dir';
    console.log(`   • [${s.origin}] ${s.path} (${badge})`);
  });
}
console.log('');

if (validCodeSources.length === 0 && validBrdSources.length === 0) {
  console.log(`⚠️  No raw inputs found in code or BRD sources.`);
  console.log(`\n💡 Tip: Point to external repositories via CLI flags or 'second-brain.json':`);
  console.log(`   CLI: node ./bin/ingest-apis.js --code=../my-backend-repo`);
  console.log(`   Config file (second-brain.json):`);
  console.log(`   {\n     "sources": {\n       "code": ["../backend-service", "../frontend-app"],\n       "ddl": ["../backend-service/migrations"]\n     }\n   }\n`);
  process.exit(0);
}

function scanAllCodeSources(filterFn, options = {}) {
  let all = [];
  validCodeSources.forEach(src => {
    all = all.concat(resolveFindFiles(src.path, filterFn, options));
  });
  return all;
}

function scanAllBrdSources(filterFn, options = {}) {
  let all = [];
  validBrdSources.forEach(src => {
    all = all.concat(resolveFindFiles(src.path, filterFn, options));
  });
  return all;
}

// Generic Default Surrounding System Archetypes (Zero Proprietary Vendor Names)
// Overridable per-project via second-brain.json or second-brain.local.json under "surroundings"
const DEFAULT_SURROUNDING_METADATA = {
  auth: {
    code: 'AUTH / IDP',
    name: 'Identity & Access Management (SSO / OAuth2 / OIDC)',
    role: 'Centralized identity provider, token verification, and enterprise single sign-on',
    direction: 'Outbound Client Call & OAuth Redirect',
    protocol: 'REST HTTPS / OIDC',
    ownership: 'Enterprise IT Security / IAM'
  },
  payment: {
    code: 'PAYMENT',
    name: 'Payment Gateway Platform',
    role: 'Centralized payment processing for credit card, virtual accounts, and digital wallets',
    direction: 'Outbound Client Call & Inbound Webhook',
    protocol: 'REST HTTPS / Webhook',
    ownership: 'Enterprise Finance & Billing'
  },
  notification: {
    code: 'NOTIF',
    name: 'Notification Delivery Engine',
    role: 'Multi-channel outbound transactional notifications (SMS, Email, Push Notifications)',
    direction: 'Outbound Client Call',
    protocol: 'REST HTTPS / Event Queue',
    ownership: 'Enterprise Communications'
  },
  storage: {
    code: 'STORAGE',
    name: 'Object & Document Storage Vault',
    role: 'Secure digital document repository, object storage, and signature verification',
    direction: 'Outbound Client Call',
    protocol: 'REST HTTPS (S3-compatible / Vault)',
    ownership: 'Enterprise Infrastructure / Document Services'
  },
  crm: {
    code: 'CRM',
    name: 'Customer Relationship Management (CRM)',
    role: 'Customer 360 profile lookup, lead management, and interaction history',
    direction: 'Outbound Client Call',
    protocol: 'REST HTTPS',
    ownership: 'Enterprise CRM Team'
  },
  maps: {
    code: 'MAPS',
    name: 'Geospatial & Geocoding Service',
    role: 'Address geocoding, reverse geocoding, and map location validation',
    direction: 'Outbound Client Call',
    protocol: 'REST HTTPS',
    ownership: 'Third-Party Geospatial Provider'
  },
  analytics: {
    code: 'ANALYTICS',
    name: 'Big Data & Analytics Warehouse',
    role: 'Data lake ingestion, business intelligence, and event aggregation',
    direction: 'Outbound Client Call / Event Stream',
    protocol: 'REST HTTPS / Event Queue',
    ownership: 'Enterprise Data Platform'
  }
};

// Helper: Recursively find files (uses high-performance source-resolver findFiles)
function findFiles(dir, filterFn, options = {}) {
  return resolveFindFiles(dir, filterFn, options);
}

function cleanPath(p) {
  if (!p) return '/';
  let cleaned = p.replace(/\/+/g, '/');
  if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
  if (cleaned.length > 1 && cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

function joinPaths(p1, p2) {
  if (!p1 && !p2) return '/';
  if (!p1) return cleanPath(p2);
  if (!p2) return cleanPath(p1);
  return cleanPath(p1.replace(/\/+$/, '') + '/' + p2.replace(/^\/+/, ''));
}

// Ignore non-service YAML files
function isServiceConfigFile(filePath) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('/.github/') || norm.includes('/.gitlab') || norm.includes('gitlab-ci')) return false;
  if (norm.includes('pnpm-lock') || norm.includes('docker-compose') || norm.includes('pre-commit')) return false;
  if (norm.includes('mockery') || norm.includes('golangci') || norm.includes('buf.gen') || norm.includes('buf.yaml')) return false;
  if (norm.includes('issue_template') || norm.includes('pull_request_template')) return false;
  if (norm.includes('/pipeline/') || norm.includes('service-stages') || norm.includes('aws-golang')) return false;
  if (norm.includes('logstash') || norm.includes('task_planning_crew')) return false;
  
  if (norm.includes('/microservice-yaml-configs/')) return true;
  if (norm.endsWith('/config.yml') || norm.endsWith('/config.yaml')) return true;
  if (norm.match(/config-[a-zA-Z0-9_-]+\.ya?ml$/)) return true;
  return false;
}

// Detect runtime for a microservice directory
function detectRuntime(dirPath) {
  if (!fs.existsSync(dirPath)) return 'Golang 1.21';
  const files = fs.readdirSync(dirPath);
  const fullContents = findFiles(dirPath, (f) => true);

  if (fullContents.some(f => f.endsWith('.go'))) return 'Golang 1.21';
  if (fullContents.some(f => f.endsWith('.py')) || files.includes('requirements.txt') || files.includes('pyproject.toml')) return 'Python 3.11 (FastAPI)';
  if (files.includes('pom.xml') || fullContents.some(f => f.endsWith('.java'))) return 'Java 17 (Spring Boot)';
  if (files.includes('package.json') || fullContents.some(f => f.endsWith('.ts'))) return 'Node.js 20 (TypeScript)';
  if (fullContents.some(f => f.endsWith('.rs'))) return 'Rust (Actix/Axum)';
  return 'Polyglot Service';
}

// -------------------------------------------------------------
// 1. INGEST CONFIGS & DISCOVER MICROSERVICES
// -------------------------------------------------------------
const microservices = new Map();
const allYamls = scanAllCodeSources((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
const configFiles = allYamls.filter(isServiceConfigFile);

console.log(`🔍 Discovered ${configFiles.length} service configuration file(s).`);

configFiles.forEach(cfgPath => {
  const content = fs.readFileSync(cfgPath, 'utf8');
  const relPath = cleanRel(cfgPath);
  const baseName = path.basename(cfgPath);

  // Extract service name
  let svcName = baseName.replace(/^config-/, '').replace(/\.ya?ml$/, '');
  if (svcName === 'config' || svcName === 'application' || svcName === 'app') {
    const parentDirName = path.basename(path.dirname(cfgPath));
    if (parentDirName && parentDirName !== '.' && parentDirName !== 'config' && parentDirName !== 'configs') {
      svcName = parentDirName;
    } else {
      const parts = relPath.split(path.sep);
      const backendIdx = parts.indexOf('backend') !== -1 ? parts.indexOf('backend') : parts.indexOf('services');
      if (backendIdx !== -1 && parts[backendIdx + 1]) {
        svcName = parts[backendIdx + 1];
      }
    }
  }
  
  // Extract port
  let httpPort = '—';
  const portMatch = content.match(/http:\s*(?:\r?\n|\n)\s*port:\s*['"]?([0-9]+)['"]?/i) || content.match(/port:\s*['"]?([0-9]+)['"]?/i);
  if (portMatch) httpPort = portMatch[1];

  let grpcPort = '—';
  const grpcMatch = content.match(/grpc:\s*(?:\r?\n|\n)\s*port:\s*['"]?(:?[0-9]+)['"]?/i) || content.match(/grpc_port:\s*['"]?(:?[0-9]+)['"]?/i);
  if (grpcMatch) grpcPort = grpcMatch[1].startsWith(':') ? grpcMatch[1] : `:${grpcMatch[1]}`;

  let dbInfo = '—';
  if (/postgres:/i.test(content)) dbInfo = 'PostgreSQL';
  if (/mysql:/i.test(content)) dbInfo = dbInfo === '—' ? 'MySQL' : `${dbInfo}, MySQL`;
  if (/redis:/i.test(content)) dbInfo = dbInfo === '—' ? 'Redis' : `${dbInfo}, Redis`;

  let responsibility = 'Core domain business logic and state management';
  if (svcName.includes('link')) responsibility = 'Journey token generation, session lifecycle, link analytics';
  else if (svcName.includes('product')) responsibility = 'Product catalog, package offers, speed tiers, add-ons';
  else if (svcName.includes('order')) responsibility = 'Order lifecycle, checkout cart, appointments, feasibility';
  else if (svcName.includes('auth')) responsibility = 'Customer authentication, OTP dispatch/validation, JWT session';
  else if (svcName.includes('payment')) responsibility = 'Payment initiation, transaction verification, receipt issuing';
  else if (svcName.includes('document')) responsibility = 'PDF digital contracts, signature capture, consent archival';
  else if (svcName.includes('address')) responsibility = 'Postal code lookup, administrative zoning, geocoding';
  else if (svcName.includes('notif')) responsibility = 'Outbound SMS, WhatsApp, and email customer notifications';
  else if (svcName.includes('callback')) responsibility = 'Webhook router for payment gateway and upstream callbacks';
  else if (svcName.includes('fallout')) responsibility = 'Automated fallout recovery queues, manual task handling';
  else if (svcName.includes('failover')) responsibility = 'Failover orchestration, retry queues, resilience worker';
  else if (svcName.includes('smart-selfcare')) responsibility = 'Self-care diagnostic hub, subscriber profile, router reboot';
  else if (svcName.includes('tracking')) responsibility = 'Real-time order tracker, technician dispatch status, timeline';

  if (!microservices.has(svcName) || microservices.get(svcName).httpPort === '—') {
    microservices.set(svcName, {
      name: svcName,
      runtime: 'Golang 1.21',
      httpPort,
      grpcPort,
      db: dbInfo,
      responsibility,
      provenance: `[SRC:CODE:${relPath}]`,
      endpoints: [],
      grpcServices: [],
      dtoModels: []
    });
  }
});

// Scan all potential microservice root directories across all valid code sources
const candidateDirs = [];
const seenCandidateDirs = new Set();

// 1. Dynamic manifest discovery (go.mod, pom.xml, requirements.txt, pyproject.toml, package.json)
const manifestFiles = scanAllCodeSources((file, fullPath) => {
  const norm = fullPath.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('/packages/components/') || norm.includes('/.vite/') || norm.includes('/node_modules/')) return false;
  if (norm.includes('/packages/') && file === 'package.json') return false;
  return file === 'go.mod' || file === 'pom.xml' || file === 'requirements.txt' || file === 'pyproject.toml' || file === 'package.json';
});

manifestFiles.forEach(manifestPath => {
  const dir = path.dirname(manifestPath);
  const base = path.basename(dir);
  if (seenCandidateDirs.has(dir)) return;
  if (base === 'common' || base === 'pkg' || base === 'packages' || base === 'node_modules' || base === 'dist' || base === 'vendor') return;
  seenCandidateDirs.add(dir);
  candidateDirs.push({ name: base, fullDirPath: dir });
});

// 2. Fallback to standard directory conventions if manifest files not found
const serviceRootDirs = [];
validCodeSources.forEach(src => {
  serviceRootDirs.push(src.path);
  ['repo/backend', 'repo/ai', 'repo/services', 'repo/apps', 'services', 'backend', 'apps', 'packages', 'modules', 'Source Code BE', 'Source Code FE'].forEach(sub => {
    const subPath = path.join(src.path, sub);
    if (fs.existsSync(subPath)) {
      serviceRootDirs.push(subPath);
    }
  });
});

serviceRootDirs.forEach(rootDir => {
  if (!fs.existsSync(rootDir)) return;

  const isDirectService = fs.existsSync(path.join(rootDir, 'go.mod')) ||
                          fs.existsSync(path.join(rootDir, 'requirements.txt')) ||
                          fs.existsSync(path.join(rootDir, 'pyproject.toml')) ||
                          fs.existsSync(path.join(rootDir, 'pom.xml')) ||
                          (fs.existsSync(path.join(rootDir, 'package.json')) && !fs.existsSync(path.join(rootDir, 'pnpm-workspace.yaml')));

  if (isDirectService && !seenCandidateDirs.has(rootDir)) {
    seenCandidateDirs.add(rootDir);
    candidateDirs.push({ name: path.basename(rootDir), fullDirPath: rootDir });
  }

  try {
    const subDirs = fs.readdirSync(rootDir).filter(d => {
      if (d === 'common' || d === 'pkg' || d === 'packages' || d === 'shared' || d === '.git' || d === 'node_modules' || d === 'vendor') return false;
      try {
        const full = path.join(rootDir, d);
        if (!fs.statSync(full).isDirectory()) return false;
        // Must contain a manifest file to be considered a service
        return fs.existsSync(path.join(full, 'go.mod')) ||
               fs.existsSync(path.join(full, 'requirements.txt')) ||
               fs.existsSync(path.join(full, 'pyproject.toml')) ||
               fs.existsSync(path.join(full, 'pom.xml')) ||
               (fs.existsSync(path.join(full, 'package.json')) && !fs.existsSync(path.join(full, 'pnpm-workspace.yaml')));
      } catch (e) {
        return false;
      }
    });
    subDirs.forEach(d => {
      const full = path.join(rootDir, d);
      if (!seenCandidateDirs.has(full)) {
        seenCandidateDirs.add(full);
        candidateDirs.push({ name: d, fullDirPath: full });
      }
    });
  } catch (e) {}
});

candidateDirs.forEach(({ name: d, fullDirPath }) => {
    const runtime = detectRuntime(fullDirPath);

    if (!microservices.has(d)) {
      let resp = 'Polyglot microservice component';
      if (d.includes('krakend') || d.includes('gateway') || d.includes('middleware')) resp = 'API Gateway routing, rate-limiting, and request transformation';
      else if (d.includes('worker') || d.includes('ops')) resp = 'Background asynchronous jobs, status sync, order escalation';
      else if (d.includes('dashboard')) resp = 'Dashboard metrics, event aggregation, and observability';
      else if (d.includes('approval')) resp = 'Service request approvals and operational sign-off';
      else if (d.includes('survey')) resp = 'Post-service customer satisfaction survey rating';
      else if (d.includes('utility-monitoring')) resp = 'Utility network monitoring and telemetry';
      else if (d.includes('rag') || d.includes('ai-log')) resp = 'AI RAG Knowledge Engine, vector analytics, and conversational CMS';
      else if (d.includes('teams-bot') || d.includes('telegram-bot')) resp = 'Enterprise conversational bot gateway & messaging handler';

      let port = '—';
      if (d.includes('krakend') || d.includes('gateway')) port = 'Gateway';
      else if (d.includes('worker')) port = 'Worker';
      else if (d.includes('rag-cms')) port = '8811';
      else if (d.includes('ai-log')) port = '8000';

      const relPath = cleanRel(fullDirPath);
      microservices.set(d, {
        name: d,
        runtime,
        httpPort: port,
        grpcPort: '—',
        db: d.includes('ai') ? 'PostgreSQL (pgvector)' : '—',
        responsibility: resp,
        provenance: `[SRC:CODE:${relPath}]`,
        endpoints: [],
        grpcServices: [],
        dtoModels: []
      });
    } else {
      const existing = microservices.get(d);
      existing.runtime = runtime;
    }
  });

console.log(`📦 Discovered ${microservices.size} microservice module(s) across code sources.`);

// -------------------------------------------------------------
// 2. PARSE INTERNAL APIS: Polyglot Routing & Schemas
// -------------------------------------------------------------
console.log(`🔍 Scanning Polyglot API route definitions (Go, Python, TypeScript, Java, OpenAPI)...`);

// Helper to find which microservice owns a given file
function getOwningService(relOrFullPath) {
  const norm = relOrFullPath.replace(/\\/g, '/');
  const sortedNames = Array.from(microservices.keys()).sort((a, b) => b.length - a.length);
  for (const svcName of sortedNames) {
    if (norm.includes(`/${svcName}/`) || norm.endsWith(`/${svcName}`) || norm.includes(`/${svcName.replace(/^(?:svc|backend|app)-/, '')}/`)) {
      return svcName;
    }
  }
  if (microservices.size === 1) {
    return Array.from(microservices.keys())[0];
  }
  return null;
}

// 2a. GOLANG ROUTE & DTO PARSER
const goFiles = scanAllCodeSources((file, fullPath) => {
  if (!file.endsWith('.go')) return false;
  if (file.endsWith('_test.go') || file.includes('_test_')) return false;
  if (fullPath.includes('/vendor/') || fullPath.includes('/examples/') || fullPath.includes('/mocks/') || fullPath.includes('/mock/')) return false;
  return true;
});

const goFilesBySvc = new Map();
goFiles.forEach(f => {
  const rel = path.relative(targetDir, f);
  const svc = getOwningService(rel);
  if (svc) {
    if (!goFilesBySvc.has(svc)) goFilesBySvc.set(svc, []);
    goFilesBySvc.get(svc).push(f);
  }
});

function parseDeclarativeGoRoutes(content) {
  const lines = content.split(/\r?\n/);
  const endpoints = [];
  const pathStack = [];
  let braceDepth = 0;
  let currentMethod = null;
  let currentPath = null;
  let currentAction = null;
  let currentLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    const pathMatch = trimmed.match(/Path:\s*["']([^"']+)["']/);
    const methodMatch = trimmed.match(/Method:\s*(?:http\.Method([A-Za-z]+)|["']([A-Z]+)["'])/i);
    const actionMatch = trimmed.match(/Action:\s*([a-zA-Z0-9_.]+)/);

    if (pathMatch) {
      const p = pathMatch[1];
      const hasSubRoutes = trimmed.includes('Routes:') || (i + 1 < lines.length && lines[i + 1].includes('Routes:'));
      if (hasSubRoutes) {
        pathStack.push({ depth: braceDepth + openBraces, path: p });
      } else {
        currentPath = p;
        currentLine = i + 1;
      }
    }

    if (methodMatch) {
      currentMethod = (methodMatch[1] || methodMatch[2]).toUpperCase();
      if (!currentLine) currentLine = i + 1;
    }

    if (actionMatch) {
      currentAction = actionMatch[1];
    }

    if (currentPath && currentMethod) {
      const prefix = pathStack.map(s => s.path).join('');
      let fullPath = prefix + (currentPath.startsWith('/') ? currentPath : '/' + currentPath);
      fullPath = fullPath.replace(/\/+/g, '/');
      endpoints.push({ method: currentMethod, path: fullPath, action: currentAction, line: currentLine });
      currentPath = null;
      currentMethod = null;
      currentAction = null;
    }

    braceDepth += openBraces - closeBraces;
    while (pathStack.length > 0 && braceDepth < pathStack[pathStack.length - 1].depth) {
      pathStack.pop();
    }
  }

  return endpoints;
}

for (const [svcName, files] of goFilesBySvc.entries()) {
  const svc = microservices.get(svcName);
  if (!svc) continue;

  const delegations = new Map();

  files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/);
    const localVars = new Map();

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      const gm = trimmed.match(/([a-zA-Z0-9_]+)\s*(?::=|=)\s*([a-zA-Z0-9_]+)\.Group\(\s*["']([^"']*)["']/);
      if (gm) {
        const varName = gm[1];
        const parentVar = gm[2];
        const groupPath = gm[3];
        const parentPrefix = localVars.get(parentVar) || '';
        localVars.set(varName, joinPaths(parentPrefix, groupPath));
      }

      const dm = trimmed.match(/(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\(\s*([a-zA-Z0-9_]+)/);
      if (dm) {
        const funcName = dm[1];
        const argVar = dm[2];
        if (localVars.has(argVar)) {
          delegations.set(funcName, localVars.get(argVar));
        }
      }
    });
  });

  files.forEach(f => {
    const relPath = cleanRel(f);
    const content = fs.readFileSync(f, 'utf8');

    // 1. Declarative Route Trees (ge.Route / Route struct trees)
    if (content.includes('Path:') && (content.includes('Method:') || content.includes('http.Method'))) {
      const declEndpoints = parseDeclarativeGoRoutes(content);
      declEndpoints.forEach(ep => {
        if (!svc.endpoints.some(r => r.method === ep.method && r.path === ep.path)) {
          svc.endpoints.push({
            method: ep.method,
            path: ep.path,
            provenance: `[SRC:CODE:${relPath}#L${ep.line}]`
          });
        }
      });
    }

    const lines = content.split(/\r?\n/);

    let pathVersion = '';
    const normPath = f.replace(/\\/g, '/');
    if (normPath.includes('/v1/') || normPath.includes('/v1Refactor/')) pathVersion = '/v1';
    else if (normPath.includes('/v2/') || normPath.includes('/v2Refactor/')) pathVersion = '/v2';
    else if (normPath.includes('/v3/')) pathVersion = '/v3';

    let currentFuncPrefix = pathVersion;
    const varGroups = new Map();
    let currentStruct = null;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      const structMatch = trimmed.match(/^type\s+([A-Z][a-zA-Z0-9_]+)\s+struct\s*\{/);
      if (structMatch) {
        currentStruct = {
          name: structMatch[1],
          fields: [],
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        };
        if (!svc.dtoModels.some(d => d.name === currentStruct.name)) {
          svc.dtoModels.push(currentStruct);
        }
      } else if (currentStruct && trimmed === '}') {
        currentStruct = null;
      } else if (currentStruct) {
        const fieldMatch = trimmed.match(/^([A-Z][a-zA-Z0-9_]+)\s+([*a-zA-Z0-9_\[\]]+)(?:\s+`([^`]*)`)?/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];
          const tag = fieldMatch[3] || '';
          const jsonMatch = tag.match(/json:"([^",]+)/);
          const required = tag.includes('binding:"required"') || tag.includes('validate:"required"');
          currentStruct.fields.push({
            name: fieldName,
            jsonKey: jsonMatch ? jsonMatch[1] : fieldName.toLowerCase(),
            type: fieldType,
            required
          });
        }
      }

      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      const fnMatch = trimmed.match(/func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s+\*?gin\.(?:RouterGroup|Engine)/);
      if (fnMatch) {
        const fnName = fnMatch[1];
        const paramVar = fnMatch[2];
        const delegatedPrefix = delegations.get(fnName);
        currentFuncPrefix = delegatedPrefix || pathVersion || '';
        varGroups.clear();
        if (currentFuncPrefix) {
          varGroups.set(paramVar, currentFuncPrefix);
          varGroups.set('handler', currentFuncPrefix);
          varGroups.set('h', currentFuncPrefix);
        }
      }

      const gm = trimmed.match(/([a-zA-Z0-9_]+)\s*(?::=|=)\s*([a-zA-Z0-9_]+)\.Group\(\s*["']([^"']*)["']/);
      if (gm) {
        const varName = gm[1];
        const parentVar = gm[2];
        const groupPath = gm[3];
        const parentPrefix = varGroups.get(parentVar) || currentFuncPrefix || '';
        const fullGroup = joinPaths(parentPrefix, groupPath);
        varGroups.set(varName, fullGroup);
      }

      const rm = trimmed.match(/([a-zA-Z0-9_]+)\.(GET|POST|PUT|DELETE|PATCH)\(\s*["']([^"']*)["']/);
      if (rm) {
        const callerVar = rm[1];
        const method = rm[2];
        const subPath = rm[3];

        if (/^(?:header|req|request|rdb|redis|db|client|resp|response|claims|cache|map)$/i.test(callerVar)) return;

        let basePrefix = varGroups.get(callerVar) || varGroups.get('handler') || varGroups.get('h') || currentFuncPrefix || '';
        let fullRoute = joinPaths(basePrefix, subPath);

        if (
          fullRoute.endsWith('/healthz') || 
          fullRoute.endsWith('/metrics') || 
          fullRoute.endsWith('/health') || 
          fullRoute.endsWith('/ping') || 
          fullRoute.includes('/swagger') || 
          fullRoute.includes('/debug/pprof')
        ) {
          return;
        }

        if (!svc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
          svc.endpoints.push({
            method,
            path: fullRoute,
            provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
          });
        }
      }
    });
  });
}

// 2b. PYTHON ROUTE & PYDANTIC MODEL PARSER (FastAPI, Flask, Starlette)
const pyFiles = scanAllCodeSources((file, fullPath) => {
  if (!file.endsWith('.py')) return false;
  if (file.endsWith('_test.py') || file.startsWith('test_')) return false;
  if (fullPath.includes('/venv/') || fullPath.includes('/.venv/') || fullPath.includes('/tests/')) return false;
  return true;
});

const pyFilesBySvc = new Map();
pyFiles.forEach(f => {
  const rel = path.relative(targetDir, f);
  const svc = getOwningService(rel);
  if (svc) {
    if (!pyFilesBySvc.has(svc)) pyFilesBySvc.set(svc, []);
    pyFilesBySvc.get(svc).push(f);
  }
});

for (const [svcName, files] of pyFilesBySvc.entries()) {
  const svc = microservices.get(svcName);
  if (!svc) continue;

  const routerPrefixes = new Map();

  // Pass 1: Extract app.include_router prefixes
  files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach(l => {
      const trimmed = l.trim();
      const incMatch = trimmed.match(/include_router\(\s*([a-zA-Z0-9_\.]+)\s*,\s*prefix\s*=\s*["']([^"']*)["']/);
      if (incMatch) {
        const moduleName = incMatch[1].split('.')[0];
        routerPrefixes.set(moduleName, incMatch[2]);
        routerPrefixes.set(incMatch[1], incMatch[2]);
      }
    });
  });

  // Pass 2: Extract endpoints and Pydantic models
  files.forEach(f => {
    const relPath = cleanRel(f);
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/);
    const baseName = path.basename(f, '.py');
    const filePrefix = routerPrefixes.get(baseName) || '';

    let currentModel = null;
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) return;

      // Pydantic Schema: class Name(BaseModel):
      const modelMatch = trimmed.match(/^class\s+([A-Z][a-zA-Z0-9_]+)\s*\(\s*(?:BaseModel|[A-Z][a-zA-Z0-9_]*Base)/);
      if (modelMatch) {
        currentModel = {
          name: modelMatch[1],
          fields: [],
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        };
        if (!svc.dtoModels.some(d => d.name === currentModel.name)) {
          svc.dtoModels.push(currentModel);
        }
      } else if (currentModel && (/^[a-zA-Z0-9_]/.test(line) && !line.startsWith(' ') && !line.startsWith('\t'))) {
        currentModel = null;
      } else if (currentModel) {
        const fieldMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*([^=\n#]+)/);
        if (fieldMatch && !fieldMatch[1].startsWith('class')) {
          currentModel.fields.push({
            name: fieldMatch[1],
            jsonKey: fieldMatch[1],
            type: fieldMatch[2].trim(),
            required: !trimmed.includes('Optional') && !trimmed.includes('None')
          });
        }
      }

      // Route decorator: @app.get("/path") or @router.post("/path")
      const routeMatch = trimmed.match(/@(app|router|api_router|bp)\.(get|post|put|delete|patch)\(\s*["']([^"']*)["']/i);
      if (routeMatch) {
        const caller = routeMatch[1];
        const method = routeMatch[2].toUpperCase();
        const subPath = routeMatch[3];

        let prefix = caller === 'app' ? '' : (filePrefix || '');
        let fullRoute = joinPaths(prefix, subPath);

        if (fullRoute.endsWith('/health') || fullRoute.endsWith('/healthz') || fullRoute.includes('/docs') || fullRoute.includes('/redoc')) {
          return;
        }

        if (!svc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
          svc.endpoints.push({
            method,
            path: fullRoute,
            provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
          });
        }
      }

      // Flask route decorator: @app.route("/path", methods=["GET", "POST"])
      const flaskMatch = trimmed.match(/@(app|api|bp)\.route\(\s*["']([^"']*)["'](?:\s*,\s*methods\s*=\s*\[([^\]]+)\])?/i);
      if (flaskMatch) {
        const subPath = flaskMatch[2];
        const methodsRaw = flaskMatch[3] ? flaskMatch[3].replace(/['"]/g, '').split(',') : ['GET'];
        methodsRaw.forEach(m => {
          const method = m.trim().toUpperCase();
          const fullRoute = joinPaths(filePrefix || '', subPath);
          if (!svc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
            svc.endpoints.push({ method, path: fullRoute, provenance: `[SRC:CODE:${relPath}#L${idx + 1}]` });
          }
        });
      }

      // Django REST Framework: path("users/", views.UserList.as_view())
      const djangoMatch = trimmed.match(/path\(\s*["']([^"']*)["']/i);
      if (djangoMatch && (relPath.includes('urls.py') || relPath.includes('routing.py'))) {
        const fullRoute = cleanPath(djangoMatch[1]);
        if (!svc.endpoints.some(r => r.path === fullRoute)) {
          svc.endpoints.push({ method: 'ALL', path: fullRoute, provenance: `[SRC:CODE:${relPath}#L${idx + 1}]` });
        }
      }
    });
  });
}

// 2c. NODE.JS & TYPESCRIPT ROUTE PARSER (Express, Fastify, NestJS)
const tsFiles = scanAllCodeSources((file, fullPath) => {
  if (!file.endsWith('.ts') && !file.endsWith('.js')) return false;
  if (file.endsWith('.spec.ts') || file.endsWith('.test.ts') || file.endsWith('.test.js')) return false;
  if (fullPath.includes('/node_modules/') || fullPath.includes('/dist/') || fullPath.includes('/build/')) return false;
  return true;
});

tsFiles.forEach(f => {
  const relPath = cleanRel(f);
  const svc = getOwningService(relPath);
  if (!svc) return;

  const targetSvc = microservices.get(svc);
  if (!targetSvc) return;

  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);

  let controllerPrefix = '';
  // Detect NestJS @Controller('prefix')
  const ctrlMatch = content.match(/@Controller\(\s*['"]([^'"]*)['"]\)/);
  if (ctrlMatch) controllerPrefix = ctrlMatch[1];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // NestJS @Get('path'), @Post('path')
    const nestMatch = trimmed.match(/@(Get|Post|Put|Delete|Patch)\(\s*(?:['"]([^'"]*)['"])?\s*\)/i);
    if (nestMatch) {
      const method = nestMatch[1].toUpperCase();
      const subPath = nestMatch[2] || '';
      const fullRoute = joinPaths(controllerPrefix, subPath);
      if (!targetSvc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
        targetSvc.endpoints.push({
          method,
          path: fullRoute,
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        });
      }
      return;
    }

    // Express / Fastify: app.get('/path', ...) or router.post('/path', ...)
    const expMatch = trimmed.match(/(?:app|router|fastify)\.(get|post|put|delete|patch)\(\s*['"]([^'"]*)['"]/i);
    if (expMatch) {
      const method = expMatch[1].toUpperCase();
      const subPath = expMatch[2];
      const fullRoute = cleanPath(subPath);
      if (!targetSvc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
        targetSvc.endpoints.push({
          method,
          path: fullRoute,
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        });
      }
    }
  });
});

// 2d. JAVA / KOTLIN (Spring Boot) PARSER
const javaFiles = scanAllCodeSources((file, fullPath) => {
  if (!file.endsWith('.java') && !file.endsWith('.kt')) return false;
  if (fullPath.includes('/test/') || fullPath.includes('/target/')) return false;
  return true;
});

javaFiles.forEach(f => {
  const relPath = cleanRel(f);
  const svc = getOwningService(relPath);
  if (!svc) return;

  const targetSvc = microservices.get(svc);
  if (!targetSvc) return;

  const content = fs.readFileSync(f, 'utf8');
  let basePrefix = '';
  const reqMap = content.match(/@RequestMapping\(\s*(?:value\s*=\s*)?["']([^"']*)["']/);
  if (reqMap) basePrefix = reqMap[1];

  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const springMatch = trimmed.match(/@(Get|Post|Put|Delete|Patch)Mapping\(\s*(?:(?:value|path)\s*=\s*)?["']?([^"'\)]*)["']?\s*\)/);
    if (springMatch) {
      const method = springMatch[1].toUpperCase();
      const subPath = springMatch[2] || '';
      const fullRoute = joinPaths(basePrefix, subPath);
      if (!targetSvc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
        targetSvc.endpoints.push({
          method,
          path: fullRoute,
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        });
      }
    }
  });
});

// Helper: Parse OpenAPI / Swagger YAML without external dependencies
function parseOpenApiYaml(content) {
  const routes = [];
  const lines = content.split(/\r?\n/);
  let inPaths = false;
  let currentPath = null;
  let pathsIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.search(/\S/);

    if (/^paths\s*:/i.test(trimmed)) {
      inPaths = true;
      pathsIndent = indent;
      currentPath = null;
      continue;
    }

    if (inPaths) {
      if (indent <= pathsIndent && !trimmed.startsWith('-')) {
        inPaths = false;
        currentPath = null;
        continue;
      }

      const pathMatch = trimmed.match(/^['"]?(\/[^'":]+)['"]?\s*:/);
      if (pathMatch && indent > pathsIndent) {
        currentPath = pathMatch[1].trim();
        continue;
      }

      if (currentPath) {
        const methodMatch = trimmed.match(/^(get|post|put|delete|patch|options|head)\s*:/i);
        if (methodMatch) {
          routes.push({
            method: methodMatch[1].toUpperCase(),
            path: currentPath,
            line: i + 1
          });
        }
      }
    }
  }
  return routes;
}

// 2e. OPENAPI / SWAGGER SPECS (Language-Agnostic: JSON & YAML)
const openApiFiles = scanAllCodeSources((file) => /swagger.*\.json$|openapi.*\.(json|ya?ml)$|api-spec.*\.(json|ya?ml)$/i.test(file));
openApiFiles.forEach(f => {
  const relPath = cleanRel(f);
  const svc = getOwningService(relPath);
  const targetSvc = svc ? microservices.get(svc) : null;

  try {
    const fileContent = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.json')) {
      const doc = JSON.parse(fileContent);
      if (doc.paths) {
        for (const [routePath, methods] of Object.entries(doc.paths)) {
          for (const [method, op] of Object.entries(methods)) {
            const upperMethod = method.toUpperCase();
            if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(upperMethod)) continue;
            if (targetSvc && !targetSvc.endpoints.some(r => r.method === upperMethod && r.path === routePath)) {
              targetSvc.endpoints.push({
                method: upperMethod,
                path: routePath,
                provenance: `[SRC:CODE:${relPath}]`
              });
            }
          }
        }
      }
    } else if (f.endsWith('.yaml') || f.endsWith('.yml')) {
      const yamlRoutes = parseOpenApiYaml(fileContent);
      yamlRoutes.forEach(yr => {
        if (targetSvc && !targetSvc.endpoints.some(r => r.method === yr.method && r.path === yr.path)) {
          targetSvc.endpoints.push({
            method: yr.method,
            path: yr.path,
            provenance: `[SRC:CODE:${relPath}#L${yr.line}]`
          });
        }
      });
    }
  } catch (e) {}
});

// 2f. POSTMAN COLLECTIONS (*.postman_collection.json)
const postmanFiles = scanAllCodeSources((file) => /postman.*\.json$/i.test(file));
postmanFiles.forEach(pf => {
  const relPath = cleanRel(pf);
  const svc = getOwningService(relPath);
  const targetSvc = svc ? microservices.get(svc) : null;

  try {
    const colJson = JSON.parse(fs.readFileSync(pf, 'utf8'));
    function extractPostmanItems(items) {
      if (!Array.isArray(items)) return;
      items.forEach((item, idx) => {
        if (item.item) {
          extractPostmanItems(item.item);
        } else if (item.request) {
          const method = (item.request.method || 'GET').toUpperCase();
          let rawUrl = '';
          if (typeof item.request.url === 'string') rawUrl = item.request.url;
          else if (item.request.url && Array.isArray(item.request.url.path)) rawUrl = '/' + item.request.url.path.join('/');
          else if (item.request.url && item.request.url.raw) rawUrl = item.request.url.raw;

          let cleanUrl = rawUrl.replace(/^(?:https?:\/\/[^\/]+|\{\{[^\}]+\}\})/, '');
          if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
          cleanUrl = cleanUrl.split('?')[0];

          if (targetSvc && !targetSvc.endpoints.some(r => r.method === method && r.path === cleanUrl)) {
            targetSvc.endpoints.push({
              method,
              path: cleanUrl,
              provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
            });
          }
        }
      });
    }
    if (colJson.item) extractPostmanItems(colJson.item);
  } catch (e) {}
});

// 2g. PHP / LARAVEL (routes/*.php)
const phpFiles = scanAllCodeSources((file, fullPath) => {
  if (!file.endsWith('.php')) return false;
  if (fullPath.includes('/vendor/') || fullPath.includes('/tests/')) return false;
  return true;
});

phpFiles.forEach(f => {
  const relPath = cleanRel(f);
  const svc = getOwningService(relPath);
  if (!svc) return;
  const targetSvc = microservices.get(svc);
  if (!targetSvc) return;

  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) return;

    const routeMatch = trimmed.match(/Route::(get|post|put|delete|patch)\(\s*['"]([^'"]*)['"]/i);
    if (routeMatch) {
      const method = routeMatch[1].toUpperCase();
      const subPath = cleanPath(routeMatch[2]);
      if (!targetSvc.endpoints.some(r => r.method === method && r.path === subPath)) {
        targetSvc.endpoints.push({
          method,
          path: subPath,
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        });
      }
    }
  });
});

// 2h. C# / ASP.NET CORE (*.cs)
const csFiles = scanAllCodeSources((file, fullPath) => {
  if (!file.endsWith('.cs')) return false;
  if (fullPath.includes('/bin/') || fullPath.includes('/obj/') || fullPath.includes('/Test/')) return false;
  return true;
});

csFiles.forEach(f => {
  const relPath = cleanRel(f);
  const svc = getOwningService(relPath);
  if (!svc) return;
  const targetSvc = microservices.get(svc);
  if (!targetSvc) return;

  const content = fs.readFileSync(f, 'utf8');
  let baseRoute = '';
  const routeAttr = content.match(/\[Route\(\s*["']([^"']*)["']\s*\)\]/i);
  if (routeAttr) baseRoute = routeAttr[1].replace(/\[controller\]/i, svc);

  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const httpAttr = trimmed.match(/\[Http(Get|Post|Put|Delete|Patch)(?:\(\s*["']?([^"'\)]*)["']?\s*\))?\]/i);
    if (httpAttr) {
      const method = httpAttr[1].toUpperCase();
      const sub = httpAttr[2] || '';
      const fullRoute = joinPaths(baseRoute, sub);
      if (!targetSvc.endpoints.some(r => r.method === method && r.path === fullRoute)) {
        targetSvc.endpoints.push({
          method,
          path: fullRoute,
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        });
      }
    }
  });
});

// -------------------------------------------------------------
// 3. INGEST gRPC PROTOBUF CONTRACTS (.proto)
// -------------------------------------------------------------
console.log(`🔍 Scanning gRPC Protobuf (.proto) service definitions...`);

const protoFiles = scanAllCodeSources((file) => file.endsWith('.proto'));

protoFiles.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  const relPath = cleanRel(p);
  
  let matchedSvc = getOwningService(relPath);
  if (!matchedSvc) {
    const parts = relPath.split(path.sep);
    const backendIdx = parts.indexOf('backend') !== -1 ? parts.indexOf('backend') : parts.indexOf('services');
    if (backendIdx !== -1 && parts[backendIdx + 1]) {
      matchedSvc = parts[backendIdx + 1];
    }
  }

  const svc = microservices.get(matchedSvc);
  if (!svc) return;

  const lines = content.split(/\r?\n/);
  let currentService = '';

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    const sMatch = trimmed.match(/^service\s+([a-zA-Z0-9_]+)\s*\{/);
    if (sMatch) {
      currentService = sMatch[1];
    } else if (trimmed === '}') {
      currentService = '';
    } else if (currentService) {
      const rpcMatch = trimmed.match(/^rpc\s+([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*returns\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
      if (rpcMatch) {
        const method = rpcMatch[1];
        const req = rpcMatch[2];
        const resp = rpcMatch[3];

        if (!svc.grpcServices.some(g => g.service === currentService && g.method === method)) {
          svc.grpcServices.push({
            service: currentService,
            method,
            request: req,
            response: resp,
            provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
          });
        }
      }
    }
  });
});

// -------------------------------------------------------------
// 4. INGEST API GATEWAY INGRESS (KrakenD)
// -------------------------------------------------------------
console.log(`🔍 Scanning KrakenD API Gateway routing configurations...`);

const krakendFiles = scanAllCodeSources((file) => file.includes('krakend') && file.endsWith('.json'));
const gatewayEndpoints = [];

krakendFiles.forEach(kf => {
  const relPath = cleanRel(kf);
  try {
    const json = JSON.parse(fs.readFileSync(kf, 'utf8'));
    if (json.endpoints && Array.isArray(json.endpoints)) {
      json.endpoints.forEach((ep, idx) => {
        const endpointPath = ep.endpoint;
        const method = (ep.method || 'GET').toUpperCase();
        const backendUrl = ep.backend && ep.backend[0] ? ep.backend[0].url_pattern : '—';
        const headers = ep.input_headers ? ep.input_headers.join(', ') : 'None';
        const queryParams = ep.input_query_strings ? ep.input_query_strings.join(', ') : 'None';

        if (!gatewayEndpoints.some(g => g.method === method && g.endpoint === endpointPath)) {
          gatewayEndpoints.push({
            method,
            endpoint: endpointPath,
            backendUrl,
            headers,
            queryParams,
            provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
          });
        }
      });
    }
  } catch (e) {}
});

// -------------------------------------------------------------
// 5. INGEST EXTERNAL SURROUNDING SYSTEMS: Curls & YAML web_api
// -------------------------------------------------------------
console.log(`🔍 Scanning External Surrounding Systems and Interface Agreements...`);

const surroundingSystems = new Map();

function getOrCreateSurrounding(key, defaultRole) {
  const normKey = (key || 'external').toLowerCase().trim();
  if (surroundingSystems.has(normKey)) {
    return surroundingSystems.get(normKey);
  }
  const configured = (sbConfig && sbConfig.surroundings && (sbConfig.surroundings[normKey] || sbConfig.surroundings[key])) || {};
  const archetype = DEFAULT_SURROUNDING_METADATA[normKey] || {};

  const code = configured.code || archetype.code || key.toUpperCase();
  const name = configured.name || archetype.name || `${code} External Service`;
  const role = configured.role || archetype.role || defaultRole || `External enterprise service integration for ${code}`;
  const direction = configured.direction || archetype.direction || 'Outbound Client Call';
  const protocol = configured.protocol || archetype.protocol || 'REST HTTPS';
  const ownership = configured.ownership || archetype.ownership || 'External Service Provider / Third-Party';

  const entry = {
    code,
    name,
    role,
    direction,
    protocol,
    ownership,
    endpoints: [],
    sources: new Set()
  };
  surroundingSystems.set(normKey, entry);
  return entry;
}

// Pre-populate configured surroundings from second-brain.json if available
if (sbConfig && sbConfig.surroundings && typeof sbConfig.surroundings === 'object') {
  for (const [k, meta] of Object.entries(sbConfig.surroundings)) {
    getOrCreateSurrounding(k, meta.role);
  }
}

// 5a. Ingest curl files from configurations/curl-surroundings/ or curl directories
const curlDirs = [];
validCodeSources.forEach(src => {
  const candidates = [
    path.join(src.path, 'configurations', 'curl-surroundings'),
    path.join(src.path, 'curl-surroundings'),
    path.join(src.path, 'curls'),
    path.join(src.path, 'external-curls')
  ];
  candidates.forEach(c => {
    if (fs.existsSync(c) && !curlDirs.includes(c)) curlDirs.push(c);
  });
});
const localCurl = path.join(targetDir, '00-raw-inputs', 'existing-code', 'configurations', 'curl-surroundings');
if (fs.existsSync(localCurl) && !curlDirs.includes(localCurl)) curlDirs.push(localCurl);

curlDirs.forEach(curlDir => {
  try {
    const sysDirs = fs.readdirSync(curlDir).filter(d => {
      try { return fs.statSync(path.join(curlDir, d)).isDirectory(); } catch (e) { return false; }
    });
    sysDirs.forEach(sysKey => {
      const sysPath = path.join(curlDir, sysKey);
      const files = fs.readdirSync(sysPath).filter(f => f.endsWith('.txt') || f.endsWith('.sh') || f.endsWith('.curl'));

      const sys = getOrCreateSurrounding(sysKey);

      files.forEach(f => {
        const fPath = path.join(sysPath, f);
        const content = fs.readFileSync(fPath, 'utf8');
        const relPath = cleanRel(fPath);
        sys.sources.add(`[SRC:CODE:${relPath}]`);

        const methodMatch = content.match(/--request\s+([A-Z]+)/i) || content.match(/-X\s+([A-Z]+)/i) || ['GET', 'GET'];
        const method = (methodMatch[1] || 'GET').toUpperCase();

        const urlMatch = content.match(/'(https?:\/\/[^']+)'/) || content.match(/"(https?:\/\/[^"]+)"/) || content.match(/(https?:\/\/[^\s]+)/);
        let url = urlMatch ? urlMatch[1] : '';
        let endpointPath = url;
        try {
          if (url.startsWith('http')) {
            const parsed = new URL(url);
            endpointPath = parsed.pathname;
          }
        } catch (e) {}

        const title = f.replace(/\.(txt|sh|curl)$/, '').replace(/^(?:post|get|put|delete)-api-/, '').replace(/[-_]/g, ' ');

        if (!sys.endpoints.some(e => e.path === endpointPath && e.method === method)) {
          sys.endpoints.push({
            method,
            path: endpointPath,
            title: title.charAt(0).toUpperCase() + title.slice(1),
            provenance: `[SRC:CODE:${relPath}]`
          });
        }
      });
    });
  } catch (e) {}
});

// 5b. Ingest external endpoints from YAML configs (web_api / path_* mappings)
configFiles.forEach(cfgPath => {
  const content = fs.readFileSync(cfgPath, 'utf8');
  const relPath = cleanRel(cfgPath);
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^path_[a-zA-Z0-9_]+:\s*['"][^'"]+['"]/.test(trimmed)) {
      const m = trimmed.match(/^path_([a-zA-Z0-9_]+):\s*['"]([^'"]+)['"]/);
      if (m) {
        const key = m[1];
        let val = m[2];

        let targetKey = key.toLowerCase();
        if (targetKey.startsWith('external_')) targetKey = targetKey.replace(/^external_/, '');

        const sys = getOrCreateSurrounding(targetKey);
        sys.sources.add(`[SRC:CODE:${relPath}#L${idx + 1}]`);

        let cleanPath = val;
        try {
          if (val.startsWith('http')) {
            cleanPath = new URL(val).pathname;
          }
        } catch (e) {}
        const cleanTitle = key.replace(/_/g, ' ');

        if (!sys.endpoints.some(e => e.path === cleanPath)) {
          sys.endpoints.push({
            method: 'POST / GET',
            path: cleanPath,
            title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
            provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
          });
        }
      }
    }
  });
});

// 5c. Scan BRD Interface Agreement files
const brdFiles = scanAllBrdSources(f => /interface-agreement|blueprint|specification|integration/i.test(f));
brdFiles.forEach(fPath => {
  const f = path.basename(fPath, path.extname(fPath));
  const targetKey = f.toLowerCase().replace(/^(?:ifa|interface-agreement|spec)-/, '');
  const sys = getOrCreateSurrounding(targetKey);
  const relBrd = cleanRel(fPath);
  sys.sources.add(`[SRC:BRD:${relBrd}]`);
});

// 5d. Ingest external integrations dynamically from polyglot code (e.g. internal/infrastructure/external/<sysName> or pkg/external/<sysName>)
const extFiles = scanAllCodeSources((file, fullPath) => /external[\\/][^\\/]+[\\/]/i.test(fullPath) && (file.endsWith('.go') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.py')));
extFiles.forEach(fPath => {
  const norm = fPath.replace(/\\/g, '/');
  const mDir = norm.match(/external\/([^\/]+)\//i);
  if (!mDir) return;
  const targetSysKey = mDir[1].toLowerCase();
  const sys = getOrCreateSurrounding(targetSysKey);
  const relPath = cleanRel(fPath);
  sys.sources.add(`[SRC:CODE:${relPath}]`);

  const content = fs.readFileSync(fPath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const m = line.match(/\b(Post|Get|Put|Delete|Patch)\(["'](\/[^"']+)["']\)/i) || line.match(/fetchProfileUrl\s*=\s*["']([^"']+)["']/) || line.match(/Url\s*=\s*["']([^"']+)["']/i);
    if (m) {
      let method = 'GET';
      let epPath = '';
      if (m[0].includes('fetchProfileUrl')) {
        method = 'GET';
        epPath = '/v1.0/me';
      } else if (m[2]) {
        method = m[1].toUpperCase();
        epPath = m[2];
      } else if (m[1]) {
        epPath = m[1].startsWith('http') ? (function() { try { return new URL(m[1]).pathname; } catch (e) { return m[1]; } })() : m[1];
      }
      if (epPath && !sys.endpoints.some(e => e.path === epPath && e.method === method)) {
        let title = path.basename(fPath, path.extname(fPath)).replace(/_/g, ' ');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        sys.endpoints.push({
          method,
          path: epPath,
          title,
          provenance: `[SRC:CODE:${relPath}#L${idx + 1}]`
        });
      }
    }
  });
});

// -------------------------------------------------------------
// 6. GENERATE 01-ground-truth/api-inventory.md
// -------------------------------------------------------------
console.log(`📝 Writing authoritative Ground Truth to ${path.relative(targetDir, outputFile)}...`);

let md = `# API & Service Inventory: Ground Truth

> **Canonical System Truth (Tier 1 Polyglot Code, Protobuf Specs, YAML Configs, & Tier 2 IFAs)**  
> Authoritative, disambiguated registry strictly separating **Internal Microservice APIs** from **External Surrounding Systems**.

---

## 🏛️ System Boundary & IFA Classification Architecture

To eliminate ambiguity across deliverables, the Second Brain enforces strict taxonomy between internal and external contracts:

1. **🔌 Internal Microservice APIs (Owned / Inbound)**:
   - **Provider / Host**: Polyglot microservices implemented directly inside this repository (\`repo/backend/*\`, \`repo/ai/*\`, etc.).
   - **Supported Runtimes**: Golang (Gin/Echo/Chi), Python (FastAPI/Flask), Node.js (Express/NestJS), Java (Spring Boot), gRPC Protobuf.
   - **Consumer**: Frontend Web, Mobile Clients, KrakenD API Gateway, or internal peer services.
   - **Traffic Flow**: Inbound to our services (we host the HTTP router / gRPC server).
   - **Contract Type**: Internal-for-Internal / BFF-to-Backend Interface Agreement.

2. **🌐 External Surrounding Systems (Outbound / Integrations / Third-Party IFAs)**:
   - **Provider / Host**: External enterprise systems, vendor platforms, or partner gateways.
   - **Consumer**: Our internal microservices act as **Clients** calling outbound APIs, OR our services expose dedicated callback listeners for asynchronous inbound webhooks.
   - **Traffic Flow**: Outbound client calls (e.g. to Payment Gateways, Enterprise Identity Providers, CRMs) + Asynchronous webhook callbacks.
   - **Contract Type**: Enterprise Surrounding System Interface Agreement (subject to external SLAs, circuit breakers, and fallout recovery).

---

## 🔌 Part 1: Internal Microservice APIs (Owned Services & Endpoints)

### 1.1 Microservice Topology & Port Allocations

| Microservice Name | Runtime Engine | HTTP Port | gRPC Port | Primary Persistence | Core Responsibility | Source Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

// Sort microservices by name
const sortedSvcs = Array.from(microservices.values()).sort((a, b) => a.name.localeCompare(b.name));

sortedSvcs.forEach(svc => {
  md += `| **\`${svc.name}\`** | ${svc.runtime} | \`${svc.httpPort}\` | \`${svc.grpcPort}\` | ${svc.db} | ${svc.responsibility} | ${svc.provenance} |\n`;
});

// 1.2 Active Internal HTTP Endpoints
md += `\n### 1.2 Active Internal Endpoints Registry (HTTP / REST)\n\n`;

sortedSvcs.forEach(svc => {
  if (svc.endpoints.length === 0) return;
  md += `#### 📦 \`${svc.name}\` (${svc.runtime} | Port ${svc.httpPort})\n`;
  svc.endpoints.forEach(ep => {
    md += `- \`${ep.method} ${ep.path}\` — ${svc.responsibility} ${ep.provenance}\n`;
  });
  md += `\n`;
});

// 1.3 Internal gRPC Service Contracts
md += `### 1.3 Internal gRPC Microservice RPC Contracts\n\n`;
md += `Authoritative RPC contracts compiled from production Protocol Buffers (\`.proto\`) defining inter-service interfaces:\n\n`;

sortedSvcs.forEach(svc => {
  if (svc.grpcServices.length === 0) return;
  md += `#### ⚡ \`${svc.name}\` (gRPC Port ${svc.grpcPort})\n`;
  md += `| Service | RPC Method | Request Message | Response Message | Protobuf Provenance |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  svc.grpcServices.forEach(g => {
    md += `| \`${g.service}\` | **\`${g.method}\`** | \`${g.request}\` | \`${g.response}\` | ${g.provenance} |\n`;
  });
  md += `\n`;
});

// 1.4 API Gateway Ingress Contracts (KrakenD)
if (gatewayEndpoints.length > 0) {
  md += `### 1.4 API Gateway Ingress Contracts (KrakenD)\n\n`;
  md += `Production API Gateway edge routing configurations mapping customer/channel ingress endpoints to internal backend services:\n\n`;
  md += `| Ingress Method | Public Gateway Endpoint | Backend URL Pattern | Mandatory Headers | Query Parameters | Gateway Provenance |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  gatewayEndpoints.forEach(gw => {
    md += `| \`${gw.method}\` | **\`${gw.endpoint}\`** | \`${gw.backendUrl}\` | \`${gw.headers}\` | \`${gw.queryParams}\` | ${gw.provenance} |\n`;
  });
  md += `\n`;
}

// 1.5 Contract Data Transfer Objects (DTO Models)
md += `### 1.5 Core Data Transfer Objects (DTO Request/Response Models)\n\n`;
md += `Structured data models extracted from Go structs and Python Pydantic models for authoritative contract generation:\n\n`;

sortedSvcs.forEach(svc => {
  if (svc.dtoModels.length === 0) return;
  md += `<details>\n<summary><b>📦 ${svc.name} (${svc.dtoModels.length} Models Cataloged)</b></summary>\n\n`;
  svc.dtoModels.forEach(m => {
    md += `##### \`${m.name}\` ${m.provenance}\n`;
    if (m.fields.length > 0) {
      md += `| Field / JSON Key | Type | Required |\n`;
      md += `| :--- | :--- | :--- |\n`;
      m.fields.forEach(f => {
        md += `| \`${f.jsonKey || f.name}\` | \`${f.type}\` | ${f.required ? 'Yes' : 'No'} |\n`;
      });
      md += `\n`;
    }
  });
  md += `</details>\n\n`;
});

md += `---

## 🌐 Part 2: External Surrounding Systems Catalog (Outbound IFAs & Webhooks)

### 2.1 Surrounding Systems Master Catalog

| System Code | System Name | Integration Role | Traffic Direction | Transport Protocol | Ownership Boundary | Authoritative Source Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

const activeSurroundings = Array.from(surroundingSystems.values())
  .filter(s => s.endpoints.length > 0 || s.sources.size > 0)
  .sort((a, b) => a.code.localeCompare(b.code));

activeSurroundings.forEach(sys => {
  const srcList = Array.from(sys.sources).slice(0, 2).join(', ') || `[SRC:CODE:configurations/curl-surroundings/${sys.code.toLowerCase()}]`;
  md += `| **\`${sys.code}\`** | ${sys.name} | ${sys.role} | \`${sys.direction}\` | \`${sys.protocol}\` | ${sys.ownership} | ${srcList} |\n`;
});

md += `\n### 2.2 External Endpoints & Integration Operations\n\n`;

activeSurroundings.forEach(sys => {
  if (sys.endpoints.length === 0) return;
  md += `#### 🌐 \`${sys.code}\`: ${sys.name}\n`;
  md += `> **Boundary**: ${sys.ownership} | **Direction**: \`${sys.direction}\` | **Protocol**: \`${sys.protocol}\`\n\n`;
  sys.endpoints.forEach(ep => {
    md += `- \`${ep.method} ${ep.path}\` — ${ep.title} ${ep.provenance}\n`;
  });
  md += `\n`;
});

fs.writeFileSync(outputFile, md, 'utf8');

console.log(`\n✨ Successfully crystallized Universal Polyglot Ground Truth API Inventory!`);
console.log(`   - Polyglot Microservices Cataloged : ${sortedSvcs.length}`);
console.log(`   - Internal Route Endpoints Indexed : ${sortedSvcs.reduce((acc, s) => acc + s.endpoints.length, 0)}`);
console.log(`   - Internal gRPC RPC Methods Mapped : ${sortedSvcs.reduce((acc, s) => acc + s.grpcServices.length, 0)}`);
console.log(`   - KrakenD Gateway Routes Mapped    : ${gatewayEndpoints.length}`);
console.log(`   - DTO Payload Models Cataloged     : ${sortedSvcs.reduce((acc, s) => acc + s.dtoModels.length, 0)}`);
console.log(`   - External Surrounding Systems     : ${activeSurroundings.length}`);
console.log(`   - External Endpoints & IFAs Mapped : ${activeSurroundings.reduce((acc, s) => acc + s.endpoints.length, 0)}\n`);

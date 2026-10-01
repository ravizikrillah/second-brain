/**
 * Second Brain Source Resolver
 * 
 * Dynamically resolves data source locations (code repositories, DDL schemas,
 * PRDs/BRDs, MoMs, Figma specs) supporting:
 * 1. CLI flags (--code, --ddl, --brd, --path)
 * 2. Configuration file (second-brain.json / .brainrc.json)
 * 3. Default fallback directory (00-raw-inputs/*) including symlinks
 * 
 * Prevents repository bloat by allowing external BE/FE repositories to remain
 * in their native locations without duplicating them into Second Brain's git index.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_RAW_MAP = {
  code: path.join('00-raw-inputs', 'existing-code'),
  ddl: path.join('00-raw-inputs', 'db'),
  brd: path.join('00-raw-inputs', 'brd'),
  mom: path.join('00-raw-inputs', 'mom'),
  figma: path.join('00-raw-inputs', 'figma')
};

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  'vendor',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  'tmp',
  'temp',
  '.cache',
  'bin',
  'obj'
]);

/**
 * Expand environment variables ($VAR or ${VAR}) in strings
 */
function expandEnv(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\$(?:\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g, (_, k1, k2) => {
    const key = k1 || k2;
    return process.env[key] !== undefined ? process.env[key] : '';
  });
}

/**
 * Expand tilde (~) and environment variables in file paths
 */
function expandHome(filepath) {
  if (!filepath) return filepath;
  let p = expandEnv(filepath);
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

/**
 * Sanitize absolute machine filepaths into portable relative provenance tags.
 * Strips host-specific prefixes (/Users/ravi, /home/budi, C:\Users\...) and
 * normalizes to [service_name]/internal/path...
 */
function sanitizeProvenancePath(filePath, options = {}) {
  if (!filePath) return '';
  let p = filePath.replace(/\\/g, '/');

  // Strip line numbers / column if present temporarily
  let suffix = '';
  const lineMatch = p.match(/(#L\d+(?:-L\d+)?(?::[a-zA-Z0-9_.]*)?)$/);
  if (lineMatch) {
    suffix = lineMatch[1];
    p = p.slice(0, -suffix.length);
  }

  // If within targetDir/workspace
  const targetDir = (options.targetDir || process.cwd()).replace(/\\/g, '/');
  if (p.startsWith(targetDir + '/')) {
    p = p.slice(targetDir.length + 1);
  }

  // If specific source root provided, relativize to service name
  if (options.sourceRoot) {
    const root = options.sourceRoot.replace(/\\/g, '/');
    if (p.startsWith(root + '/')) {
      const sub = p.slice(root.length + 1);
      const base = options.sourceName || path.basename(root);
      p = `${base}/${sub}`;
    }
  }

  // Strip absolute user home directories from any OS (Mac, Linux, Windows)
  p = p.replace(/^\/(?:Users|home)\/[^/]+\/(?:[^/]+\/)*(?:Source Code BE|Source Code FE|repos?|code|projects?|workspace)\//i, '');
  p = p.replace(/^[a-zA-Z]:\/(?:Users|Users and Settings)\/[^/]+\/(?:[^/]+\/)*(?:Source Code BE|Source Code FE|repos?|code|projects?|workspace)\//i, '');
  p = p.replace(/^\/(?:Users|home)\/[^/]+\//, '');
  p = p.replace(/^[a-zA-Z]:\/Users\/[^/]+\//, '');

  // Strip standard raw-inputs prefixes if present
  p = p.replace(/^00-raw-inputs\/existing-code\/(?:Source Code BE\/|Source Code FE\/)?/, '');
  p = p.replace(/^00-raw-inputs\/db\//, '');
  p = p.replace(/^00-raw-inputs\/brd\//, '');
  p = p.replace(/^00-raw-inputs\/mom\//, '');
  p = p.replace(/^00-raw-inputs\/figma\//, '');

  return p + suffix;
}

/**
 * Parse CLI arguments for source flags
 */
function parseCliArgs() {
  const args = process.argv.slice(2);
  const result = {
    code: [],
    ddl: [],
    brd: [],
    genericPath: null,
    configFile: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--code=')) {
      result.code.push(arg.split('=')[1]);
    } else if ((arg === '--code' || arg === '-c') && i + 1 < args.length) {
      result.code.push(args[++i]);
    } else if (arg.startsWith('--ddl=')) {
      result.ddl.push(arg.split('=')[1]);
    } else if ((arg === '--ddl' || arg === '-d') && i + 1 < args.length) {
      result.ddl.push(args[++i]);
    } else if (arg.startsWith('--brd=')) {
      result.brd.push(arg.split('=')[1]);
    } else if ((arg === '--brd' || arg === '-b') && i + 1 < args.length) {
      result.brd.push(args[++i]);
    } else if (arg.startsWith('--path=')) {
      result.genericPath = arg.split('=')[1];
    } else if ((arg === '--path' || arg === '-p') && i + 1 < args.length) {
      result.genericPath = args[++i];
    } else if (arg.startsWith('--config=')) {
      result.configFile = arg.split('=')[1];
    } else if (arg === '--config' && i + 1 < args.length) {
      result.configFile = args[++i];
    }
  }

  return result;
}

/**
 * Load and parse second-brain.json or .brainrc.json.
 * Supports second-brain.local.json for local machine overrides (git-ignored),
 * allowing multi-user team collaboration without path conflicts.
 */
function loadConfig(targetDir = process.cwd(), customConfigPath = null) {
  if (customConfigPath) {
    const resolved = path.resolve(targetDir, expandHome(customConfigPath));
    if (fs.existsSync(resolved)) {
      try {
        const raw = fs.readFileSync(resolved, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          configPath: resolved,
          name: parsed.name || 'Second Brain Workspace',
          sources: parsed.sources || {}
        };
      } catch (err) {
        console.warn(`⚠️  Warning: Failed to parse configuration file at ${resolved}: ${err.message}`);
      }
    }
    return { configPath: null, name: null, sources: {} };
  }

  // Check for local overrides first (second-brain.local.json)
  const localCandidates = [
    path.join(targetDir, 'second-brain.local.json'),
    path.join(targetDir, '.brainrc.local.json'),
    path.join(targetDir, '.brainrc.local')
  ];

  // Shared team configuration (second-brain.json)
  const sharedCandidates = [
    path.join(targetDir, 'second-brain.json'),
    path.join(targetDir, '.brainrc.json'),
    path.join(targetDir, '.brainrc')
  ];

  let sharedConfig = { configPath: null, name: null, sources: {} };
  for (const candidate of sharedCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        sharedConfig = {
          configPath: candidate,
          name: parsed.name || 'Second Brain Workspace',
          sources: parsed.sources || {}
        };
        break;
      } catch (err) {
        console.warn(`⚠️  Warning: Failed to parse configuration file at ${candidate}: ${err.message}`);
      }
    }
  }

  // Merge with local machine override if present
  for (const localCandidate of localCandidates) {
    if (fs.existsSync(localCandidate)) {
      try {
        const raw = fs.readFileSync(localCandidate, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          configPath: localCandidate,
          sharedConfigPath: sharedConfig.configPath,
          name: parsed.name || sharedConfig.name || 'Second Brain Workspace (Local Machine Override)',
          sources: {
            ...sharedConfig.sources,
            ...(parsed.sources || {})
          },
          isLocalOverride: true
        };
      } catch (err) {
        console.warn(`⚠️  Warning: Failed to parse local override at ${localCandidate}: ${err.message}`);
      }
    }
  }

  return sharedConfig;
}

/**
 * Resolves source directories for a specific type ('code', 'ddl', 'brd', 'mom', 'figma').
 * Priority:
 * 1. CLI arguments
 * 2. second-brain.json configuration
 * 3. Default fallback in 00-raw-inputs/
 * 
 * Returns an array of objects:
 * [{ path: '/abs/path', relativePath: '...', name: '...', exists: true, isExternal: true/false }]
 */
function resolveSources(type, options = {}) {
  const targetDir = options.targetDir || process.cwd();
  const cliArgs = parseCliArgs();
  const config = loadConfig(targetDir, cliArgs.configFile);
  const rawList = [];

  // 1. Check CLI args
  if (cliArgs[type] && cliArgs[type].length > 0) {
    rawList.push(...cliArgs[type].map(p => ({ raw: p, origin: 'cli' })));
  } else if (cliArgs.genericPath && (type === 'code' || type === 'ddl')) {
    rawList.push({ raw: cliArgs.genericPath, origin: 'cli' });
  }

  // 2. Check config file
  if (config.sources && config.sources[type]) {
    const cfg = config.sources[type];
    if (Array.isArray(cfg)) {
      cfg.forEach(entry => {
        if (typeof entry === 'string') {
          rawList.push({ raw: entry, origin: 'config' });
        } else if (entry && entry.path) {
          rawList.push({ raw: entry.path, name: entry.name, origin: 'config' });
        }
      });
    } else if (typeof cfg === 'string') {
      rawList.push({ raw: cfg, origin: 'config' });
    }
  }

  // 3. Fallback to default raw inputs directory
  const defaultRel = DEFAULT_RAW_MAP[type] || path.join('00-raw-inputs', type);
  const defaultAbs = path.join(targetDir, defaultRel);

  if (rawList.length === 0) {
    rawList.push({ raw: defaultRel, origin: 'default' });
  }

  // Normalize, resolve, deduplicate
  const seenPaths = new Set();
  const resolved = [];

  for (const item of rawList) {
    const expanded = expandHome(item.raw);
    const absPath = path.isAbsolute(expanded)
      ? path.normalize(expanded)
      : path.normalize(path.join(targetDir, expanded));

    if (seenPaths.has(absPath)) continue;
    seenPaths.add(absPath);

    const exists = fs.existsSync(absPath);
    let isDirectory = false;
    if (exists) {
      try {
        isDirectory = fs.statSync(absPath).isDirectory();
      } catch (e) {}
    }

    const relPath = path.relative(targetDir, absPath);
    const isExternal = relPath.startsWith('..') || path.isAbsolute(item.raw);
    const defaultName = item.name || path.basename(absPath);

    resolved.push({
      path: absPath,
      relativePath: relPath,
      name: defaultName,
      exists,
      isDirectory,
      isExternal,
      origin: item.origin
    });
  }

  return {
    type,
    configPath: config.configPath,
    sources: resolved
  };
}

/**
 * High-performance file finder that skips heavy non-code directories (node_modules, .git, etc.)
 * Automatically follows directory symlinks.
 */
function findFiles(dir, filterFn, options = {}) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const maxDepth = options.maxDepth || 20;
  const currentDepth = options.currentDepth || 0;
  if (currentDepth > maxDepth) return results;

  let list = [];
  try {
    list = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }

  for (const file of list) {
    // Skip heavy dependency, git, or build folders
    if (IGNORED_DIRS.has(file)) continue;

    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath); // follows symlinks
      if (stat.isDirectory()) {
        const subResults = findFiles(fullPath, filterFn, {
          ...options,
          currentDepth: currentDepth + 1
        });
        results.push(...subResults);
      } else if (!filterFn || filterFn(file, fullPath)) {
        results.push(fullPath);
      }
    } catch (e) {}
  }

  return results;
}

module.exports = {
  loadConfig,
  parseCliArgs,
  resolveSources,
  findFiles,
  sanitizeProvenancePath,
  IGNORED_DIRS
};

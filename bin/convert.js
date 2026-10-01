#!/usr/bin/env node

/**
 * Second Brain Universal Document & Binary Converter (MarkItDown Integration)
 * 
 * Automatically converts binary and office source documents (PDF, Word, Excel, PPTX)
 * in 00-raw-inputs/brd/ into clean Markdown text prior to Ground Truth ingestion.
 * 
 * Powered by Microsoft MarkItDown (github.com/microsoft/markitdown).
 * Converted files are stored in `00-raw-inputs/brd/_converted/` as derived read-aids.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveSources, findFiles } = require('./source-resolver');

const targetDir = process.cwd();
const args = process.argv.slice(2);
const isCheckOnly = args.includes('--check');
const isForce = args.includes('--force') || args.includes('-f');

const BINARY_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xlsm', '.xls', '.msg', '.epub'];

console.log(`\n📄 Second Brain Universal Document Converter (MarkItDown)\n`);

// 1. Resolve Python / MarkItDown runtime
function detectMarkItDown() {
  const customPython = process.env.BRAIN_MARKITDOWN_PYTHON;
  const candidates = [
    customPython,
    path.join(targetDir, '.venv', 'bin', 'python3'),
    path.join(targetDir, '.venv', 'bin', 'python'),
    'python3',
    'python'
  ].filter(Boolean);

  for (const py of candidates) {
    try {
      const check = spawnSync(py, ['-c', 'import markitdown; print("ok")'], { encoding: 'utf8' });
      if (check.status === 0 && check.stdout.trim() === 'ok') {
        return { type: 'python', bin: py };
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // Check if markitdown CLI is on PATH directly
  try {
    const cliCheck = spawnSync('markitdown', ['--version'], { encoding: 'utf8' });
    if (cliCheck.status === 0) {
      return { type: 'cli', bin: 'markitdown' };
    }
  } catch (e) {
    // Not on PATH
  }

  return null;
}

const runtime = detectMarkItDown();

if (isCheckOnly) {
  if (runtime) {
    console.log(`✅ MarkItDown detected via: ${runtime.type} (${runtime.bin})\n`);
    process.exit(0);
  } else {
    console.log(`⚠️  MarkItDown not found on PATH or virtualenv.\n`);
    console.log(`💡 Install via: pip install 'markitdown[all]'\n`);
    process.exit(1);
  }
}

// 2. Discover binary files across brd sources
const brdResolution = resolveSources('brd', { targetDir });
const validSources = brdResolution.sources.filter(s => s.exists);
const binaryFiles = [];

validSources.forEach(src => {
  if (src.isDirectory) {
    const files = findFiles(src.path, file => {
      const ext = path.extname(file).toLowerCase();
      return BINARY_EXTENSIONS.includes(ext);
    });
    files.forEach(f => {
      // Skip if inside an already converted folder
      if (!f.includes(`${path.sep}_converted${path.sep}`)) {
        binaryFiles.push({ absPath: f, sourceRoot: src.path });
      }
    });
  } else {
    const ext = path.extname(src.path).toLowerCase();
    if (BINARY_EXTENSIONS.includes(ext)) {
      binaryFiles.push({ absPath: src.path, sourceRoot: path.dirname(src.path) });
    }
  }
});

if (binaryFiles.length === 0) {
  console.log(`✨ No binary documents (.pdf, .docx, .xlsx, .pptx) detected requiring conversion.`);
  console.log(`   (All inputs are already plain text or Markdown)\n`);
  process.exit(0);
}

console.log(`🔍 Detected ${binaryFiles.length} binary document(s) in source folders:`);
binaryFiles.forEach(b => {
  console.log(`   • ${path.relative(targetDir, b.absPath)}`);
});
console.log('');

if (!runtime) {
  console.log(`⚠️  MarkItDown runtime is not installed.`);
  console.log(`   Binary files will not be converted to Markdown during this run.`);
  console.log(`\n💡 To enable automatic conversion for PDF, Word, and Excel files:`);
  console.log(`   1. Install MarkItDown: pip install 'markitdown[all]'`);
  console.log(`   2. Or set interpreter: export BRAIN_MARKITDOWN_PYTHON=/path/to/venv/bin/python\n`);
  process.exit(0); // Exit gracefully so ingestion pipeline proceeds
}

// 3. Convert files
let convertedCount = 0;
binaryFiles.forEach(b => {
  const baseName = path.basename(b.absPath, path.extname(b.absPath));
  const convertedDir = path.join(b.sourceRoot, '_converted');
  const targetMd = path.join(convertedDir, `${baseName}.md`);

  if (!fs.existsSync(convertedDir)) {
    fs.mkdirSync(convertedDir, { recursive: true });
    // Add .gitignore inside _converted
    const gitignorePath = path.join(convertedDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '# Derived converted markdown\n*\n!.gitignore\n');
    }
  }

  // Check timestamp / force
  if (!isForce && fs.existsSync(targetMd)) {
    const srcMtime = fs.statSync(b.absPath).mtime;
    const destMtime = fs.statSync(targetMd).mtime;
    if (destMtime >= srcMtime) {
      console.log(`⏩ [UP TO DATE] ${path.relative(targetDir, targetMd)}`);
      return;
    }
  }

  console.log(`⚙️  Converting: ${path.basename(b.absPath)} -> ${path.relative(targetDir, targetMd)}...`);
  
  let result;
  if (runtime.type === 'python') {
    const pythonCode = `
import sys
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert(sys.argv[1])
content = getattr(result, "markdown", None) or getattr(result, "text_content", "")
with open(sys.argv[2], "w", encoding="utf-8") as f:
    f.write(content)
`;
    result = spawnSync(runtime.bin, ['-c', pythonCode, b.absPath, targetMd], { encoding: 'utf8' });
  } else {
    result = spawnSync(runtime.bin, [b.absPath, '-o', targetMd], { encoding: 'utf8' });
  }

  if (result.status === 0 && fs.existsSync(targetMd)) {
    console.log(`   ✅ Converted successfully (${(fs.statSync(targetMd).size / 1024).toFixed(1)} KB)`);
    convertedCount++;
  } else {
    console.log(`   ❌ Conversion failed: ${result.stderr || result.stdout || 'Unknown error'}`);
  }
});

console.log(`\n🎉 Conversion pass complete (${convertedCount} file(s) converted).\n`);

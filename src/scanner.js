const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '__pycache__', 'vendor', '.next', 'target', '.venv', 'venv']);
const SKIP_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.mp3', '.mp4', '.zip', '.tar', '.gz', '.lock', '.bin', '.exe', '.dll', '.so', '.dylib']);

function cloneRepo(url) {
  const tmpDir = path.join(os.tmpdir(), `repocraft-${Date.now()}`);
  execSync(`git clone --depth 1 "${url}" "${tmpDir}" 2>/dev/null`, { stdio: 'pipe', timeout: 120000 });
  return tmpDir;
}

function countLines(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n').length;
  } catch { return 0; }
}

function getReadme(dir) {
  for (const name of ['README.md', 'readme.md', 'README.rst', 'README.txt', 'README']) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      return content.slice(0, 8000);
    }
  }
  return '';
}

function getStructure(dir, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let result = '';
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const indent = '  '.repeat(depth);
    if (entry.isDirectory()) {
      result += `${indent}${entry.name}/\n`;
      result += getStructure(path.join(dir, entry.name), depth + 1, maxDepth);
    } else {
      result += `${indent}${entry.name}\n`;
    }
  }
  return result;
}

function scanFiles(dir, rootDir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      scanFiles(fullPath, rootDir, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SKIP_EXTS.has(ext)) continue;
      const loc = countLines(fullPath);
      files.push({ path: relPath, ext, loc });
    }
  }
  return files;
}

function getSampleFiles(dir, files) {
  // Pick key files for LLM analysis: entry points, configs, main modules
  const priorities = [
    /^(src\/)?index\.[jt]sx?$/,
    /^(src\/)?main\.[jt]sx?$/,
    /^(src\/)?app\.[jt]sx?$/,
    /^(src\/)?cli\.[jt]sx?$/,
    /^(src\/)?server\.[jt]sx?$/,
    /package\.json$/,
    /pyproject\.toml$/,
    /Cargo\.toml$/,
    /^(src\/)?lib\.[jt]sx?$/,
  ];

  const samples = [];
  for (const pattern of priorities) {
    const match = files.find(f => pattern.test(f.path));
    if (match) {
      const fullPath = path.join(dir, match.path);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8').slice(0, 3000);
        samples.push({ path: match.path, content });
      } catch {}
    }
    if (samples.length >= 5) break;
  }

  // Also grab top-level source dirs' index files
  const srcDirs = files
    .filter(f => f.path.split('/').length >= 2)
    .map(f => f.path.split('/').slice(0, 2).join('/'))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

  for (const dir2 of srcDirs) {
    const indexFile = files.find(f => f.path.startsWith(dir2) && /index\.[jt]sx?$/.test(f.path));
    if (indexFile && samples.length < 10) {
      const fullPath = path.join(dir, indexFile.path);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8').slice(0, 2000);
        samples.push({ path: indexFile.path, content });
      } catch {}
    }
  }

  return samples;
}

function scanRepo(dir) {
  const readme = getReadme(dir);
  const structure = getStructure(dir);
  const files = scanFiles(dir, dir);
  const samples = getSampleFiles(dir, files);
  const totalLoc = files.reduce((s, f) => s + f.loc, 0);
  const totalFiles = files.length;

  return { readme, structure, files, samples, totalLoc, totalFiles };
}

function cleanupRepo(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

module.exports = { cloneRepo, scanRepo, cleanupRepo };

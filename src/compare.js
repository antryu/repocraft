const fs = require('fs');
const path = require('path');
const { cloneRepo, scanRepo, cleanupRepo } = require('./scanner');
const { extractFeatures } = require('./extractor');
const { generateCompareMatrix } = require('./viz');

function loadCatalog() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'catalog.json'), 'utf-8'));
}

function listCategories() {
  const catalog = loadCatalog();
  console.log('\n🔧 repocraft — Categories\n');
  for (const cat of catalog.categories) {
    console.log(`  ${cat.name.padEnd(22)} ${cat.label.padEnd(20)} ${cat.repos.length} repos`);
  }
  console.log('');
}

async function analyzeOneRepo(repo) {
  let repoDir;
  try {
    process.stdout.write(`  ${repo.name}...`);
    repoDir = cloneRepo(repo.url);
    const repoData = scanRepo(repoDir);
    const features = await extractFeatures(repoData);
    console.log(` ${features.length} features`);
    return {
      name: repo.name,
      repo: repo.url,
      totalFiles: repoData.totalFiles,
      totalLoc: repoData.totalLoc,
      features,
    };
  } catch (err) {
    console.log(` ❌ ${err.message}`);
    return { name: repo.name, repo: repo.url, totalFiles: 0, totalLoc: 0, features: [] };
  } finally {
    if (repoDir) cleanupRepo(repoDir);
  }
}

async function compareCategory(categoryName, opts = {}) {
  const catalog = loadCatalog();
  const cat = catalog.categories.find(c => c.name === categoryName);
  if (!cat) {
    console.error(`❌ Category "${categoryName}" not found. Use: repocraft compare --list`);
    process.exit(1);
  }

  console.log(`\n🔧 repocraft compare — ${cat.label} (${cat.repos.length} repos)\n`);

  const results = [];
  for (const repo of cat.repos) {
    const result = await analyzeOneRepo(repo);
    results.push(result);
  }

  if (opts.web) {
    generateCompareMatrix(cat.label, results);
  } else {
    printCompareTable(cat.label, results);
  }
}

function printCompareTable(label, repos) {
  const allFeatures = new Set();
  repos.forEach(r => r.features.forEach(f => allFeatures.add(f.name)));
  const featureList = [...allFeatures].sort();

  const nameW = Math.max(25, ...featureList.map(f => f.length + 2));
  const repoW = 12;

  console.log(`\n  ${'Feature'.padEnd(nameW)}${repos.map(r => r.name.slice(0, repoW - 1).padEnd(repoW)).join('')}`);
  console.log('  ' + '─'.repeat(nameW + repos.length * repoW));

  for (const fname of featureList) {
    let row = `  ${fname.padEnd(nameW)}`;
    for (const r of repos) {
      const f = r.features.find(x => x.name === fname);
      if (f) {
        const icon = f.maturity >= 7 ? '✅' : f.maturity >= 4 ? '⚠️' : '🔴';
        row += `${icon} ${f.maturity}/10`.padEnd(repoW);
      } else {
        row += '  —'.padEnd(repoW);
      }
    }
    console.log(row);
  }
}

module.exports = { compareCategory, listCategories };

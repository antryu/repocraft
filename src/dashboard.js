const fs = require('fs');
const path = require('path');
const { cloneRepo, scanRepo, cleanupRepo } = require('./scanner');
const { extractFeatures } = require('./extractor');
const { generateDashboardHTML } = require('./viz');

function loadCatalog() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'catalog.json'), 'utf-8'));
}

async function generateDashboard() {
  const catalog = loadCatalog();
  console.log(`\n🔧 repocraft dashboard — ${catalog.categories.length} categories\n`);

  const allResults = [];

  for (const cat of catalog.categories) {
    console.log(`📂 ${cat.label} (${cat.repos.length} repos)`);
    const repos = [];

    for (const repo of cat.repos) {
      let repoDir;
      try {
        process.stdout.write(`  ${repo.name}...`);
        repoDir = cloneRepo(repo.url);
        const repoData = scanRepo(repoDir);
        const features = await extractFeatures(repoData);
        console.log(` ${features.length} features`);
        repos.push({
          name: repo.name,
          repo: repo.url,
          totalFiles: repoData.totalFiles,
          totalLoc: repoData.totalLoc,
          features,
        });
      } catch (err) {
        console.log(` ❌ ${err.message}`);
        repos.push({ name: repo.name, repo: repo.url, totalFiles: 0, totalLoc: 0, features: [] });
      } finally {
        if (repoDir) cleanupRepo(repoDir);
      }
    }

    allResults.push({ name: cat.name, label: cat.label, repos });
  }

  // Cache results for craft mode
  const cachePath = path.join(__dirname, '..', '.omc', 'analysis-cache.json');
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Analysis cached: .omc/analysis-cache.json`);

  generateDashboardHTML(allResults);
}

module.exports = { generateDashboard };

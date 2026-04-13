const fs = require('fs');
const path = require('path');
const { generateCraftHTML } = require('./viz');

function loadCatalog() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'catalog.json'), 'utf-8'));
}

// Load cached analysis results if available
function loadCachedResults() {
  const cachePath = path.join(__dirname, '..', '.omc', 'analysis-cache.json');
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }
  return null;
}

async function startCraft(opts = {}) {
  const cached = loadCachedResults();

  if (!cached) {
    console.log('❌ No cached analysis data. Run `repocraft dashboard` first to analyze all repos.');
    console.log('   Results will be cached for craft mode.');
    process.exit(1);
  }

  if (opts.web) {
    generateCraftHTML(cached);
  } else {
    console.log('\n🔧 repocraft craft');
    console.log('   Use --web for interactive feature selector\n');

    let totalFeatures = 0;
    cached.forEach(cat => cat.repos.forEach(r => totalFeatures += r.features.length));

    console.log(`   ${cached.length} categories, ${totalFeatures} total features available`);
    console.log('   Run: repocraft craft --web');
  }
}

module.exports = { startCraft };

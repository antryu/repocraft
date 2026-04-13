const { cloneRepo, scanRepo, cleanupRepo } = require('./scanner');
const { extractFeatures } = require('./extractor');
const { generateFeatureMap } = require('./viz');
const path = require('path');
const fs = require('fs');

async function analyzeRepo(target, opts = {}) {
  let repoDir;
  let cloned = false;

  if (target.startsWith('http') || target.startsWith('git@')) {
    process.stdout.write(`Cloning ${target}...`);
    repoDir = cloneRepo(target);
    cloned = true;
    console.log(' done');
  } else {
    repoDir = path.resolve(target);
    if (!fs.existsSync(repoDir)) throw new Error(`Directory not found: ${repoDir}`);
  }

  try {
    process.stdout.write('Scanning...');
    const repoData = scanRepo(repoDir);
    console.log(` ${repoData.totalFiles} files, ${repoData.totalLoc.toLocaleString()} LOC`);

    process.stdout.write('Extracting features (Claude)...');
    const features = await extractFeatures(repoData);
    console.log(` ${features.length} features found`);

    const result = {
      repo: target,
      totalFiles: repoData.totalFiles,
      totalLoc: repoData.totalLoc,
      features,
    };

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (opts.web) {
      generateFeatureMap(result);
    } else {
      printTable(result);
    }

    return result;
  } finally {
    if (cloned) cleanupRepo(repoDir);
  }
}

function printTable(result) {
  console.log(`\n🔧 repocraft — ${result.repo}`);
  console.log(`   ${result.totalFiles} files | ${result.totalLoc.toLocaleString()} LOC | ${result.features.length} features\n`);

  const nameW = Math.max(25, ...result.features.map(f => f.name.length + 2));
  const header = '  ' + 'Feature'.padEnd(nameW) + 'Category'.padEnd(16) + 'Maturity'.padStart(10) + '  LOC'.padStart(8);
  console.log(header);
  console.log('  ' + '─'.repeat(header.length - 2));

  const maturityBar = (m) => {
    if (m >= 8) return '🟢';
    if (m >= 5) return '🟡';
    return '🔴';
  };

  for (const f of result.features.sort((a, b) => b.maturity - a.maturity)) {
    console.log(
      '  ' + f.name.padEnd(nameW) +
      f.category.padEnd(16) +
      `${maturityBar(f.maturity)} ${f.maturity}/10`.padStart(10) +
      String(f.loc_estimate).padStart(8)
    );
  }
}

module.exports = { analyzeRepo };

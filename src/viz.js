const fs = require('fs');

const CATEGORY_COLORS = {
  auth: '#e74c3c', messaging: '#3498db', api: '#2ecc71', ui: '#9b59b6',
  storage: '#e67e22', 'ai-model': '#1abc9c', 'tool-execution': '#f39c12',
  memory: '#d35400', scheduling: '#8e44ad', deployment: '#2980b9',
  testing: '#95a5a6', docs: '#bdc3c7', config: '#7f8c8d', 'plugin-system': '#27ae60',
  monitoring: '#c0392b', search: '#16a085', media: '#2c3e50', other: '#636e72',
};

function maturityColor(m) {
  if (m >= 8) return '#27ae60';
  if (m >= 6) return '#f39c12';
  if (m >= 4) return '#e67e22';
  return '#e74c3c';
}

function generateFeatureMap(result) {
  const data = JSON.stringify(result);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft — ${result.repo}</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a1a; color: #e0e0e0; min-height: 100vh; }
  .header { padding: 32px 40px 16px; }
  .header h1 { font-size: 28px; font-weight: 800; }
  .header h1 span { opacity: 0.35; font-weight: 300; }
  .badges { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
  .badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #1e1e3f; border: 1px solid #3a3a6a; color: #8b8bff; }
  .badge-stat { background: #111; border: 1px solid #2a2a2a; color: #aaa; }
  .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 40px 40px; }
  .panel { background: #111125; border: 1px solid #1a1a35; border-radius: 14px; padding: 24px; }
  .panel h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 16px; }
  .panel-wide { grid-column: 1 / -1; }
  .chart { width: 100%; height: 500px; }
  .feature-grid { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 40px 40px; }
  .feature-box { padding: 16px 20px; border-radius: 10px; min-width: 180px; flex: 1; max-width: 300px; cursor: pointer; transition: all 0.2s; position: relative; }
  .feature-box:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .feature-box .name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .feature-box .desc { font-size: 12px; opacity: 0.6; margin-bottom: 8px; line-height: 1.4; }
  .feature-box .meta { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.5; }
  .feature-box .maturity-bar { height: 4px; border-radius: 2px; margin-top: 8px; }
  .feature-box .maturity-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
  @media (max-width: 900px) { .dashboard { grid-template-columns: 1fr; } }
</style></head><body>

<div class="header">
  <h1>🔧 repocraft <span>— ${result.repo}</span></h1>
  <div class="badges">
    <span class="badge">${result.features.length} features</span>
    <span class="badge-stat badge">${result.totalFiles.toLocaleString()} files</span>
    <span class="badge-stat badge">${result.totalLoc.toLocaleString()} LOC</span>
  </div>
</div>

<div class="feature-grid" id="featureGrid"></div>

<div class="dashboard">
  <div class="panel panel-wide">
    <h2>Feature Treemap</h2>
    <div id="treemap" class="chart"></div>
  </div>
  <div class="panel">
    <h2>Maturity Distribution</h2>
    <div id="maturity" class="chart"></div>
  </div>
  <div class="panel">
    <h2>Category Breakdown</h2>
    <div id="category" class="chart"></div>
  </div>
</div>

<script>
const data = ${data};
const catColors = ${JSON.stringify(CATEGORY_COLORS)};

function mColor(m) {
  if (m >= 8) return '#27ae60';
  if (m >= 6) return '#f39c12';
  if (m >= 4) return '#e67e22';
  return '#e74c3c';
}

// Feature boxes
const grid = document.getElementById('featureGrid');
data.features.sort((a,b) => b.loc_estimate - a.loc_estimate).forEach(f => {
  const el = document.createElement('div');
  el.className = 'feature-box';
  const bg = (catColors[f.category] || '#555') + '15';
  const border = mColor(f.maturity);
  el.style.background = bg;
  el.style.borderLeft = '4px solid ' + border;
  el.innerHTML = '<div class="name">' + f.name + '</div>'
    + '<div class="desc">' + f.description + '</div>'
    + '<div class="meta"><span>' + f.category + '</span><span>' + f.maturity + '/10</span><span>' + (f.loc_estimate||0).toLocaleString() + ' LOC</span></div>'
    + '<div class="maturity-bar" style="background:#1a1a35"><div class="maturity-fill" style="width:' + (f.maturity*10) + '%;background:' + border + '"></div></div>';
  grid.appendChild(el);
});

// Treemap
const treemap = echarts.init(document.getElementById('treemap'));
treemap.setOption({
  tooltip: { formatter: p => '<b>'+p.name+'</b><br/>LOC: '+(p.value||0).toLocaleString()+'<br/>Maturity: '+(p.data.maturity||'?')+'/10<br/>'+p.data.description },
  series: [{
    type: 'treemap', roam: false, nodeClick: false, width: '100%', height: '100%',
    label: { show: true, fontSize: 13, color: '#fff', fontWeight: 600 },
    data: data.features.map(f => ({
      name: f.name, value: f.loc_estimate || 100, maturity: f.maturity, description: f.description,
      itemStyle: { color: mColor(f.maturity), borderColor: '#0a0a1a', borderWidth: 2 }
    }))
  }]
});

// Maturity bar
const matChart = echarts.init(document.getElementById('maturity'));
const matBuckets = { '9-10 Production': 0, '7-8 Solid': 0, '4-6 Functional': 0, '1-3 Experimental': 0 };
data.features.forEach(f => {
  if (f.maturity >= 9) matBuckets['9-10 Production']++;
  else if (f.maturity >= 7) matBuckets['7-8 Solid']++;
  else if (f.maturity >= 4) matBuckets['4-6 Functional']++;
  else matBuckets['1-3 Experimental']++;
});
matChart.setOption({
  tooltip: {},
  xAxis: { type: 'category', data: Object.keys(matBuckets), axisLabel: { color: '#888', fontSize: 11 } },
  yAxis: { type: 'value', axisLabel: { color: '#555' }, splitLine: { lineStyle: { color: '#1a1a35' } } },
  series: [{ type: 'bar', data: Object.entries(matBuckets).map(([k,v]) => ({
    value: v, itemStyle: { color: k.includes('9-10') ? '#27ae60' : k.includes('7-8') ? '#2ecc71' : k.includes('4-6') ? '#f39c12' : '#e74c3c', borderRadius: [4,4,0,0] }
  })), barWidth: '50%' }]
});

// Category donut
const catChart = echarts.init(document.getElementById('category'));
const catAgg = {};
data.features.forEach(f => { catAgg[f.category] = (catAgg[f.category]||0) + 1; });
catChart.setOption({
  tooltip: { formatter: p => p.name + ': ' + p.value + ' features (' + p.percent + '%)' },
  series: [{ type: 'pie', radius: ['40%','70%'], center: ['50%','50%'],
    itemStyle: { borderRadius: 6, borderColor: '#111125', borderWidth: 3 },
    label: { color: '#bbb', fontSize: 12 },
    data: Object.entries(catAgg).map(([k,v]) => ({ name: k, value: v, itemStyle: { color: catColors[k]||'#555' } }))
  }]
});

window.addEventListener('resize', () => { treemap.resize(); matChart.resize(); catChart.resize(); });
</script></body></html>`;

  const outFile = 'repocraft-output.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Feature map saved: ${outFile}`);
  console.log(`   Open in browser: open ${outFile}`);
}

function generateCompareMatrix(category, repos) {
  // Collect all unique features across repos
  const allFeatures = new Set();
  repos.forEach(r => r.features.forEach(f => allFeatures.add(f.name)));
  const featureList = [...allFeatures].sort();

  const data = JSON.stringify({ category, repos: repos.map(r => ({
    name: r.name, repo: r.repo, totalLoc: r.totalLoc, totalFiles: r.totalFiles,
    features: r.features,
  })), featureList });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft compare — ${category}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a1a; color: #e0e0e0; padding: 32px 40px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  h1 span { opacity: 0.35; font-weight: 300; }
  .meta { color: #888; margin-bottom: 24px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #111125; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #555; border-bottom: 2px solid #1a1a35; position: sticky; top: 0; }
  td { padding: 8px 14px; border-bottom: 1px solid #0e0e20; font-size: 13px; }
  tr:hover td { background: #15153a; }
  .cell-yes { text-align: center; }
  .m-high { color: #27ae60; font-weight: 700; }
  .m-mid { color: #f39c12; font-weight: 600; }
  .m-low { color: #e74c3c; font-weight: 600; }
  .m-none { color: #333; }
  .feature-name { font-weight: 600; color: #ccc; min-width: 200px; }
  .repo-header { text-align: center; font-weight: 700; color: #8b8bff; min-width: 120px; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; }
  .summary-card { background: #111125; border: 1px solid #1a1a35; border-radius: 10px; padding: 16px 24px; flex: 1; }
  .summary-card .label { font-size: 11px; text-transform: uppercase; color: #555; letter-spacing: 1px; }
  .summary-card .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
</style></head><body>

<h1>🔧 repocraft <span>compare — ${category}</span></h1>
<p class="meta">Feature matrix across repos in this category</p>

<div class="summary" id="summary"></div>
<table id="matrix"></table>

<script>
const d = ${data};

// Summary cards
const sumEl = document.getElementById('summary');
sumEl.innerHTML = d.repos.map(r =>
  '<div class="summary-card"><div class="label">' + r.name + '</div><div class="value">' + r.features.length + ' features</div><div style="font-size:12px;color:#666;margin-top:4px">' + r.totalLoc.toLocaleString() + ' LOC · ' + r.totalFiles + ' files</div></div>'
).join('');

// Matrix table
const table = document.getElementById('matrix');
let html = '<thead><tr><th>Feature</th>';
d.repos.forEach(r => { html += '<th class="repo-header">' + r.name + '</th>'; });
html += '</tr></thead><tbody>';

d.featureList.forEach(fname => {
  html += '<tr><td class="feature-name">' + fname + '</td>';
  d.repos.forEach(r => {
    const f = r.features.find(x => x.name === fname);
    if (f) {
      const cls = f.maturity >= 7 ? 'm-high' : f.maturity >= 4 ? 'm-mid' : 'm-low';
      html += '<td class="cell-yes ' + cls + '">' + f.maturity + '/10</td>';
    } else {
      html += '<td class="cell-yes m-none">—</td>';
    }
  });
  html += '</tr>';
});

html += '</tbody>';
table.innerHTML = html;
</script></body></html>`;

  const outFile = 'repocraft-compare.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Comparison saved: ${outFile}`);
  console.log(`   Open in browser: open ${outFile}`);
}

function generateDashboardHTML(allResults) {
  const data = JSON.stringify(allResults);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a1a; color: #e0e0e0; }
  .header { padding: 32px 40px 16px; }
  .header h1 { font-size: 32px; font-weight: 800; }
  .header .meta { color: #888; margin-top: 6px; }
  .nav { padding: 0 40px; display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .nav a { padding: 6px 16px; border-radius: 20px; font-size: 13px; background: #1e1e3f; border: 1px solid #3a3a6a; color: #8b8bff; text-decoration: none; cursor: pointer; }
  .nav a:hover { background: #2a2a5f; }
  .category-section { padding: 16px 40px 32px; }
  .category-section h2 { font-size: 20px; font-weight: 700; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid #1a1a35; }
  .repo-cards { display: flex; gap: 16px; flex-wrap: wrap; }
  .repo-card { background: #111125; border: 1px solid #1a1a35; border-radius: 12px; padding: 20px; flex: 1; min-width: 280px; max-width: 400px; }
  .repo-card h3 { font-size: 16px; margin-bottom: 4px; }
  .repo-card .stats { font-size: 12px; color: #666; margin-bottom: 12px; }
  .feature-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; margin: 2px; }
  .pill-high { background: #27ae6022; color: #27ae60; border: 1px solid #27ae6044; }
  .pill-mid { background: #f39c1222; color: #f39c12; border: 1px solid #f39c1244; }
  .pill-low { background: #e74c3c22; color: #e74c3c; border: 1px solid #e74c3c44; }
</style></head><body>

<div class="header">
  <h1>🔧 repocraft dashboard</h1>
  <p class="meta" id="meta"></p>
</div>
<div class="nav" id="nav"></div>
<div id="content"></div>

<script>
const all = ${data};

let totalRepos = 0, totalFeatures = 0;
all.forEach(cat => { totalRepos += cat.repos.length; cat.repos.forEach(r => totalFeatures += r.features.length); });
document.getElementById('meta').textContent = totalRepos + ' repos · ' + totalFeatures + ' features · ' + all.length + ' categories';

const nav = document.getElementById('nav');
all.forEach(cat => {
  const a = document.createElement('a');
  a.textContent = cat.label + ' (' + cat.repos.length + ')';
  a.href = '#cat-' + cat.name;
  nav.appendChild(a);
});

const content = document.getElementById('content');
all.forEach(cat => {
  const sec = document.createElement('div');
  sec.className = 'category-section';
  sec.id = 'cat-' + cat.name;
  let html = '<h2>' + cat.label + '</h2><div class="repo-cards">';
  cat.repos.forEach(r => {
    html += '<div class="repo-card"><h3>' + r.name + '</h3>';
    html += '<div class="stats">' + r.totalLoc.toLocaleString() + ' LOC · ' + r.totalFiles + ' files · ' + r.features.length + ' features</div>';
    r.features.sort((a,b) => b.maturity - a.maturity).forEach(f => {
      const cls = f.maturity >= 7 ? 'pill-high' : f.maturity >= 4 ? 'pill-mid' : 'pill-low';
      html += '<span class="feature-pill ' + cls + '">' + f.name + ' ' + f.maturity + '</span>';
    });
    html += '</div>';
  });
  html += '</div>';
  sec.innerHTML = html;
  content.appendChild(sec);
});
</script></body></html>`;

  const outFile = 'repocraft-dashboard.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Dashboard saved: ${outFile}`);
  console.log(`   Open in browser: open ${outFile}`);
}

function generateCraftHTML(allResults) {
  const data = JSON.stringify(allResults);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft craft</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a1a; color: #e0e0e0; }
  .header { padding: 32px 40px 16px; }
  .header h1 { font-size: 28px; font-weight: 800; }
  .toolbar { padding: 8px 40px 16px; display: flex; gap: 12px; align-items: center; }
  .toolbar .selected-count { font-size: 14px; color: #8b8bff; }
  .toolbar button { padding: 8px 24px; border-radius: 8px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
  .btn-generate { background: #27ae60; color: #fff; }
  .btn-generate:hover { background: #2ecc71; }
  .btn-generate:disabled { background: #333; color: #666; cursor: not-allowed; }
  .btn-clear { background: #333; color: #aaa; }
  .craft-grid { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 40px 40px; }
  .craft-box { padding: 14px 18px; border-radius: 10px; min-width: 200px; max-width: 280px; flex: 1; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; opacity: 0.6; }
  .craft-box:hover { opacity: 0.9; }
  .craft-box.selected { opacity: 1; border-color: #8b8bff; box-shadow: 0 0 12px rgba(139,139,255,0.3); }
  .craft-box .name { font-size: 14px; font-weight: 700; }
  .craft-box .source { font-size: 11px; color: #666; margin-top: 2px; }
  .craft-box .desc { font-size: 11px; opacity: 0.5; margin-top: 6px; }
  .craft-box .score { font-size: 12px; margin-top: 6px; font-weight: 600; }
  .output-panel { margin: 16px 40px 40px; background: #111125; border: 1px solid #1a1a35; border-radius: 12px; padding: 24px; display: none; }
  .output-panel h2 { font-size: 16px; margin-bottom: 12px; }
  .output-panel pre { background: #0a0a1a; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; color: #aaa; max-height: 400px; overflow-y: auto; }
</style></head><body>

<div class="header">
  <h1>🔧 repocraft craft <span style="opacity:0.35;font-weight:300">— select features to compose</span></h1>
</div>
<div class="toolbar">
  <span class="selected-count" id="count">0 selected</span>
  <button class="btn-generate" id="generateBtn" disabled>Generate Project</button>
  <button class="btn-clear" id="clearBtn">Clear</button>
</div>
<div class="craft-grid" id="grid"></div>
<div class="output-panel" id="output">
  <h2>Generated Project Structure</h2>
  <pre id="outputCode"></pre>
</div>

<script>
const all = ${data};
const selected = new Set();
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');
const genBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const outputPanel = document.getElementById('output');
const outputCode = document.getElementById('outputCode');

function mColor(m) {
  if (m >= 8) return '#27ae60';
  if (m >= 6) return '#f39c12';
  if (m >= 4) return '#e67e22';
  return '#e74c3c';
}

// Render all feature boxes from all repos
const allFeatures = [];
all.forEach(cat => cat.repos.forEach(r => r.features.forEach(f => {
  allFeatures.push({ ...f, repoName: r.name, repoUrl: r.repo, categoryName: cat.label });
})));

// Deduplicate by name, keep highest maturity
const featureMap = {};
allFeatures.forEach(f => {
  const key = f.name;
  if (!featureMap[key] || f.maturity > featureMap[key].maturity) {
    featureMap[key] = f;
  }
});

Object.values(featureMap).sort((a,b) => b.maturity - a.maturity).forEach(f => {
  const el = document.createElement('div');
  el.className = 'craft-box';
  const bg = mColor(f.maturity) + '12';
  el.style.background = bg;
  el.innerHTML = '<div class="name">' + f.name + '</div>'
    + '<div class="source">from ' + f.repoName + ' (' + f.categoryName + ')</div>'
    + '<div class="desc">' + f.description + '</div>'
    + '<div class="score" style="color:' + mColor(f.maturity) + '">' + f.maturity + '/10 · ' + (f.loc_estimate||0).toLocaleString() + ' LOC</div>';
  el.onclick = () => {
    const key = f.name + '|' + f.repoName;
    if (selected.has(key)) { selected.delete(key); el.classList.remove('selected'); }
    else { selected.add(key); el.classList.add('selected'); }
    countEl.textContent = selected.size + ' selected';
    genBtn.disabled = selected.size === 0;
  };
  grid.appendChild(el);
});

clearBtn.onclick = () => {
  selected.clear();
  document.querySelectorAll('.craft-box').forEach(el => el.classList.remove('selected'));
  countEl.textContent = '0 selected';
  genBtn.disabled = true;
  outputPanel.style.display = 'none';
};

genBtn.onclick = () => {
  const items = [...selected].map(s => {
    const [name, repo] = s.split('|');
    return { name, repo };
  });
  outputPanel.style.display = 'block';
  outputCode.textContent = JSON.stringify({
    project: 'my-crafted-project',
    selectedFeatures: items,
    instruction: 'Use repocraft CLI to generate: repocraft craft --generate --features "' + items.map(i=>i.name).join(',') + '"'
  }, null, 2);
};
</script></body></html>`;

  const outFile = 'repocraft-craft.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Craft UI saved: ${outFile}`);
  console.log(`   Open in browser: open ${outFile}`);
}

module.exports = { generateFeatureMap, generateCompareMatrix, generateDashboardHTML, generateCraftHTML };

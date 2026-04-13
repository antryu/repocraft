const fs = require('fs');

const CATEGORY_COLORS = {
  auth: '#ff6b6b', messaging: '#4ecdc4', api: '#45b7d1', ui: '#a55eea',
  storage: '#ff9f43', 'ai-model': '#26de81', 'tool-execution': '#fed330',
  memory: '#fd9644', scheduling: '#a55eea', deployment: '#4b7bec',
  testing: '#778ca3', docs: '#d1d8e0', config: '#636e72', 'plugin-system': '#2bcbba',
  monitoring: '#fc5c65', search: '#20bf6b', media: '#eb3b5a', other: '#4b6584',
};

function maturityColor(m) {
  if (m >= 8) return '#00d2ff';
  if (m >= 6) return '#a8e063';
  if (m >= 4) return '#f7971e';
  return '#ff416c';
}

function maturityGradient(m) {
  if (m >= 8) return 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)';
  if (m >= 6) return 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)';
  if (m >= 4) return 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)';
  return 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)';
}

// ─── SHARED STYLES ───
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #08081a; color: #e8e8f0; min-height: 100vh; overflow-x: hidden; }

  /* Animated gradient background */
  body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.05) 0%, transparent 50%); pointer-events: none; z-index: -1; }

  /* Glass morphism panel */
  .glass { background: rgba(17,17,40,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; }

  /* Animations */
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(139,92,246,0.3); } 50% { box-shadow: 0 0 20px rgba(139,92,246,0.5); } }
  .animate-in { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }

  /* Header */
  .header { padding: 48px 48px 24px; }
  .header h1 { font-size: 36px; font-weight: 900; letter-spacing: -1.5px; background: linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
  .header .subtitle { font-size: 15px; color: #555; margin-top: 6px; font-weight: 400; }
  .badges { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .badge { padding: 5px 14px; border-radius: 24px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; }
  .badge-primary { background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15)); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; }
  .badge-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #777; }

  /* Panel grid */
  .dashboard { display: grid; gap: 16px; padding: 16px 48px 48px; }
  .panel { padding: 28px; animation: fadeInUp 0.5s ease-out forwards; }
  .panel h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #4a4a6a; margin-bottom: 18px; font-weight: 700; }
  .chart { width: 100%; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 3px; }

  @media (max-width: 900px) { .header, .dashboard { padding-left: 20px; padding-right: 20px; } }
`;

// ─── FEATURE MAP (analyze --web) ───
function generateFeatureMap(result) {
  const data = JSON.stringify(result);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft — ${result.repo}</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<style>
  ${SHARED_CSS}
  .dashboard { grid-template-columns: 1fr 1fr; }
  .panel-wide { grid-column: 1 / -1; }

  .feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; padding: 0 48px 32px; }
  .feature-box { padding: 20px 22px; border-radius: 14px; cursor: default; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; }
  .feature-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 14px 14px 0 0; }
  .feature-box:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .feature-box .name { font-size: 15px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.3px; }
  .feature-box .desc { font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .feature-box .meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #555; }
  .feature-box .maturity-track { height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 10px; overflow: hidden; }
  .feature-box .maturity-fill { height: 100%; border-radius: 2px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
  .feature-box .score { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
</style></head><body>

<div class="header">
  <h1>repocraft</h1>
  <div class="subtitle">${result.repo}</div>
  <div class="badges">
    <span class="badge badge-primary">${result.features.length} features extracted</span>
    <span class="badge badge-stat">${result.totalFiles.toLocaleString()} files</span>
    <span class="badge badge-stat">${result.totalLoc.toLocaleString()} LOC</span>
  </div>
</div>

<div class="feature-grid" id="featureGrid"></div>

<div class="dashboard">
  <div class="panel glass panel-wide">
    <h2>Feature Landscape</h2>
    <div id="treemap" class="chart" style="height:480px"></div>
  </div>
  <div class="panel glass">
    <h2>Maturity Spectrum</h2>
    <div id="maturity" class="chart" style="height:360px"></div>
  </div>
  <div class="panel glass">
    <h2>Category Composition</h2>
    <div id="category" class="chart" style="height:360px"></div>
  </div>
</div>

<script>
const data = ${data};
const catColors = ${JSON.stringify(CATEGORY_COLORS)};

function mColor(m) { return m >= 8 ? '#00d2ff' : m >= 6 ? '#a8e063' : m >= 4 ? '#f7971e' : '#ff416c'; }
function mGrad(m) { return m >= 8 ? 'linear-gradient(135deg,#00d2ff,#3a7bd5)' : m >= 6 ? 'linear-gradient(135deg,#a8e063,#56ab2f)' : m >= 4 ? 'linear-gradient(135deg,#f7971e,#ffd200)' : 'linear-gradient(135deg,#ff416c,#ff4b2b)'; }

// Feature boxes with staggered animation
const grid = document.getElementById('featureGrid');
data.features.sort((a,b) => b.loc_estimate - a.loc_estimate).forEach((f, i) => {
  const el = document.createElement('div');
  el.className = 'feature-box glass animate-in';
  el.style.animationDelay = (i * 0.05) + 's';
  const c = mColor(f.maturity);
  el.style.setProperty('--accent', c);
  el.innerHTML = \`<div style="position:absolute;top:0;left:0;right:0;height:3px;background:\${mGrad(f.maturity)}"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div class="name">\${f.name}</div>
      <div class="score" style="color:\${c}">\${f.maturity}</div>
    </div>
    <div class="desc">\${f.description}</div>
    <div class="meta">
      <span style="background:\${(catColors[f.category]||'#555')}22;color:\${catColors[f.category]||'#888'};padding:2px 8px;border-radius:8px;font-size:10px">\${f.category}</span>
      <span>\${(f.loc_estimate||0).toLocaleString()} LOC</span>
    </div>
    <div class="maturity-track"><div class="maturity-fill" style="width:\${f.maturity*10}%;background:\${mGrad(f.maturity)}"></div></div>\`;
  grid.appendChild(el);
});

// ECharts dark theme
const echartTheme = { backgroundColor: 'transparent' };

// Treemap
const treemap = echarts.init(document.getElementById('treemap'));
treemap.setOption({
  tooltip: { backgroundColor: 'rgba(17,17,40,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#ddd', fontSize: 13 },
    formatter: p => '<b style="font-size:15px">' + p.name + '</b><br/><span style="color:#888">Maturity:</span> <b style="color:'+mColor(p.data.maturity)+'">' + p.data.maturity + '/10</b><br/><span style="color:#888">LOC:</span> ' + (p.value||0).toLocaleString() + '<br/><span style="color:#888">Category:</span> ' + (p.data.cat||'') },
  series: [{
    type: 'treemap', roam: false, nodeClick: false, width: '100%', height: '100%',
    breadcrumb: { show: false },
    label: { show: true, fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'Inter', formatter: '{b}' },
    itemStyle: { borderColor: '#08081a', borderWidth: 3, gapWidth: 3 },
    data: data.features.map(f => ({
      name: f.name, value: f.loc_estimate || 100, maturity: f.maturity, cat: f.category,
      itemStyle: { color: mColor(f.maturity), borderRadius: 4 },
      label: { fontSize: Math.max(11, Math.min(18, Math.round(Math.sqrt(f.loc_estimate||100) / 8))) }
    }))
  }]
});

// Maturity
const matChart = echarts.init(document.getElementById('maturity'));
const buckets = [
  { name: 'Battle-tested\\n9-10', range: [9,10], color: '#00d2ff', grad: ['#00d2ff','#3a7bd5'] },
  { name: 'Production\\n7-8', range: [7,8], color: '#a8e063', grad: ['#a8e063','#56ab2f'] },
  { name: 'Functional\\n4-6', range: [4,6], color: '#f7971e', grad: ['#f7971e','#ffd200'] },
  { name: 'Experimental\\n1-3', range: [1,3], color: '#ff416c', grad: ['#ff416c','#ff4b2b'] },
];
matChart.setOption({
  tooltip: { backgroundColor: 'rgba(17,17,40,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#ddd' } },
  grid: { left: 20, right: 20, top: 20, bottom: 40 },
  xAxis: { type: 'category', data: buckets.map(b => b.name), axisLabel: { color: '#555', fontSize: 11, fontFamily: 'Inter', interval: 0 }, axisLine: { show: false }, axisTick: { show: false } },
  yAxis: { type: 'value', axisLabel: { color: '#333' }, splitLine: { lineStyle: { color: '#111130' } } },
  series: [{ type: 'bar', data: buckets.map(b => {
    const count = data.features.filter(f => f.maturity >= b.range[0] && f.maturity <= b.range[1]).length;
    return { value: count, itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:b.grad[0]},{offset:1,color:b.grad[1]}]), borderRadius: [6,6,0,0] } };
  }), barWidth: '45%', label: { show: true, position: 'top', color: '#888', fontSize: 14, fontWeight: 700, fontFamily: 'Inter' } }]
});

// Category donut
const catChart = echarts.init(document.getElementById('category'));
const catAgg = {};
data.features.forEach(f => { catAgg[f.category] = (catAgg[f.category]||0) + 1; });
catChart.setOption({
  tooltip: { backgroundColor: 'rgba(17,17,40,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#ddd' },
    formatter: p => '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+p.color+';margin-right:6px"></span><b>'+p.name+'</b>: '+p.value+' ('+p.percent+'%)' },
  series: [{ type: 'pie', radius: ['45%','75%'], center: ['50%','50%'],
    itemStyle: { borderRadius: 8, borderColor: '#111128', borderWidth: 4 },
    label: { color: '#888', fontSize: 12, fontFamily: 'Inter' },
    labelLine: { lineStyle: { color: '#2a2a4a' } },
    emphasis: { label: { fontSize: 15, fontWeight: 700 }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' } },
    data: Object.entries(catAgg).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({ name: k, value: v, itemStyle: { color: catColors[k]||'#555' } }))
  }]
});

window.addEventListener('resize', () => { treemap.resize(); matChart.resize(); catChart.resize(); });
</script></body></html>`;

  const outFile = 'repocraft-output.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Feature map saved: ${outFile}`);
}

// ─── COMPARE MATRIX ───
function generateCompareMatrix(category, repos) {
  const allFeatures = new Set();
  repos.forEach(r => r.features.forEach(f => allFeatures.add(f.name)));
  const featureList = [...allFeatures].sort();

  const data = JSON.stringify({ category, repos: repos.map(r => ({
    name: r.name, repo: r.repo, totalLoc: r.totalLoc, totalFiles: r.totalFiles, features: r.features,
  })), featureList });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft compare — ${category}</title>
<style>
  ${SHARED_CSS}

  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; padding: 0 48px 24px; }
  .summary-card { padding: 20px; transition: all 0.3s; }
  .summary-card:hover { transform: translateY(-2px); border-color: rgba(139,92,246,0.3); }
  .summary-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #4a4a6a; font-weight: 600; }
  .summary-card .value { font-size: 32px; font-weight: 800; margin-top: 6px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .summary-card .sub { font-size: 12px; color: #444; margin-top: 4px; }

  .matrix-wrap { padding: 0 48px 48px; overflow-x: auto; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; }
  th { padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #4a4a6a; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.05); position: sticky; top: 0; background: #08081a; z-index: 10; }
  td { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.2s; }
  tr:hover td { background: rgba(139,92,246,0.04); }
  .feature-name { font-weight: 600; color: #bbb; min-width: 220px; font-size: 14px; }
  .repo-header { text-align: center; font-weight: 700; min-width: 130px; }
  .cell { text-align: center; font-weight: 700; font-size: 14px; position: relative; }
  .cell .pip { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 28px; border-radius: 8px; font-size: 12px; font-weight: 700; }
  .pip-high { background: rgba(0,210,255,0.12); color: #00d2ff; }
  .pip-mid { background: rgba(168,224,99,0.12); color: #a8e063; }
  .pip-low { background: rgba(255,65,108,0.12); color: #ff416c; }
  .pip-warn { background: rgba(247,151,30,0.12); color: #f7971e; }
  .pip-none { color: #222; }
</style></head><body>

<div class="header">
  <h1>repocraft</h1>
  <div class="subtitle">compare — ${category}</div>
</div>

<div class="summary" id="summary"></div>
<div class="matrix-wrap"><table id="matrix"></table></div>

<script>
const d = ${data};

function mColor(m) { return m >= 8 ? '#00d2ff' : m >= 6 ? '#a8e063' : m >= 4 ? '#f7971e' : '#ff416c'; }

const sumEl = document.getElementById('summary');
sumEl.innerHTML = d.repos.map((r, i) =>
  '<div class="summary-card glass animate-in" style="animation-delay:' + (i*0.1) + 's"><div class="label">' + r.name + '</div><div class="value">' + r.features.length + '</div><div class="sub">' + r.totalLoc.toLocaleString() + ' LOC · ' + r.totalFiles + ' files</div></div>'
).join('');

const table = document.getElementById('matrix');
let html = '<thead><tr><th>Feature</th>';
d.repos.forEach(r => { html += '<th class="repo-header" style="color:#8b5cf6">' + r.name + '</th>'; });
html += '</tr></thead><tbody>';

d.featureList.forEach((fname, i) => {
  html += '<tr class="animate-in" style="animation-delay:' + (i*0.03+0.3) + 's"><td class="feature-name">' + fname + '</td>';
  d.repos.forEach(r => {
    const f = r.features.find(x => x.name === fname);
    if (f) {
      const cls = f.maturity >= 8 ? 'pip-high' : f.maturity >= 6 ? 'pip-mid' : f.maturity >= 4 ? 'pip-warn' : 'pip-low';
      html += '<td class="cell"><span class="pip ' + cls + '">' + f.maturity + '</span></td>';
    } else {
      html += '<td class="cell"><span class="pip pip-none">—</span></td>';
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
}

// ─── DASHBOARD ───
function generateDashboardHTML(allResults) {
  const data = JSON.stringify(allResults);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft dashboard</title>
<style>
  ${SHARED_CSS}

  .nav { padding: 0 48px 24px; display: flex; gap: 8px; flex-wrap: wrap; }
  .nav a { padding: 7px 18px; border-radius: 24px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.3s; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: #666; }
  .nav a:hover { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.3); color: #a78bfa; transform: translateY(-1px); }

  .category-section { padding: 16px 48px 40px; }
  .category-section h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 18px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04); }
  .category-section h2 .count { font-size: 14px; font-weight: 400; color: #555; margin-left: 8px; }

  .repo-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .repo-card { padding: 24px; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
  .repo-card:hover { transform: translateY(-4px); border-color: rgba(139,92,246,0.2); box-shadow: 0 16px 48px rgba(0,0,0,0.3); }
  .repo-card h3 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
  .repo-card .stats { font-size: 12px; color: #555; margin-bottom: 14px; }

  .pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; transition: all 0.2s; cursor: default; }
  .pill:hover { transform: scale(1.05); }
  .pill-high { background: rgba(0,210,255,0.1); color: #00d2ff; border: 1px solid rgba(0,210,255,0.2); }
  .pill-mid { background: rgba(168,224,99,0.1); color: #a8e063; border: 1px solid rgba(168,224,99,0.2); }
  .pill-low { background: rgba(255,65,108,0.1); color: #ff416c; border: 1px solid rgba(255,65,108,0.2); }
  .pill-warn { background: rgba(247,151,30,0.1); color: #f7971e; border: 1px solid rgba(247,151,30,0.2); }
</style></head><body>

<div class="header">
  <h1>repocraft</h1>
  <div class="subtitle">Full Catalog Dashboard</div>
  <div class="badges" id="meta"></div>
</div>
<div class="nav" id="nav"></div>
<div id="content"></div>

<script>
const all = ${data};

let totalRepos = 0, totalFeatures = 0;
all.forEach(cat => { totalRepos += cat.repos.length; cat.repos.forEach(r => totalFeatures += r.features.length); });
document.getElementById('meta').innerHTML = '<span class="badge badge-primary">' + all.length + ' categories</span><span class="badge badge-stat">' + totalRepos + ' repos</span><span class="badge badge-stat">' + totalFeatures + ' features</span>';

const nav = document.getElementById('nav');
all.forEach(cat => {
  const a = document.createElement('a');
  a.textContent = cat.label + ' (' + cat.repos.length + ')';
  a.href = '#cat-' + cat.name;
  nav.appendChild(a);
});

function mClass(m) { return m >= 8 ? 'pill-high' : m >= 6 ? 'pill-mid' : m >= 4 ? 'pill-warn' : 'pill-low'; }

const content = document.getElementById('content');
all.forEach((cat, ci) => {
  const sec = document.createElement('div');
  sec.className = 'category-section';
  sec.id = 'cat-' + cat.name;
  let html = '<h2 class="animate-in" style="animation-delay:' + (ci*0.1) + 's">' + cat.label + '<span class="count">' + cat.repos.length + ' repos</span></h2><div class="repo-cards">';
  cat.repos.forEach((r, ri) => {
    html += '<div class="repo-card glass animate-in" style="animation-delay:' + (ci*0.1+ri*0.08+0.2) + 's"><h3>' + r.name + '</h3>';
    html += '<div class="stats">' + r.totalLoc.toLocaleString() + ' LOC · ' + r.totalFiles + ' files · ' + r.features.length + ' features</div>';
    html += '<div class="pills">';
    r.features.sort((a,b) => b.maturity - a.maturity).forEach(f => {
      html += '<span class="pill ' + mClass(f.maturity) + '">' + f.name + ' <b>' + f.maturity + '</b></span>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  sec.innerHTML = html;
  content.appendChild(sec);
});
</script></body></html>`;

  const outFile = 'repocraft-dashboard.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Dashboard saved: ${outFile}`);
}

// ─── CRAFT ───
function generateCraftHTML(allResults) {
  const data = JSON.stringify(allResults);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>repocraft craft</title>
<style>
  ${SHARED_CSS}

  .toolbar { padding: 8px 48px 20px; display: flex; gap: 14px; align-items: center; position: sticky; top: 0; z-index: 100; background: rgba(8,8,26,0.9); backdrop-filter: blur(12px); padding-top: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .selected-count { font-size: 15px; font-weight: 700; color: #8b5cf6; min-width: 100px; }
  .toolbar button { padding: 10px 28px; border-radius: 12px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; letter-spacing: -0.3px; }
  .btn-generate { background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #fff; box-shadow: 0 4px 16px rgba(139,92,246,0.3); }
  .btn-generate:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,0.4); }
  .btn-generate:disabled { background: #222; color: #444; box-shadow: none; cursor: not-allowed; }
  .btn-clear { background: rgba(255,255,255,0.05); color: #888; border: 1px solid rgba(255,255,255,0.08); }
  .btn-clear:hover { background: rgba(255,255,255,0.08); }

  .craft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; padding: 0 48px 32px; }
  .craft-box { padding: 18px 20px; border-radius: 14px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); border: 2px solid transparent; opacity: 0.55; position: relative; overflow: hidden; }
  .craft-box:hover { opacity: 0.85; transform: translateY(-2px); }
  .craft-box.selected { opacity: 1; border-color: #8b5cf6; box-shadow: 0 0 20px rgba(139,92,246,0.2); animation: glow 2s ease-in-out infinite; }
  .craft-box .name { font-size: 14px; font-weight: 700; letter-spacing: -0.3px; }
  .craft-box .source { font-size: 11px; color: #555; margin-top: 3px; }
  .craft-box .desc { font-size: 11px; color: #444; margin-top: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .craft-box .bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .craft-box .score { font-size: 18px; font-weight: 800; }
  .craft-box .loc { font-size: 11px; color: #444; }
  .craft-box .check { position: absolute; top: 10px; right: 12px; width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.3s; }
  .craft-box.selected .check { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }

  .output-panel { margin: 0 48px 48px; padding: 28px; display: none; }
  .output-panel h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .output-panel pre { background: #06060f; padding: 20px; border-radius: 12px; overflow-x: auto; font-size: 13px; line-height: 1.6; color: #a78bfa; max-height: 400px; overflow-y: auto; border: 1px solid rgba(139,92,246,0.1); }
</style></head><body>

<div class="header">
  <h1>repocraft</h1>
  <div class="subtitle">Craft — Select features to compose your project</div>
</div>
<div class="toolbar">
  <span class="selected-count" id="count">0 selected</span>
  <button class="btn-generate" id="generateBtn" disabled>✨ Generate Project</button>
  <button class="btn-clear" id="clearBtn">Clear All</button>
</div>
<div class="craft-grid" id="grid"></div>
<div class="output-panel glass" id="output">
  <h2>🔧 Generated Project Blueprint</h2>
  <pre id="outputCode"></pre>
</div>

<script>
const all = ${data};
const selected = new Map();
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');
const genBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const outputPanel = document.getElementById('output');
const outputCode = document.getElementById('outputCode');

function mColor(m) { return m >= 8 ? '#00d2ff' : m >= 6 ? '#a8e063' : m >= 4 ? '#f7971e' : '#ff416c'; }

// Collect all features, deduplicate by name (keep all sources)
const featureMap = {};
all.forEach(cat => cat.repos.forEach(r => r.features.forEach(f => {
  const key = f.name;
  if (!featureMap[key]) featureMap[key] = { ...f, sources: [] };
  featureMap[key].sources.push({ repo: r.name, url: r.repo, maturity: f.maturity });
  if (f.maturity > featureMap[key].maturity) {
    featureMap[key] = { ...featureMap[key], ...f };
  }
})));

// Render
let delay = 0;
Object.values(featureMap).sort((a,b) => b.maturity - a.maturity).forEach(f => {
  const el = document.createElement('div');
  el.className = 'craft-box glass animate-in';
  el.style.animationDelay = (delay * 0.03) + 's';
  delay++;
  const c = mColor(f.maturity);
  const bestSource = f.sources.sort((a,b) => b.maturity - a.maturity)[0];
  el.innerHTML = \`<div class="check">✓</div>
    <div class="name">\${f.name}</div>
    <div class="source">best: \${bestSource.repo} (\${f.sources.length} source\${f.sources.length>1?'s':''})</div>
    <div class="desc">\${f.description}</div>
    <div class="bottom">
      <div class="score" style="color:\${c}">\${f.maturity}</div>
      <div class="loc">\${(f.loc_estimate||0).toLocaleString()} LOC</div>
    </div>\`;
  el.onclick = () => {
    const key = f.name;
    if (selected.has(key)) { selected.delete(key); el.classList.remove('selected'); }
    else { selected.set(key, { ...f, bestSource: bestSource.repo }); el.classList.add('selected'); }
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
  const items = [...selected.values()];
  const totalLoc = items.reduce((s,f) => s + (f.loc_estimate||0), 0);
  const categories = [...new Set(items.map(f => f.category))];

  outputPanel.style.display = 'block';
  outputCode.textContent = JSON.stringify({
    project: 'my-crafted-project',
    summary: items.length + ' features, ~' + totalLoc.toLocaleString() + ' LOC from ' + new Set(items.map(f=>f.bestSource)).size + ' repos',
    categories,
    features: items.map(f => ({
      name: f.name,
      from: f.bestSource,
      maturity: f.maturity,
      category: f.category,
      estimatedLoc: f.loc_estimate,
    })),
    nextStep: 'Run: repocraft craft --generate --config blueprint.json',
  }, null, 2);
  outputPanel.scrollIntoView({ behavior: 'smooth' });
};
</script></body></html>`;

  const outFile = 'repocraft-craft.html';
  fs.writeFileSync(outFile, html);
  console.log(`✅ Craft UI saved: ${outFile}`);
}

module.exports = { generateFeatureMap, generateCompareMatrix, generateDashboardHTML, generateCraftHTML };

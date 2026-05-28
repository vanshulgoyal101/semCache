export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SemCache Dev Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #f8fafc;
      --panel-bg: #ffffff;
      --border: #e2e8f0;
      --border-focus: #3b82f6;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --accent-green: #10b981;
      --accent-orange: #f59e0b;
      --accent-pink: #ef4444;
      --text: #0f172a;
      --text-muted: #64748b;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--panel-bg);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      background: var(--accent);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 15px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.3px;
    }

    .logo-badge {
      font-size: 11px;
      background: #eff6ff;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      font-weight: 500;
    }

    .controls {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--panel-bg);
      color: #334155;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: var(--shadow-sm);
    }

    .btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: var(--text);
    }

    .btn-primary {
      background: var(--accent);
      color: white;
      border: 1px solid var(--accent);
    }

    .btn-primary:hover {
      background: var(--accent-hover);
      color: white;
    }

    .main-container {
      flex: 1;
      padding: 32px;
      max-width: 1500px;
      width: 100%;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 20px;
    }

    .card {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .col-4 { grid-column: span 4; }
    .col-6 { grid-column: span 6; }
    .col-8 { grid-column: span 8; }
    .col-12 { grid-column: span 12; }

    .metric-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 110px;
      padding: 20px 24px;
    }

    .metric-title {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      margin-top: 6px;
      color: var(--text);
    }

    .metric-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Simulation Sandbox Form */
    .sandbox-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 12.5px;
      font-weight: 500;
      color: #475569;
    }

    textarea, input, select {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px;
      color: var(--text);
      font-family: inherit;
      font-size: 13.5px;
      outline: none;
      transition: all 0.15s ease;
      box-shadow: var(--shadow-sm);
    }

    textarea:focus, input:focus, select:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    /* Logs Table / List */
    .log-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 380px;
      overflow-y: auto;
    }

    .log-item {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.15s ease;
    }

    .log-item:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }

    .log-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 75%;
    }

    .log-query {
      font-weight: 500;
      font-size: 13.5px;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .log-response {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .log-meta {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .badge {
      font-size: 10.5px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .badge-tier1 { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-tier2 { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-tier3 { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-miss { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    /* Vector Space Visualizer */
    #vectorCanvas {
      width: 100%;
      height: 380px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid var(--border);
      cursor: crosshair;
    }

    .tooltip {
      position: absolute;
      background: #ffffff;
      border: 1px solid var(--border);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      max-width: 260px;
      pointer-events: none;
      display: none;
      z-index: 10;
      box-shadow: var(--shadow-lg);
      color: var(--text);
    }

    .chart-container {
      height: 220px;
      position: relative;
    }

    /* Sandbox Result Panel */
    .sandbox-result {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      min-height: 110px;
      max-height: 190px;
      overflow-y: auto;
      white-space: pre-wrap;
      color: #334155;
    }
  </style>
</head>
<body>

  <header>
    <div class="logo-container">
      <div class="logo-icon">S</div>
      <div class="logo-text">SemCache</div>
      <div class="logo-badge">Developer Console</div>
    </div>
    <div class="controls">
      <button class="btn" onclick="fetchData()">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18"></path></svg>
        Refresh
      </button>
      <button class="btn" style="border-color: rgba(239,68,68,0.4); color: var(--accent-pink);" onclick="clearCache()">
        Clear Cache
      </button>
    </div>
  </header>

  <div class="main-container">
    <!-- Stat Grid -->
    <div class="card col-4 metric-card">
      <div class="metric-title">Latency Saved</div>
      <div class="metric-value" id="stat-latency">0s</div>
      <div class="metric-desc">Total execution time saved from caching</div>
    </div>
    <div class="card col-4 metric-card">
      <div class="metric-title">API Cost Saved</div>
      <div class="metric-value" id="stat-cost">$0.00</div>
      <div class="metric-desc">Estimated USD saved by avoiding LLM calls</div>
    </div>
    <div class="card col-4 metric-card">
      <div class="metric-title">Cache Hit Rate</div>
      <div class="metric-value" id="stat-hitrate">0%</div>
      <div class="metric-desc">Overall effectiveness of tiered lookup</div>
    </div>

    <!-- Graph / Chart -->
    <div class="card col-8">
      <div class="card-title">
        <span>Semantic Vector Space Map</span>
        <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">Clustered queries repel based on similarity</span>
      </div>
      <canvas id="vectorCanvas"></canvas>
      <div id="canvas-tooltip" class="tooltip"></div>
    </div>

    <!-- Match Statistics Chart -->
    <div class="card col-4">
      <div class="card-title">Cache Tier Hits</div>
      <div class="chart-container">
        <canvas id="hitsChart"></canvas>
      </div>
    </div>

    <!-- Interactive Simulation Sandbox -->
    <div class="card col-6">
      <div class="card-title">Interactive Caching Sandbox</div>
      <div class="sandbox-form">
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="sandbox-input">Enter a query to test</label>
            <span style="font-size: 11px; color: var(--text-muted);">Select a preset below to try instantly</span>
          </div>
          <textarea id="sandbox-input" rows="3" placeholder="Ask a question (e.g. 'What is the capital of France?')"></textarea>
        </div>
        
        <div class="form-group">
          <label>Quick Presets</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button class="badge badge-tier1" style="cursor: pointer; border: 1px solid #bfdbfe; font-family: inherit; font-size: 11px;" onclick="setPreset('What is the capital of France?')">Exact (Tier 1)</button>
            <button class="badge badge-tier2" style="cursor: pointer; border: 1px solid #fde68a; font-family: inherit; font-size: 11px;" onclick="setPreset('What is the capital of France ?')">Fuzzy (Tier 2)</button>
            <button class="badge badge-tier3" style="cursor: pointer; border: 1px solid #bfdbfe; font-family: inherit; font-size: 11px;" onclick="setPreset('Tell me the capital city of France')">Semantic (Tier 3)</button>
            <button class="badge badge-miss" style="cursor: pointer; border: 1px solid #fecaca; font-family: inherit; font-size: 11px;" onclick="setPreset('Who painted the Mona Lisa?')">New Miss (Tier 4)</button>
          </div>
        </div>

        <button class="btn btn-primary" onclick="runSandboxTest()" style="justify-content: center;">
          Query SemCache
        </button>
        <div class="form-group">
          <label>Query Results & Telemetry</label>
          <div class="sandbox-result" id="sandbox-output">Awaiting query...</div>
        </div>
      </div>
    </div>

    <!-- Cache Entries Explorer -->
    <div class="card col-6">
      <div class="card-title">
        <span>Cached Prompts Explorer</span>
        <span id="cache-count-badge" class="badge badge-tier3">0 items</span>
      </div>
      <div class="log-list" id="cache-entries-list">
        <!-- populated dynamically -->
      </div>
    </div>
  </div>

  <script>
    let cacheEntries = [];
    let stats = {};
    let hitsChart = null;

    // Vector Visualization Variables
    const canvas = document.getElementById('vectorCanvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('canvas-tooltip');
    let nodes = [];

    // Resize canvas
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    async function fetchData() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        stats = data.stats;
        cacheEntries = data.entries;

        updateStatsUI();
        updateCharts();
        setupVectorNodes();
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
      }
    }

    async function clearCache() {
      if (confirm("Are you sure you want to clear the semantic cache?")) {
        await fetch('/api/clear', { method: 'POST' });
        fetchData();
      }
    }

    function updateStatsUI() {
      // Latency
      const sec = (stats.totalLatencySavedMs / 1000).toFixed(2);
      document.getElementById('stat-latency').innerText = sec + 's';

      // Cost
      document.getElementById('stat-cost').innerText = '$' + stats.estimatedCostSavedUsd.toFixed(4);

      // Hit rate
      const totalHits = stats.tier1Hits + stats.tier2Hits + stats.tier3Hits;
      const rate = stats.totalLookups > 0 ? ((totalHits / stats.totalLookups) * 100).toFixed(1) : '0.0';
      document.getElementById('stat-hitrate').innerText = rate + '%';

      // Entries list
      const listEl = document.getElementById('cache-entries-list');
      document.getElementById('cache-count-badge').innerText = cacheEntries.length + ' items';
      listEl.innerHTML = '';

      if (cacheEntries.length === 0) {
        listEl.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Cache is empty</div>';
        return;
      }

      cacheEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'log-item';
        
        let tagsHtml = '';
        if (entry.metadata && entry.metadata.tags) {
          entry.metadata.tags.forEach(t => {
            tagsHtml += \`<span class="badge" style="background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; margin-right: 4px;">\${t}</span>\`;
          });
        }

        item.innerHTML = \`
          <div class="log-info">
            <div class="log-query">\${escapeHtml(entry.query)}</div>
            <div class="log-response">\${escapeHtml(JSON.stringify(entry.response))}</div>
            <div style="display:flex; gap:4px; margin-top:4px;">\${tagsHtml}</div>
          </div>
          <div class="log-meta">
            <span class="badge badge-tier3">Accessed \${entry.accessCount}x</span>
          </div>
        \`;
        listEl.appendChild(item);
      });
    }

    function updateCharts() {
      const ctxHits = document.getElementById('hitsChart').getContext('2d');
      const data = [stats.tier1Hits, stats.tier2Hits, stats.tier3Hits, stats.misses];

      if (hitsChart) {
        hitsChart.data.datasets[0].data = data;
        hitsChart.update();
      } else {
        hitsChart = new Chart(ctxHits, {
          type: 'doughnut',
          data: {
            labels: ['Exact Hits', 'Fuzzy Hits', 'Semantic Hits', 'Misses'],
            datasets: [{
              data: data,
              backgroundColor: ['#10b981', '#f59e0b', '#2563eb', '#ef4444'],
              borderColor: '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#475569',
                  font: { family: 'Inter', size: 11 }
                }
              }
            }
          }
        });
      }
    }

    // A fast, elegant local Jaccard or Cosine repulsion physics simulator to cluster prompts on 2D space.
    function setupVectorNodes() {
      // Use clean corporate blue shades for nodes
      const blueShades = ['#2563eb', '#3b82f6', '#1d4ed8', '#1d4ed8', '#60a5fa'];
      nodes = cacheEntries.map((entry, index) => {
        return {
          id: entry.id,
          query: entry.query,
          response: entry.response,
          embedding: entry.embedding || [],
          x: canvas.width / 2 + (Math.random() - 0.5) * 150,
          y: canvas.height / 2 + (Math.random() - 0.5) * 150,
          vx: 0,
          vy: 0,
          radius: 7 + Math.min(entry.accessCount * 1.5, 10),
          color: blueShades[index % blueShades.length]
        };
      });
    }

    // Simple simulation loop
    function updatePhysics() {
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        
        // Pull towards center gently
        n1.vx += (canvas.width / 2 - n1.x) * 0.001;
        n1.vy += (canvas.height / 2 - n1.y) * 0.001;

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Cosine similarity
          let sim = 0;
          if (n1.embedding.length > 0 && n2.embedding.length > 0) {
            sim = cosineSim(n1.embedding, n2.embedding);
          }

          if (sim > 0.8) {
            const force = (sim - 0.8) * 0.02;
            n1.vx += dx * force;
            n1.vy += dy * force;
          } else {
            // Repulsive force
            const force = 0.5 / (dist * dist);
            n1.vx -= dx * force * 10;
            n1.vy -= dy * force * 10;
          }
        }
      }

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.85; // drag
        n.vy *= 0.85;

        // Bound to canvas
        n.x = Math.max(n.radius, Math.min(canvas.width - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(canvas.height - n.radius, n.y));
      });
    }

    function cosineSim(v1, v2) {
      let dot = 0;
      for (let i = 0; i < v1.length; i++) dot += v1[i] * v2[i];
      return dot;
    }

    function renderCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw connections for similar items
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          if (n1.embedding.length > 0 && n2.embedding.length > 0) {
            const sim = cosineSim(n1.embedding, n2.embedding);
            if (sim > 0.85) {
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        // Draw crisp node with white stroke and solid clean corporate color
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw shadow ring around it
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 1, 0, Math.PI * 2);
        ctx.stroke();
      });

      updatePhysics();
      requestAnimationFrame(renderCanvas);
    }

    // Canvas interactivity
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let hovered = null;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dist = Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2);
        if (dist < n.radius * 1.5) {
          hovered = n;
          break;
        }
      }

      if (hovered) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
        tooltip.innerHTML = \`
          <strong style="color:var(--accent)">Query:</strong> \${escapeHtml(hovered.query)}<br>
          <strong style="margin-top:6px; display:inline-block;">Cached Value:</strong> \${escapeHtml(JSON.stringify(hovered.response))}
        \`;
      } else {
        tooltip.style.display = 'none';
      }
    });

    async function runSandboxTest() {
      const inputVal = document.getElementById('sandbox-input').value.trim();
      if (!inputVal) return;

      const outputEl = document.getElementById('sandbox-output');
      outputEl.innerText = "Querying local SemCache...";

      try {
        const res = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: inputVal })
        });
        const result = await res.json();
        
        // Print detailed analysis
        let color = 'var(--accent-pink)'; // miss
        let badgeText = 'CACHE MISS';
        if (result.hit) {
          if (result.tier === 1) { color = 'var(--accent-green)'; badgeText = 'TIER 1 (EXACT HIT)'; }
          else if (result.tier === 2) { color = 'var(--accent-orange)'; badgeText = 'TIER 2 (FUZZY HIT)'; }
          else if (result.tier === 3) { color = 'var(--accent)'; badgeText = 'TIER 3 (SEMANTIC HIT)'; }
        }

        outputEl.innerHTML = \`
          <div style="color: \${color}; font-weight: 600; margin-bottom: 8px;">\${badgeText}</div>
          <div><strong>Elapsed Time:</strong> \${result.elapsedMs}ms</div>
          <div><strong>Estimated Cost Saved:</strong> $\${result.costSaved.toFixed(5)}</div>
          <div><strong>Latency Saved:</strong> \${result.latencySaved}ms</div>
          \${result.similarity ? \`<div><strong>Similarity Score:</strong> \${result.similarity.toFixed(4)}</div>\` : ''}
          <div style="margin-top: 10px; padding: 10px; background: #ffffff; border: 1px solid var(--border); border-radius: 6px; border-left: 4px solid \${color}">
            <strong>Output:</strong> \${escapeHtml(JSON.stringify(result.response))}
          </div>
        \`;

        // Refresh stats
        fetchData();
      } catch (err) {
        outputEl.innerText = "Error running sandbox test: " + err.message;
      }
    }

    function setPreset(val) {
      document.getElementById('sandbox-input').value = val;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Boot
    fetchData();
    renderCanvas();
  </script>
</body>
</html>`;

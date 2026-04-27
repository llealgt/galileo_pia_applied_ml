// ============================================================
// Hill Descent Widget — Dual panel: 2D contour + 3D surface
// Click on contour to pick start, both views stay synchronized
// ============================================================

function initHillDescentWidget() {
  const contourDiv = document.getElementById('hill-descent-contour');
  const surfaceDiv = document.getElementById('hill-descent-3d');
  if (!contourDiv || !surfaceDiv) return;

  const btnStep = document.getElementById('hill-step-btn');
  const btnAuto = document.getElementById('hill-auto-btn');
  const btnReset = document.getElementById('hill-reset-btn');
  const stepCountEl = document.getElementById('hill-step-count');
  const heightEl = document.getElementById('hill-height-val');
  const statusEl = document.getElementById('hill-status');

  // --- Terrain (MATLAB peaks) ---
  function terrain(x, y) {
    return 3 * (1 - x) * (1 - x) * Math.exp(-x * x - (y + 1) * (y + 1))
         - 10 * (x / 5 - x * x * x - Math.pow(y, 5)) * Math.exp(-x * x - y * y)
         - (1 / 3) * Math.exp(-(x + 1) * (x + 1) - y * y);
  }
  const H_EPS = 0.001;
  function dz_dx(x, y) { return (terrain(x + H_EPS, y) - terrain(x - H_EPS, y)) / (2 * H_EPS); }
  function dz_dy(x, y) { return (terrain(x, y + H_EPS) - terrain(x, y - H_EPS)) / (2 * H_EPS); }

  // --- Grid ---
  const N = 80, RANGE = 3;
  const xVals = [], yVals = [];
  for (let i = 0; i <= N; i++) {
    xVals.push(-RANGE + 2 * RANGE * i / N);
    yVals.push(-RANGE + 2 * RANGE * i / N);
  }
  const zGrid = [];
  let zMin = Infinity, zMax = -Infinity;
  for (let j = 0; j <= N; j++) {
    const row = [];
    for (let i = 0; i <= N; i++) {
      const z = terrain(xVals[i], yVals[j]);
      row.push(z);
      if (z < zMin) zMin = z;
      if (z > zMax) zMax = z;
    }
    zGrid.push(row);
  }

  const COLORSCALE = [
    [0.0, '#00008B'], [0.10, '#0044CC'], [0.20, '#0088FF'],
    [0.30, '#00CCFF'], [0.40, '#00FFAA'], [0.50, '#44FF44'],
    [0.60, '#AAFF00'], [0.70, '#FFFF00'], [0.80, '#FFCC00'],
    [0.90, '#FF6600'], [1.0, '#CC0000']
  ];

  // --- State ---
  const LR = 0.03;
  let posX = 1.0, posY = -0.5;
  let startX = posX, startY = posY;
  let trailX = [], trailY = [];
  let stepCount = 0;
  let autoInterval = null;
  let converged = false;

  // ===================== 2D CONTOUR (left) =====================
  // Traces: 0=contour, 1=trailLine, 2=trailDots, 3=current, 4=start, 5=arrow
  Plotly.newPlot(contourDiv, [
    { // 0: contour
      x: xVals, y: yVals, z: zGrid, type: 'contour',
      colorscale: COLORSCALE,
      contours: { coloring: 'heatmap', showlabels: true,
                  labelfont: { size: 8, color: 'rgba(236,230,208,0.7)' } },
      ncontours: 25, showscale: false,
      hovertemplate: 'x:%{x:.1f} y:%{y:.1f}<br>z:%{z:.1f}<extra>Click aquí</extra>'
    },
    { x: [], y: [], type: 'scatter', mode: 'lines',                          // 1: trail line
      line: { color: '#FFFFFF', width: 2.5 }, showlegend: false, hoverinfo: 'skip' },
    { x: [], y: [], type: 'scatter', mode: 'markers',                        // 2: trail dots
      marker: { size: 5, color: '#FFFF00', line: { color: '#000', width: 0.5 } },
      showlegend: false, hoverinfo: 'skip' },
    { x: [posX], y: [posY], type: 'scatter', mode: 'markers',                // 3: current
      marker: { size: 12, color: '#FF0000', symbol: 'star', line: { color: '#fff', width: 1 } },
      showlegend: false, hoverinfo: 'skip' },
    { x: [posX], y: [posY], type: 'scatter', mode: 'markers+text',           // 4: start
      marker: { size: 10, color: '#FFFF00', symbol: 'diamond', line: { color: '#000', width: 1 } },
      text: ['Inicio'], textposition: 'top center',
      textfont: { color: '#FFFF00', size: 10, family: 'Fira Code' },
      showlegend: false, hoverinfo: 'skip' },
  ], {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#0d0d1a',
    xaxis: { range: [-RANGE, RANGE], color: '#a8a290', gridcolor: 'rgba(255,255,255,0.06)',
             zeroline: false, showticklabels: false, title: '' },
    yaxis: { range: [-RANGE, RANGE], color: '#a8a290', gridcolor: 'rgba(255,255,255,0.06)',
             zeroline: false, showticklabels: false, title: '',
             scaleanchor: 'x', scaleratio: 1 },
    margin: { l: 5, r: 5, t: 18, b: 5 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 10 },
    annotations: [
      { // title label (index 0)
        x: 0, y: 3.15, xref: 'x', yref: 'y',
        text: '<b>Vista aérea</b> — click para elegir inicio',
        showarrow: false,
        font: { color: '#ece6d0', size: 10 },
        bgcolor: 'rgba(13,13,26,0.8)', borderpad: 3
      },
      { // gradient arrow (index 1) — updated dynamically
        x: 0, y: 0, ax: 0, ay: 0,
        xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
        showarrow: true,
        arrowhead: 2, arrowsize: 1, arrowwidth: 2.5,
        arrowcolor: '#83C167',
        text: '', opacity: 0
      }
    ]
  }, { responsive: true, displayModeBar: false });

  // ===================== 3D SURFACE (right) =====================
  // Traces: 0=surface, 1=ball3d, 2=trail3d
  Plotly.newPlot(surfaceDiv, [
    { // 0: surface
      x: xVals, y: yVals, z: zGrid, type: 'surface',
      colorscale: COLORSCALE, cmin: zMin, cmax: zMax,
      showscale: false,
      contours: { z: { show: true, usecolormap: true, highlightcolor: '#ffffff', project: { z: false } } },
      lighting: { ambient: 0.55, diffuse: 0.6, specular: 0.2, roughness: 0.6 },
      opacity: 0.88, hoverinfo: 'skip'
    },
    { // 1: ball
      x: [posX], y: [posY], z: [terrain(posX, posY) + 0.3],
      type: 'scatter3d', mode: 'markers',
      marker: { size: 7, color: '#FF0000', symbol: 'circle', line: { color: '#fff', width: 1 } },
      showlegend: false, hoverinfo: 'skip'
    },
    { // 2: trail
      x: [], y: [], z: [],
      type: 'scatter3d', mode: 'lines+markers',
      marker: { size: 3, color: '#FFFF00' },
      line: { color: '#FFFFFF', width: 4 },
      showlegend: false, hoverinfo: 'skip'
    }
  ], {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: { title: '', range: [-RANGE, RANGE], color: '#a8a290',
               gridcolor: 'rgba(255,255,255,0.08)', showticklabels: false, showspikes: false },
      yaxis: { title: '', range: [-RANGE, RANGE], color: '#a8a290',
               gridcolor: 'rgba(255,255,255,0.08)', showticklabels: false, showspikes: false },
      zaxis: { title: { text: 'Altura', font: { color: '#ece6d0', size: 10 } },
               range: [zMin - 0.5, zMax + 1], color: '#a8a290',
               gridcolor: 'rgba(255,255,255,0.08)', tickfont: { size: 8, color: '#a8a290' } },
      bgcolor: '#0d0d1a',
      camera: { eye: { x: 1.5, y: -1.6, z: 0.9 }, up: { x: 0, y: 0, z: 1 } },
      aspectratio: { x: 1, y: 1, z: 0.55 }
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 9 }
  }, { responsive: true, displayModeBar: false });

  updateAll();

  // --- Click on contour to set start ---
  contourDiv.on('plotly_click', function(ev) {
    if (!ev.points || !ev.points.length || ev.points[0].curveNumber !== 0) return;
    stopAuto();
    posX = ev.points[0].x; posY = ev.points[0].y;
    startX = posX; startY = posY;
    trailX = []; trailY = [];
    stepCount = 0; converged = false;
    syncAll();
    if (statusEl) { statusEl.textContent = 'Punto seleccionado'; statusEl.style.color = '#58C4DD'; }
  });

  // --- Sync both plots ---
  function syncAll() {
    const lineX = trailX.concat([posX]);
    const lineY = trailY.concat([posY]);
    const lineZ = lineX.map((x, i) => terrain(x, lineY[i]) + 0.15);
    const labels = trailX.map((_, i) => {
      if (trailX.length <= 20 || i % Math.ceil(trailX.length / 20) === 0) return String(i + 1);
      return '';
    });

    // 2D contour updates
    Plotly.restyle(contourDiv, { x: [[posX]], y: [[posY]] }, [3]); // current
    Plotly.restyle(contourDiv, { x: [[startX]], y: [[startY]] }, [4]); // start
    Plotly.restyle(contourDiv, { x: [lineX], y: [lineY] }, [1]); // trail line
    Plotly.restyle(contourDiv, { x: [trailX.slice()], y: [trailY.slice()] }, [2]); // trail dots

    // Arrow on 2D (annotation with arrowhead)
    const gx = dz_dx(posX, posY), gy = dz_dy(posX, posY);
    const gm = Math.sqrt(gx * gx + gy * gy);
    if (gm > 0.01 && !converged) {
      const s = 0.5;
      const tipX = posX - gx / gm * s;
      const tipY = posY - gy / gm * s;
      Plotly.relayout(contourDiv, {
        'annotations[1].ax': posX, 'annotations[1].ay': posY,
        'annotations[1].x': tipX, 'annotations[1].y': tipY,
        'annotations[1].opacity': 1
      });
    } else {
      Plotly.relayout(contourDiv, { 'annotations[1].opacity': 0 });
    }

    // 3D surface updates
    Plotly.restyle(surfaceDiv, {
      x: [[posX]], y: [[posY]], z: [[terrain(posX, posY) + 0.3]]
    }, [1]); // ball
    Plotly.restyle(surfaceDiv, {
      x: [lineX], y: [lineY], z: [lineZ]
    }, [2]); // trail

    updateAll();
  }

  function updateAll() {
    if (stepCountEl) stepCountEl.textContent = stepCount;
    if (heightEl) {
      const h = terrain(posX, posY);
      heightEl.textContent = h.toFixed(2);
      heightEl.style.color = h < -4 ? '#83C167' : h < 0 ? '#58C4DD' : '#FFFF00';
    }
  }

  // --- GD Step ---
  function doStep() {
    if (converged) return false;
    const gx = dz_dx(posX, posY), gy = dz_dy(posX, posY);
    const gm = Math.sqrt(gx * gx + gy * gy);
    if (gm < 0.01) {
      converged = true; stopAuto();
      if (statusEl) { statusEl.textContent = '¡Mínimo alcanzado!'; statusEl.style.color = '#83C167'; }
      return false;
    }
    trailX.push(posX); trailY.push(posY);
    posX -= LR * gx; posY -= LR * gy;
    posX = Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, posX));
    posY = Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, posY));
    stepCount++;
    syncAll();
    if (statusEl && !converged) { statusEl.textContent = 'Paso ' + stepCount; statusEl.style.color = '#ece6d0'; }
    return true;
  }

  function reset() {
    stopAuto();
    posX = startX; posY = startY;
    trailX = []; trailY = [];
    stepCount = 0; converged = false;
    syncAll();
    if (statusEl) { statusEl.textContent = 'Click en mapa o "Dar Paso"'; statusEl.style.color = '#ece6d0'; }
  }

  function toggleAuto() {
    if (autoInterval) { stopAuto(); return; }
    if (btnAuto) { btnAuto.textContent = '⏸ Pausa'; btnAuto.style.borderColor = '#FFFF00'; btnAuto.style.color = '#FFFF00'; }
    autoInterval = setInterval(() => { if (!doStep()) stopAuto(); }, 200);
  }
  function stopAuto() {
    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
    if (btnAuto) { btnAuto.textContent = '▶▶ Auto'; btnAuto.style.borderColor = '#58C4DD'; btnAuto.style.color = '#58C4DD'; }
  }

  if (btnStep) btnStep.addEventListener('click', () => { stopAuto(); doStep(); });
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (btnReset) btnReset.addEventListener('click', reset);
}

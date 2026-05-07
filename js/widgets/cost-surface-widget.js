// ============================================================
// Cost Surface Widget - 2D curve, 3D surface, contour
// ============================================================

// --- Helper: compute cost ---
function computeCost(x, y, w, b) {
  let cost = 0;
  for (let i = 0; i < x.length; i++) {
    const err = w * x[i] + b - y[i];
    cost += err * err;
  }
  return cost / (2 * x.length);
}

// ============================================================
// Mode 1: 2D Cost curve J(w) with b fixed
// ============================================================
function initCost2DWidget(data) {
  const lineCanvas = document.getElementById('cost2d-line-canvas');
  const curveCanvas = document.getElementById('cost2d-curve-canvas');
  if (!lineCanvas || !curveCanvas) return;

  const lineCtx = lineCanvas.getContext('2d');
  const curveCtx = curveCanvas.getContext('2d');
  const slider = document.getElementById('cost2d-w-slider');
  const wValEl = document.getElementById('cost2d-w-val');
  const jValEl = document.getElementById('cost2d-j-val');

  const xData = data.x, yData = data.y;
  const bFixed = 100;

  // Precompute cost curve
  const wMin = -100, wMax = 500, wSteps = 300;
  const costCurve = [];
  let maxCost = 0;
  for (let i = 0; i <= wSteps; i++) {
    const w = wMin + (wMax - wMin) * i / wSteps;
    const c = computeCost(xData, yData, w, bFixed);
    costCurve.push({ w: w, cost: c });
    if (c > maxCost) maxCost = c;
  }

  function draw() {
    const w = parseFloat(slider.value);
    const cost = computeCost(xData, yData, w, bFixed);

    // --- Left panel: scatter + line ---
    const W1 = lineCanvas.width, H1 = lineCanvas.height;
    lineCtx.fillStyle = '#0d0d1a';
    lineCtx.fillRect(0, 0, W1, H1);

    const ox1 = 40, oy1 = H1 - 30, pw1 = W1 - 55, ph1 = H1 - 50;
    const xMin = 0, xMax = 3, yMin = -100, yMax = 700;
    function tx1(v) { return ox1 + (v - xMin) / (xMax - xMin) * pw1; }
    function ty1(v) { return oy1 - (v - yMin) / (yMax - yMin) * ph1; }

    // Grid
    lineCtx.strokeStyle = 'rgba(255,255,255,0.06)'; lineCtx.lineWidth = 0.5;
    for (let xv = 0; xv <= 3; xv++) {
      lineCtx.beginPath(); lineCtx.moveTo(tx1(xv), oy1); lineCtx.lineTo(tx1(xv), oy1 - ph1); lineCtx.stroke();
    }

    // Axes
    lineCtx.strokeStyle = '#a8a290'; lineCtx.lineWidth = 1;
    lineCtx.beginPath(); lineCtx.moveTo(ox1, oy1 - ph1); lineCtx.lineTo(ox1, oy1); lineCtx.lineTo(ox1 + pw1, oy1); lineCtx.stroke();

    // Line
    lineCtx.strokeStyle = '#58C4DD'; lineCtx.lineWidth = 2;
    lineCtx.beginPath(); lineCtx.moveTo(tx1(xMin), ty1(w * xMin + bFixed)); lineCtx.lineTo(tx1(xMax), ty1(w * xMax + bFixed)); lineCtx.stroke();

    // Residuals + data
    for (let i = 0; i < xData.length; i++) {
      const px = tx1(xData[i]), py = ty1(yData[i]);
      const predY = ty1(w * xData[i] + bFixed);
      // Residual
      lineCtx.strokeStyle = '#9A72AC'; lineCtx.lineWidth = 1.5; lineCtx.setLineDash([3, 3]);
      lineCtx.beginPath(); lineCtx.moveTo(px, py); lineCtx.lineTo(px, predY); lineCtx.stroke();
      lineCtx.setLineDash([]);
      // Data point
      lineCtx.strokeStyle = '#FC6255'; lineCtx.lineWidth = 2;
      const s = 5;
      lineCtx.beginPath(); lineCtx.moveTo(px - s, py - s); lineCtx.lineTo(px + s, py + s); lineCtx.stroke();
      lineCtx.beginPath(); lineCtx.moveTo(px + s, py - s); lineCtx.lineTo(px - s, py + s); lineCtx.stroke();
    }

    // Title
    lineCtx.fillStyle = '#ece6d0'; lineCtx.font = '11px Fira Code, monospace'; lineCtx.textAlign = 'center';
    lineCtx.fillText(`f(x) = ${w}x + ${bFixed}`, W1 / 2, 15);

    // --- Right panel: J(w) curve ---
    const W2 = curveCanvas.width, H2 = curveCanvas.height;
    curveCtx.fillStyle = '#0d0d1a';
    curveCtx.fillRect(0, 0, W2, H2);

    const ox2 = 50, oy2 = H2 - 30, pw2 = W2 - 65, ph2 = H2 - 50;
    function tx2(v) { return ox2 + (v - wMin) / (wMax - wMin) * pw2; }
    function ty2(v) { return oy2 - (v / maxCost) * ph2; }

    // Grid
    curveCtx.strokeStyle = 'rgba(255,255,255,0.06)'; curveCtx.lineWidth = 0.5;
    for (let wv = 0; wv <= 500; wv += 100) {
      curveCtx.beginPath(); curveCtx.moveTo(tx2(wv), oy2); curveCtx.lineTo(tx2(wv), oy2 - ph2); curveCtx.stroke();
    }

    // Axes
    curveCtx.strokeStyle = '#a8a290'; curveCtx.lineWidth = 1;
    curveCtx.beginPath(); curveCtx.moveTo(ox2, oy2 - ph2); curveCtx.lineTo(ox2, oy2); curveCtx.lineTo(ox2 + pw2, oy2); curveCtx.stroke();

    // Labels
    curveCtx.fillStyle = '#a8a290'; curveCtx.font = '10px Fira Code, monospace';
    curveCtx.textAlign = 'center'; curveCtx.fillText('w', ox2 + pw2 / 2, oy2 + 20);
    curveCtx.save(); curveCtx.translate(12, oy2 - ph2 / 2); curveCtx.rotate(-Math.PI / 2);
    curveCtx.fillText('J(w)', 0, 0); curveCtx.restore();

    // Cost curve
    curveCtx.strokeStyle = '#58C4DD'; curveCtx.lineWidth = 2;
    curveCtx.beginPath();
    costCurve.forEach((pt, i) => {
      const px = tx2(pt.w), py = ty2(pt.cost);
      i === 0 ? curveCtx.moveTo(px, py) : curveCtx.lineTo(px, py);
    });
    curveCtx.stroke();

    // Current point on curve
    const dotX = tx2(w), dotY = ty2(cost);
    curveCtx.fillStyle = '#FC6255';
    curveCtx.beginPath(); curveCtx.arc(dotX, dotY, 6, 0, Math.PI * 2); curveCtx.fill();

    // Dashed lines
    curveCtx.strokeStyle = 'rgba(252, 98, 85, 0.3)'; curveCtx.setLineDash([4, 3]); curveCtx.lineWidth = 1;
    curveCtx.beginPath(); curveCtx.moveTo(dotX, oy2); curveCtx.lineTo(dotX, dotY); curveCtx.stroke();
    curveCtx.beginPath(); curveCtx.moveTo(ox2, dotY); curveCtx.lineTo(dotX, dotY); curveCtx.stroke();
    curveCtx.setLineDash([]);

    // Title
    curveCtx.fillStyle = '#ece6d0'; curveCtx.font = '11px Fira Code, monospace'; curveCtx.textAlign = 'center';
    curveCtx.fillText('J(w) con b=100', W2 / 2, 15);

    // Update display
    wValEl.textContent = w;
    jValEl.textContent = `J(${w},${bFixed}) = ${cost.toFixed(0)}`;
    jValEl.style.color = cost < 1 ? '#83C167' : '#FFFF00';
  }

  slider.addEventListener('input', draw);
  draw();
}

// ============================================================
// Mode 1b: Paraboloid (bowl) — clean J(w,b) = w² + b² surface
// with rainbow colorscale, points A (start) and B (minimum)
// ============================================================
function initParaboloidWidget() {
  const container = document.getElementById('paraboloid-plotly');
  if (!container) return;

  const N = 60;
  const range = 6;
  const wVals = [], bVals = [];
  for (let i = 0; i <= N; i++) {
    wVals.push(-range + 2 * range * i / N);
    bVals.push(-range + 2 * range * i / N);
  }

  // z = w² + b²  (clean paraboloid)
  const zGrid = [];
  for (let j = 0; j <= N; j++) {
    const row = [];
    for (let i = 0; i <= N; i++) {
      row.push(wVals[i] * wVals[i] + bVals[j] * bVals[j]);
    }
    zGrid.push(row);
  }

  // Surface
  const surface = {
    x: wVals,
    y: bVals,
    z: zGrid,
    type: 'surface',
    colorscale: [
      [0.0,  '#00008B'],
      [0.05, '#0000FF'],
      [0.15, '#0066FF'],
      [0.25, '#00CCFF'],
      [0.35, '#00FFAA'],
      [0.45, '#33FF33'],
      [0.55, '#99FF00'],
      [0.65, '#FFFF00'],
      [0.75, '#FFCC00'],
      [0.85, '#FF6600'],
      [0.95, '#FF0000'],
      [1.0,  '#CC0000']
    ],
    cmin: 0,
    cmax: 72,
    showscale: true,
    colorbar: {
      title: { text: 'Cost', font: { color: '#ece6d0', size: 12, family: 'Fira Code' } },
      tickfont: { color: '#a8a290', size: 10, family: 'Fira Code' },
      tickvals: [0, 10, 20, 30, 40, 50, 60, 70],
      len: 0.6,
      thickness: 15,
      x: 1.02
    },
    contours: {
      z: { show: true, usecolormap: true, highlightcolor: '#ffffff', project: { z: false } }
    },
    lighting: {
      ambient: 0.5,
      diffuse: 0.6,
      specular: 0.3,
      roughness: 0.5
    },
    opacity: 0.95,
    hoverinfo: 'skip'
  };

  // Point A — high cost (starting point)
  const aW = -4, aB = -4;
  const aCost = aW * aW + aB * aB;
  const pointA = {
    x: [aW], y: [aB], z: [aCost],
    type: 'scatter3d',
    mode: 'markers+text',
    marker: { size: 7, color: '#3366CC', symbol: 'circle',
              line: { color: '#000000', width: 1 } },
    text: ['A'],
    textposition: 'top left',
    textfont: { color: '#000000', size: 16, family: 'Fira Code, monospace', weight: 'bold' },
    showlegend: false,
    hoverinfo: 'text',
    hovertext: ['A: costo alto (' + aCost + ')']
  };

  // Point B — minimum (global minimum)
  const pointB = {
    x: [0], y: [0], z: [0],
    type: 'scatter3d',
    mode: 'markers+text',
    marker: { size: 8, color: '#FF0000', symbol: 'circle',
              line: { color: '#000000', width: 1 } },
    text: ['B'],
    textposition: 'bottom center',
    textfont: { color: '#000000', size: 16, family: 'Fira Code, monospace', weight: 'bold' },
    showlegend: false,
    hoverinfo: 'text',
    hovertext: ['B: mínimo global (0)']
  };

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: {
        title: { text: 'w', font: { color: '#ece6d0' } },
        range: [-range, range],
        color: '#a8a290',
        gridcolor: 'rgba(255,255,255,0.15)',
        zerolinecolor: 'rgba(255,255,255,0.3)',
        tickfont: { size: 10, color: '#a8a290' }
      },
      yaxis: {
        title: { text: 'b', font: { color: '#ece6d0' } },
        range: [-range, range],
        color: '#a8a290',
        gridcolor: 'rgba(255,255,255,0.15)',
        zerolinecolor: 'rgba(255,255,255,0.3)',
        tickfont: { size: 10, color: '#a8a290' }
      },
      zaxis: {
        title: { text: 'Cost', font: { color: '#ece6d0' } },
        range: [0, 72],
        color: '#a8a290',
        gridcolor: 'rgba(255,255,255,0.15)',
        zerolinecolor: 'rgba(255,255,255,0.3)',
        tickfont: { size: 10, color: '#a8a290' }
      },
      bgcolor: '#0d0d1a',
      camera: {
        eye: { x: 1.6, y: -1.8, z: 1.0 },
        up: { x: 0, y: 0, z: 1 }
      },
      aspectratio: { x: 1, y: 1, z: 0.7 }
    },
    margin: { l: 0, r: 30, t: 10, b: 10 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 10 }
  };

  Plotly.newPlot(container, [surface, pointA, pointB], layout, {
    responsive: true,
    displayModeBar: false
  });
}

// ============================================================
// Mode 2: 3D Surface with Plotly
// ============================================================
function initCost3DWidget(data) {
  const container = document.getElementById('cost3d-plotly');
  if (!container) return;

  const xData = data.x, yData = data.y;
  const wRange = { min: -200, max: 600, steps: 60 };
  const bRange = { min: -400, max: 700, steps: 60 };

  const wVals = [], bVals = [], costGrid = [];

  for (let i = 0; i <= wRange.steps; i++) {
    wVals.push(wRange.min + (wRange.max - wRange.min) * i / wRange.steps);
  }
  for (let j = 0; j <= bRange.steps; j++) {
    bVals.push(bRange.min + (bRange.max - bRange.min) * j / bRange.steps);
  }

  for (let j = 0; j <= bRange.steps; j++) {
    const row = [];
    for (let i = 0; i <= wRange.steps; i++) {
      row.push(computeCost(xData, yData, wVals[i], bVals[j]));
    }
    costGrid.push(row);
  }

  const trace = {
    x: wVals,
    y: bVals,
    z: costGrid,
    type: 'surface',
    colorscale: [
      [0, '#58C4DD'],
      [0.3, '#5CD0B3'],
      [0.5, '#83C167'],
      [0.7, '#FF862F'],
      [1.0, '#FC6255']
    ],
    contours: {
      z: { show: true, usecolormap: true, highlightcolor: '#ece6d0', project: { z: false } }
    },
    showscale: false
  };

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: { title: 'w', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
      yaxis: { title: 'b', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
      zaxis: { title: 'J(w,b)', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
      bgcolor: '#0d0d1a',
      camera: { eye: { x: 1.8, y: -1.5, z: 1.2 } }
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 10 }
  };

  Plotly.newPlot(container, [trace], layout, {
    responsive: true,
    displayModeBar: false
  });
}

// ============================================================
// Mode 3: Contour Plot with click interaction
// ============================================================
function initContourWidget(data) {
  const container = document.getElementById('contour-plotly');
  const lineCanvas = document.getElementById('contour-line-canvas');
  if (!container || !lineCanvas) return;

  const lineCtx = lineCanvas.getContext('2d');
  const paramsEl = document.getElementById('contour-params');
  const costEl = document.getElementById('contour-cost');

  const xData = data.x, yData = data.y;
  const wRange = { min: -200, max: 600, steps: 80 };
  const bRange = { min: -400, max: 700, steps: 80 };

  const wVals = [], bVals = [], costGrid = [];
  for (let i = 0; i <= wRange.steps; i++) {
    wVals.push(wRange.min + (wRange.max - wRange.min) * i / wRange.steps);
  }
  for (let j = 0; j <= bRange.steps; j++) {
    bVals.push(bRange.min + (bRange.max - bRange.min) * j / bRange.steps);
  }
  for (let j = 0; j <= bRange.steps; j++) {
    const row = [];
    for (let i = 0; i <= wRange.steps; i++) {
      row.push(computeCost(xData, yData, wVals[i], bVals[j]));
    }
    costGrid.push(row);
  }

  const trace = {
    x: wVals,
    y: bVals,
    z: costGrid,
    type: 'contour',
    colorscale: [
      [0, '#1b1b2f'],
      [0.1, '#58C4DD'],
      [0.3, '#5CD0B3'],
      [0.5, '#83C167'],
      [0.7, '#FF862F'],
      [1.0, '#FC6255']
    ],
    contours: { coloring: 'heatmap', showlabels: true },
    showscale: false,
    ncontours: 20
  };

  const markerTrace = {
    x: [200],
    y: [100],
    type: 'scatter',
    mode: 'markers',
    marker: { size: 12, color: '#FFFF00', symbol: 'star' },
    showlegend: false,
    name: 'selección'
  };

  // Compute analytical minimum: w* and b* via normal equations
  const n = xData.length;
  const sumX = xData.reduce((a,b) => a+b, 0);
  const sumY = yData.reduce((a,b) => a+b, 0);
  const sumXY = xData.reduce((a,v,i) => a + v*yData[i], 0);
  const sumX2 = xData.reduce((a,v) => a + v*v, 0);
  const wOpt = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const bOpt = (sumY - wOpt * sumX) / n;

  const minMarkerTrace = {
    x: [wOpt],
    y: [bOpt],
    type: 'scatter',
    mode: 'markers+text',
    marker: { size: 14, color: '#83C167', symbol: 'diamond', line: { color: '#fff', width: 2 } },
    text: ['Mínimo'],
    textposition: 'top center',
    textfont: { color: '#83C167', size: 11, family: 'Fira Code' },
    showlegend: false,
    name: 'mínimo'
  };

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: '#0d0d1a',
    xaxis: { title: 'w', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
    yaxis: { title: 'b', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
    margin: { l: 50, r: 10, t: 25, b: 40 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 10 },
    annotations: [{
      x: wOpt, y: bOpt,
      xref: 'x', yref: 'y',
      text: 'w*=' + wOpt.toFixed(0) + ', b*=' + bOpt.toFixed(0),
      showarrow: true,
      arrowhead: 2,
      arrowcolor: '#83C167',
      ax: 60, ay: -40,
      font: { color: '#83C167', size: 10, family: 'Fira Code' },
      bgcolor: 'rgba(13,13,26,0.8)',
      bordercolor: '#83C167',
      borderwidth: 1,
      borderpad: 3
    }]
  };

  Plotly.newPlot(container, [trace, minMarkerTrace, markerTrace], layout, {
    responsive: true,
    displayModeBar: false
  });

  let currentW = 200, currentB = 100;

  function drawLine(w, b) {
    const W = lineCanvas.width, H = lineCanvas.height;
    lineCtx.fillStyle = '#0d0d1a';
    lineCtx.fillRect(0, 0, W, H);

    const ox = 35, oy = H - 25, pw = W - 50, ph = H - 40;
    const xMin = 0.5, xMax = 3.5, yMin = 100, yMax = 800;
    function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
    function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

    // Axes
    lineCtx.strokeStyle = '#a8a290'; lineCtx.lineWidth = 1;
    lineCtx.beginPath(); lineCtx.moveTo(ox, oy - ph); lineCtx.lineTo(ox, oy); lineCtx.lineTo(ox + pw, oy); lineCtx.stroke();

    // Line
    lineCtx.strokeStyle = '#58C4DD'; lineCtx.lineWidth = 2;
    lineCtx.beginPath(); lineCtx.moveTo(tx(xMin), ty(w * xMin + b)); lineCtx.lineTo(tx(xMax), ty(w * xMax + b)); lineCtx.stroke();

    // Data points
    for (let i = 0; i < xData.length; i++) {
      lineCtx.strokeStyle = '#FC6255'; lineCtx.lineWidth = 2;
      const px = tx(xData[i]), py = ty(yData[i]);
      const s = 4;
      lineCtx.beginPath(); lineCtx.moveTo(px - s, py - s); lineCtx.lineTo(px + s, py + s); lineCtx.stroke();
      lineCtx.beginPath(); lineCtx.moveTo(px + s, py - s); lineCtx.lineTo(px - s, py + s); lineCtx.stroke();
    }

    const cost = computeCost(xData, yData, w, b);
    paramsEl.textContent = `w=${w.toFixed(0)}, b=${b.toFixed(0)}`;
    costEl.textContent = `J = ${cost.toFixed(0)}`;
    costEl.style.color = cost < 10 ? '#83C167' : '#FFFF00';
  }

  // Click handler
  container.on('plotly_click', function(eventData) {
    if (eventData.points && eventData.points.length > 0) {
      const pt = eventData.points[0];
      currentW = pt.x;
      currentB = pt.y;
      // Update marker
      Plotly.restyle(container, { x: [[currentW]], y: [[currentB]] }, [2]);
      drawLine(currentW, currentB);
    }
  });

  drawLine(currentW, currentB);
}

// ============================================================
// Mode 4: Comprehensive view — contour + 3D + data + regression
// Click on contour → updates all 3 views synchronously
// ============================================================
function initComprehensiveWidget(data) {
  const contourDiv = document.getElementById('comp-contour');
  const surfaceDiv = document.getElementById('comp-surface');
  const scatterDiv = document.getElementById('comp-scatter');
  const infoEl = document.getElementById('comp-info');
  if (!contourDiv || !surfaceDiv || !scatterDiv) return;

  const xData = data.x, yData = data.y;

  // Compute optimal w,b
  const nn = xData.length;
  const sumX = xData.reduce((a,b) => a+b, 0);
  const sumY = yData.reduce((a,b) => a+b, 0);
  const sumXY = xData.reduce((a,v,i) => a + v*yData[i], 0);
  const sumX2 = xData.reduce((a,v) => a + v*v, 0);
  const wOpt = (nn * sumXY - sumX * sumY) / (nn * sumX2 - sumX * sumX);
  const bOpt = (sumY - wOpt * sumX) / nn;
  const jMin = computeCost(xData, yData, wOpt, bOpt);

  // --- Build cost grid ---
  const wRange = { min: -200, max: 600, steps: 60 };
  const bRange = { min: -400, max: 700, steps: 60 };
  const wVals = [], bVals = [], costGrid = [];
  for (let i = 0; i <= wRange.steps; i++) {
    wVals.push(wRange.min + (wRange.max - wRange.min) * i / wRange.steps);
  }
  for (let j = 0; j <= bRange.steps; j++) {
    bVals.push(bRange.min + (bRange.max - bRange.min) * j / bRange.steps);
  }
  for (let j = 0; j <= bRange.steps; j++) {
    const row = [];
    for (let i = 0; i <= wRange.steps; i++) {
      row.push(computeCost(xData, yData, wVals[i], bVals[j]));
    }
    costGrid.push(row);
  }

  const darkLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: '#0d0d1a',
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 9 }
  };

  let curW = wOpt, curB = bOpt;

  // --- 1. Contour Plot ---
  const contourTrace = {
    x: wVals, y: bVals, z: costGrid,
    type: 'contour',
    colorscale: [[0,'#1b1b2f'],[0.1,'#58C4DD'],[0.3,'#5CD0B3'],[0.5,'#83C167'],[0.7,'#FF862F'],[1.0,'#FC6255']],
    contours: { coloring: 'heatmap' },
    showscale: false, ncontours: 20
  };
  // Fixed minimum marker (green diamond)
  const contourMinTrace = {
    x: [wOpt], y: [bOpt],
    type: 'scatter', mode: 'markers',
    marker: { size: 10, color: '#83C167', symbol: 'diamond', line: { color: '#fff', width: 1.5 } },
    showlegend: false, hoverinfo: 'skip'
  };
  // Movable selection marker (yellow star)
  const contourSelTrace = {
    x: [curW], y: [curB],
    type: 'scatter', mode: 'markers',
    marker: { size: 12, color: '#FFFF00', symbol: 'star', line: { color: '#fff', width: 1 } },
    showlegend: false, hoverinfo: 'skip'
  };
  Plotly.newPlot(contourDiv, [contourTrace, contourMinTrace, contourSelTrace], {
    ...darkLayout,
    xaxis: { title: 'w', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
    yaxis: { title: 'b', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)' },
    margin: { l: 45, r: 5, t: 5, b: 35 }
  }, { responsive: true, displayModeBar: false });

  // --- 2. 3D Surface ---
  const surfaceTrace = {
    x: wVals, y: bVals, z: costGrid,
    type: 'surface',
    colorscale: [[0,'#1b1b2f'],[0.1,'#58C4DD'],[0.3,'#5CD0B3'],[0.5,'#83C167'],[0.7,'#FF862F'],[1.0,'#FC6255']],
    showscale: false, opacity: 0.85,
    contours: {
      z: { show: true, usecolormap: true, highlightcolor: '#ece6d0', project: { z: false } }
    }
  };
  // Fixed minimum on surface
  const surfaceMinTrace = {
    x: [wOpt], y: [bOpt], z: [jMin],
    type: 'scatter3d', mode: 'markers',
    marker: { size: 5, color: '#83C167', symbol: 'diamond' },
    showlegend: false, hoverinfo: 'skip'
  };
  // Movable selection on surface
  const surfaceSelTrace = {
    x: [curW], y: [curB], z: [jMin],
    type: 'scatter3d', mode: 'markers',
    marker: { size: 6, color: '#FFFF00', symbol: 'circle' },
    showlegend: false, hoverinfo: 'skip'
  };
  Plotly.newPlot(surfaceDiv, [surfaceTrace, surfaceMinTrace, surfaceSelTrace], {
    ...darkLayout,
    scene: {
      xaxis: { title: 'w', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)', backgroundcolor: '#0d0d1a' },
      yaxis: { title: 'b', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)', backgroundcolor: '#0d0d1a' },
      zaxis: { title: 'J(w,b)', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)', backgroundcolor: '#0d0d1a' },
      camera: { eye: { x: 1.8, y: -1.5, z: 1.2 } },
      bgcolor: '#0d0d1a'
    },
    margin: { l: 0, r: 0, t: 0, b: 0 }
  }, { responsive: true, displayModeBar: false });

  // --- 3. Scatter + Regression Line ---
  const scatterTrace = {
    x: xData, y: yData,
    type: 'scatter', mode: 'markers',
    marker: { size: 10, color: '#FC6255', symbol: 'x', line: { width: 2 } },
    showlegend: false
  };
  const xLine = [0.5, 3.7];
  const lineTrace = {
    x: xLine, y: [curW * 0.5 + curB, curW * 3.7 + curB],
    type: 'scatter', mode: 'lines',
    line: { color: '#58C4DD', width: 3 },
    showlegend: false
  };
  Plotly.newPlot(scatterDiv, [scatterTrace, lineTrace], {
    ...darkLayout,
    xaxis: { title: 'Tamaño (x1000 ft²)', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)', range: [0.3, 3.7] },
    yaxis: { title: 'Precio ($k)', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.1)', range: [-200, 900] },
    margin: { l: 50, r: 10, t: 5, b: 40 },
    annotations: [{
      x: 2.8, y: curW * 2.8 + curB + 50,
      text: 'f(x) = ' + curW.toFixed(0) + 'x + ' + curB.toFixed(0),
      showarrow: false,
      font: { color: '#58C4DD', size: 10, family: 'Fira Code' },
      bgcolor: 'rgba(13,13,26,0.7)'
    }]
  }, { responsive: true, displayModeBar: false });

  // --- Update info text ---
  function updateInfo(w, b) {
    if (!infoEl) return;
    const cost = computeCost(xData, yData, w, b);
    infoEl.innerHTML =
      '<span style="color:#FFFF00;">w=' + w.toFixed(1) + ', b=' + b.toFixed(1) + '</span>' +
      ' &nbsp;|&nbsp; <span style="color:' + (cost < jMin + 100 ? '#83C167' : '#FF862F') + ';">J = ' + cost.toFixed(0) + '</span>' +
      ' &nbsp;|&nbsp; <span style="color:#83C167;">J_mín = ' + jMin.toFixed(0) + '</span>';
  }
  updateInfo(curW, curB);

  // --- Sync all views on contour click ---
  contourDiv.on('plotly_click', function(eventData) {
    if (!eventData.points || eventData.points.length === 0) return;
    const pt = eventData.points[0];
    curW = pt.x;
    curB = pt.y;
    const curJ = computeCost(xData, yData, curW, curB);

    // 1. Update contour selection marker (trace index 2)
    Plotly.restyle(contourDiv, { x: [[curW]], y: [[curB]] }, [2]);

    // 2. Update 3D surface selection marker (trace index 2)
    Plotly.restyle(surfaceDiv, { x: [[curW]], y: [[curB]], z: [[curJ]] }, [2]);

    // 3. Update regression line + annotation on scatter
    const newYLine = [curW * 0.5 + curB, curW * 3.7 + curB];
    Plotly.restyle(scatterDiv, { y: [newYLine] }, [1]);
    Plotly.relayout(scatterDiv, {
      annotations: [{
        x: 2.8, y: curW * 2.8 + curB + 50,
        text: 'f(x) = ' + curW.toFixed(0) + 'x + ' + curB.toFixed(0),
        showarrow: false,
        font: { color: '#58C4DD', size: 10, family: 'Fira Code' },
        bgcolor: 'rgba(13,13,26,0.7)'
      }]
    });

    // 4. Update info text
    updateInfo(curW, curB);
  });
}

// ============================================================
// Mode 6: Plane Regression 3D
// Shows 2-feature regression as a 3D plane (rotatable)
// Uses size + bedrooms → price from HOUSING.multi
// ============================================================
function initPlaneRegressionWidget(data) {
  const container = document.getElementById('plane-regression-plotly');
  if (!container) return;

  // Extract 2 features: size (col 0) and bedrooms (col 1) → price
  const X = data.X;
  const y = data.y;
  const x1 = X.map(r => r[0]); // size (1000 sqft)
  const x2 = X.map(r => r[1]); // bedrooms

  // Simple least squares for 2 features + bias
  // f(x1,x2) = w1*x1 + w2*x2 + b
  const m = x1.length;
  let sx1 = 0, sx2 = 0, sy = 0, sx1x1 = 0, sx2x2 = 0, sx1x2 = 0, sx1y = 0, sx2y = 0;
  for (let i = 0; i < m; i++) {
    sx1 += x1[i]; sx2 += x2[i]; sy += y[i];
    sx1x1 += x1[i]*x1[i]; sx2x2 += x2[i]*x2[i]; sx1x2 += x1[i]*x2[i];
    sx1y += x1[i]*y[i]; sx2y += x2[i]*y[i];
  }
  // Solve 3x3 normal equation: [m, sx1, sx2; sx1, sx1x1, sx1x2; sx2, sx1x2, sx2x2] * [b,w1,w2]^T = [sy,sx1y,sx2y]^T
  // Use Cramer's rule for 3x3
  const A = [
    [m, sx1, sx2],
    [sx1, sx1x1, sx1x2],
    [sx2, sx1x2, sx2x2]
  ];
  const B = [sy, sx1y, sx2y];
  function det3(M) {
    return M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])
         - M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])
         + M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
  }
  function replaceCol(M, col, v) {
    return M.map((row, i) => row.map((val, j) => j === col ? v[i] : val));
  }
  const D = det3(A);
  const b = det3(replaceCol(A, 0, B)) / D;
  const w1 = det3(replaceCol(A, 1, B)) / D;
  const w2 = det3(replaceCol(A, 2, B)) / D;

  // Generate plane surface
  const x1Min = 0.5, x1Max = 3.0;
  const x2Min = 1, x2Max = 6;
  const N = 20;
  const x1Vals = [], x2Vals = [];
  for (let i = 0; i <= N; i++) {
    x1Vals.push(x1Min + (x1Max - x1Min) * i / N);
    x2Vals.push(x2Min + (x2Max - x2Min) * i / N);
  }
  const zPlane = [];
  for (let j = 0; j <= N; j++) {
    const row = [];
    for (let i = 0; i <= N; i++) {
      row.push(w1 * x1Vals[i] + w2 * x2Vals[j] + b);
    }
    zPlane.push(row);
  }

  // Data points
  const points = {
    x: x1, y: x2, z: y,
    type: 'scatter3d',
    mode: 'markers',
    marker: {
      size: 7,
      color: '#FFFF00',
      line: { color: '#FF862F', width: 1 },
      opacity: 1
    },
    name: 'Datos',
    hovertemplate: 'Tamaño: %{x:.2f}<br>Habitaciones: %{y}<br>Precio: $%{z}k<extra></extra>'
  };

  // Vertical lines from points to plane (residuals)
  const residualLines = {
    x: [], y: [], z: [],
    type: 'scatter3d',
    mode: 'lines',
    line: { color: 'rgba(252,98,85,0.5)', width: 2 },
    name: 'Residuos',
    hoverinfo: 'skip',
    showlegend: false
  };
  for (let i = 0; i < m; i++) {
    const pred = w1 * x1[i] + w2 * x2[i] + b;
    residualLines.x.push(x1[i], x1[i], null);
    residualLines.y.push(x2[i], x2[i], null);
    residualLines.z.push(y[i], pred, null);
  }

  // Plane surface
  const surface = {
    x: x1Vals, y: x2Vals, z: zPlane,
    type: 'surface',
    colorscale: [[0, 'rgba(88,196,221,0.6)'], [1, 'rgba(88,196,221,0.6)']],
    showscale: false,
    opacity: 0.55,
    name: 'Plano: f(x₁,x₂)',
    hovertemplate: 'f(%{x:.1f}, %{y:.0f}) = $%{z:.0f}k<extra></extra>',
    contours: {
      x: { show: true, color: 'rgba(88,196,221,0.2)', width: 1 },
      y: { show: true, color: 'rgba(88,196,221,0.2)', width: 1 },
      z: { show: false }
    },
    lighting: { ambient: 0.7, diffuse: 0.5, specular: 0.1 }
  };

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: {
        title: { text: 'Tamaño (1000 sqft)', font: { color: '#58C4DD', size: 11 } },
        color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)',
        zerolinecolor: 'rgba(255,255,255,0.1)'
      },
      yaxis: {
        title: { text: 'Habitaciones', font: { color: '#FF862F', size: 11 } },
        color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)',
        zerolinecolor: 'rgba(255,255,255,0.1)'
      },
      zaxis: {
        title: { text: 'Precio ($k)', font: { color: '#83C167', size: 11 } },
        color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)',
        zerolinecolor: 'rgba(255,255,255,0.1)'
      },
      bgcolor: '#0d0d1a',
      camera: { eye: { x: 1.8, y: -1.6, z: 0.9 }, up: { x: 0, y: 0, z: 1 } },
      aspectratio: { x: 1, y: 0.8, z: 0.7 }
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 10 },
    showlegend: false
  };

  Plotly.newPlot(container, [surface, residualLines, points], layout, {
    responsive: true,
    displayModeBar: false
  });
}

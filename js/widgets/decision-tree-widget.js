// ============================================================
// Decision Tree Interactive Widget
// Scatter plot 2D con regiones de decisión rectangulares
// Slider max_depth (1-5) que redibuja las regiones
// ============================================================

function initDecisionTreeWidget() {
  const canvas = document.getElementById('decision-tree-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slider = document.getElementById('dt-depth-slider');
  const depthVal = document.getElementById('dt-depth-value');
  const metricSelect = document.getElementById('dt-metric-select');

  // Dataset: patrón tipo "tablero de ajedrez" parcial para que cada nivel
  // de profundidad genere splits visibles (depth 1→5 todos útiles)
  const points = [
    // Class 0 (blue) — cluster inferior-izquierdo
    { x: 0.5, y: 0.8, label: 0 }, { x: 1.0, y: 0.5, label: 0 },
    { x: 0.8, y: 1.3, label: 0 }, { x: 1.4, y: 0.9, label: 0 },
    { x: 0.3, y: 0.3, label: 0 },
    // Class 0 — cluster superior-derecho
    { x: 4.2, y: 4.5, label: 0 }, { x: 4.8, y: 4.0, label: 0 },
    { x: 4.5, y: 4.8, label: 0 }, { x: 5.0, y: 4.3, label: 0 },
    { x: 4.0, y: 5.0, label: 0 },
    // Class 0 — puntos dispersos zona central
    { x: 2.5, y: 2.8, label: 0 }, { x: 2.0, y: 3.5, label: 0 },
    { x: 3.0, y: 2.2, label: 0 },
    // Class 1 (red) — cluster superior-izquierdo
    { x: 0.5, y: 4.5, label: 1 }, { x: 1.0, y: 4.8, label: 1 },
    { x: 0.8, y: 4.0, label: 1 }, { x: 1.5, y: 4.3, label: 1 },
    { x: 0.3, y: 5.0, label: 1 },
    // Class 1 — cluster inferior-derecho
    { x: 4.5, y: 0.8, label: 1 }, { x: 4.0, y: 1.2, label: 1 },
    { x: 5.0, y: 0.5, label: 1 }, { x: 4.8, y: 1.5, label: 1 },
    { x: 4.2, y: 0.3, label: 1 },
    // Class 1 — puntos dispersos zona central
    { x: 2.8, y: 3.5, label: 1 }, { x: 3.5, y: 2.8, label: 1 },
    { x: 2.2, y: 2.2, label: 1 }, { x: 3.2, y: 3.2, label: 1 },
    // Puntos extra en bordes para forzar splits finos
    { x: 1.8, y: 2.5, label: 0 }, { x: 3.8, y: 3.0, label: 1 },
    { x: 2.5, y: 4.5, label: 1 }, { x: 3.5, y: 0.8, label: 1 },
  ];

  const xMin = 0, xMax = 5.5, yMin = 0, yMax = 5.5;

  const pad = { left: 45, right: 15, top: 15, bottom: 35 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  function tx(v) { return pad.left + (v - xMin) / (xMax - xMin) * plotW; }
  function ty(v) { return pad.top + plotH - (v - yMin) / (yMax - yMin) * plotH; }

  // Gini impurity
  function gini(labels) {
    if (labels.length === 0) return 0;
    const counts = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    let imp = 1;
    Object.values(counts).forEach(c => {
      const p = c / labels.length;
      imp -= p * p;
    });
    return imp;
  }

  // Entropy
  function entropy(labels) {
    if (labels.length === 0) return 0;
    const counts = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    let ent = 0;
    Object.values(counts).forEach(c => {
      const p = c / labels.length;
      if (p > 0) ent -= p * Math.log2(p);
    });
    return ent;
  }

  // Build a decision tree (axis-aligned splits)
  function buildTree(pts, depth, maxDepth, metricFn) {
    const labels = pts.map(p => p.label);
    const uniqueLabels = [...new Set(labels)];

    // Leaf conditions
    if (depth >= maxDepth || uniqueLabels.length <= 1 || pts.length <= 1) {
      // Majority vote
      const counts = {};
      labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
      let maxCount = 0, majorityLabel = 0;
      Object.entries(counts).forEach(([l, c]) => {
        if (c > maxCount) { maxCount = c; majorityLabel = parseInt(l); }
      });
      return { leaf: true, label: majorityLabel, count: pts.length, impurity: metricFn(labels) };
    }

    // Find best split
    let bestGain = -Infinity, bestFeature = 0, bestThreshold = 0;
    const parentImpurity = metricFn(labels);

    for (const feature of ['x', 'y']) {
      const values = [...new Set(pts.map(p => p[feature]))].sort((a, b) => a - b);
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const leftPts = pts.filter(p => p[feature] <= threshold);
        const rightPts = pts.filter(p => p[feature] > threshold);
        if (leftPts.length === 0 || rightPts.length === 0) continue;

        const leftImp = metricFn(leftPts.map(p => p.label));
        const rightImp = metricFn(rightPts.map(p => p.label));
        const weightedImp = (leftPts.length * leftImp + rightPts.length * rightImp) / pts.length;
        const gain = parentImpurity - weightedImp;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }

    if (bestGain <= 0) {
      const counts = {};
      labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
      let maxCount = 0, majorityLabel = 0;
      Object.entries(counts).forEach(([l, c]) => {
        if (c > maxCount) { maxCount = c; majorityLabel = parseInt(l); }
      });
      return { leaf: true, label: majorityLabel, count: pts.length, impurity: metricFn(labels) };
    }

    const leftPts = pts.filter(p => p[bestFeature] <= bestThreshold);
    const rightPts = pts.filter(p => p[bestFeature] > bestThreshold);

    return {
      leaf: false,
      feature: bestFeature,
      threshold: bestThreshold,
      impurity: parentImpurity,
      gain: bestGain,
      count: pts.length,
      left: buildTree(leftPts, depth + 1, maxDepth, metricFn),
      right: buildTree(rightPts, depth + 1, maxDepth, metricFn)
    };
  }

  // Predict for a point using the tree
  function predict(tree, px, py) {
    if (tree.leaf) return tree.label;
    const val = tree.feature === 'x' ? px : py;
    if (val <= tree.threshold) return predict(tree.left, px, py);
    return predict(tree.right, px, py);
  }

  // Collect split lines from tree (for drawing)
  function collectSplits(tree, bounds, splits) {
    if (tree.leaf) return;
    splits.push({
      feature: tree.feature,
      threshold: tree.threshold,
      bounds: { ...bounds }
    });
    // Left child bounds
    const leftBounds = { ...bounds };
    if (tree.feature === 'x') leftBounds.xMax = tree.threshold;
    else leftBounds.yMax = tree.threshold;
    collectSplits(tree.left, leftBounds, splits);
    // Right child bounds
    const rightBounds = { ...bounds };
    if (tree.feature === 'x') rightBounds.xMin = tree.threshold;
    else rightBounds.yMin = tree.threshold;
    collectSplits(tree.right, rightBounds, splits);
  }

  function draw() {
    const maxDepth = parseInt(slider.value);
    depthVal.textContent = maxDepth;

    const metricName = metricSelect ? metricSelect.value : 'gini';
    const metricFn = metricName === 'entropy' ? entropy : gini;

    const tree = buildTree(points, 0, maxDepth, metricFn);

    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Draw decision regions as colored background
    const step = 3;
    for (let px = pad.left; px < pad.left + plotW; px += step) {
      for (let py = pad.top; py < pad.top + plotH; py += step) {
        const dataX = xMin + (px - pad.left) / plotW * (xMax - xMin);
        const dataY = yMax - (py - pad.top) / plotH * (yMax - yMin);
        const pred = predict(tree, dataX, dataY);
        ctx.fillStyle = pred === 0 ? 'rgba(88, 196, 221, 0.15)' : 'rgba(252, 98, 85, 0.15)';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Draw split lines
    const splits = [];
    collectSplits(tree, { xMin, xMax, yMin, yMax }, splits);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    splits.forEach(s => {
      if (s.feature === 'x') {
        const y1 = Math.max(s.bounds.yMin, yMin);
        const y2 = Math.min(s.bounds.yMax, yMax);
        ctx.beginPath();
        ctx.moveTo(tx(s.threshold), ty(y1));
        ctx.lineTo(tx(s.threshold), ty(y2));
        ctx.stroke();
      } else {
        const x1 = Math.max(s.bounds.xMin, xMin);
        const x2 = Math.min(s.bounds.xMax, xMax);
        ctx.beginPath();
        ctx.moveTo(tx(x1), ty(s.threshold));
        ctx.lineTo(tx(x2), ty(s.threshold));
        ctx.stroke();
      }
    });
    ctx.setLineDash([]);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      ctx.beginPath(); ctx.moveTo(tx(gx), pad.top); ctx.lineTo(tx(gx), pad.top + plotH); ctx.stroke();
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      ctx.beginPath(); ctx.moveTo(pad.left, ty(gy)); ctx.lineTo(pad.left + plotW, ty(gy)); ctx.stroke();
    }

    // Draw points
    points.forEach(p => {
      const px = tx(p.x), py = ty(p.y);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? '#58C4DD' : '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#ece6d0';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axes labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '12px Fira Code, monospace';
    ctx.fillText('x₁', pad.left + plotW / 2, H - 5);
    ctx.save();
    ctx.translate(12, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂', 0, 0);
    ctx.restore();

    // Tick labels
    ctx.font = '10px Fira Code, monospace';
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      ctx.fillText(gx, tx(gx) - 3, pad.top + plotH + 14);
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      ctx.fillText(gy, pad.left - 18, ty(gy) + 4);
    }

    // Count correct
    let correct = 0;
    points.forEach(p => {
      if (predict(tree, p.x, p.y) === p.label) correct++;
    });
    const acc = (correct / points.length * 100).toFixed(0);

    // Info text
    ctx.fillStyle = '#ece6d0';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillText('Accuracy: ' + acc + '% (' + correct + '/' + points.length + ')', pad.left + 5, pad.top + 15);
    ctx.fillText('Splits: ' + splits.length, pad.left + 5, pad.top + 30);
  }

  slider.addEventListener('input', draw);
  if (metricSelect) metricSelect.addEventListener('change', draw);
  draw();
}

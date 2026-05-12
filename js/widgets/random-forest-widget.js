// ============================================================
// Random Forest Interactive Widget
// Muestra múltiples mini-árboles y su votación
// Slider para n_estimators (1-9)
// ============================================================

function initRandomForestWidget() {
  const canvas = document.getElementById('random-forest-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slider = document.getElementById('rf-n-slider');
  const nVal = document.getElementById('rf-n-value');

  // Dataset: mismo patrón "tablero de ajedrez" que decision-tree-widget
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
    // Puntos extra en bordes
    { x: 1.8, y: 2.5, label: 0 }, { x: 3.8, y: 3.0, label: 1 },
    { x: 2.5, y: 4.5, label: 1 }, { x: 3.5, y: 0.8, label: 1 },
  ];

  const xMin = 0, xMax = 5.5, yMin = 0, yMax = 5.5;

  // Seeded random for reproducibility
  let seed = 42;
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // Gini impurity
  function gini(labels) {
    if (labels.length === 0) return 0;
    const counts = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    let imp = 1;
    Object.values(counts).forEach(c => { const p = c / labels.length; imp -= p * p; });
    return imp;
  }

  // Bootstrap sample
  function bootstrapSample(data) {
    const sample = [];
    const oob = new Set(data.map((_, i) => i));
    for (let i = 0; i < data.length; i++) {
      const idx = Math.floor(seededRandom() * data.length);
      sample.push(data[idx]);
      oob.delete(idx);
    }
    return { sample, oobIndices: [...oob] };
  }

  // Build decision tree (max_depth=3, random feature subset at each node)
  function buildTree(pts, depth, maxDepth) {
    const labels = pts.map(p => p.label);
    const uniqueLabels = [...new Set(labels)];

    if (depth >= maxDepth || uniqueLabels.length <= 1 || pts.length <= 2) {
      const counts = {};
      labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
      let maxCount = 0, majorityLabel = 0;
      Object.entries(counts).forEach(([l, c]) => {
        if (c > maxCount) { maxCount = c; majorityLabel = parseInt(l); }
      });
      return { leaf: true, label: majorityLabel };
    }

    // Random feature selection (pick 1 of 2 features — sqrt(2) ≈ 1)
    const features = seededRandom() < 0.5 ? ['x'] : ['y'];
    // With some probability use both
    if (seededRandom() < 0.3) features.push(features[0] === 'x' ? 'y' : 'x');

    let bestGain = -Infinity, bestFeature = 'x', bestThreshold = 0;
    const parentGini = gini(labels);

    for (const feature of features) {
      const values = [...new Set(pts.map(p => p[feature]))].sort((a, b) => a - b);
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const leftPts = pts.filter(p => p[feature] <= threshold);
        const rightPts = pts.filter(p => p[feature] > threshold);
        if (leftPts.length === 0 || rightPts.length === 0) continue;
        const wGini = (leftPts.length * gini(leftPts.map(p => p.label)) +
                       rightPts.length * gini(rightPts.map(p => p.label))) / pts.length;
        const gain = parentGini - wGini;
        if (gain > bestGain) {
          bestGain = gain; bestFeature = feature; bestThreshold = threshold;
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
      return { leaf: true, label: majorityLabel };
    }

    return {
      leaf: false,
      feature: bestFeature,
      threshold: bestThreshold,
      left: buildTree(pts.filter(p => p[bestFeature] <= bestThreshold), depth + 1, maxDepth),
      right: buildTree(pts.filter(p => p[bestFeature] > bestThreshold), depth + 1, maxDepth)
    };
  }

  function predictTree(tree, px, py) {
    if (tree.leaf) return tree.label;
    const val = tree.feature === 'x' ? px : py;
    return val <= tree.threshold ? predictTree(tree.left, px, py) : predictTree(tree.right, px, py);
  }

  // Build all trees (pre-computed for all n_estimators up to 9)
  function buildForest(nTrees) {
    seed = 42; // Reset seed for reproducibility
    const trees = [];
    const oobSets = [];
    for (let t = 0; t < nTrees; t++) {
      const { sample, oobIndices } = bootstrapSample(points);
      trees.push(buildTree(sample, 0, 3));
      oobSets.push(oobIndices);
    }
    return { trees, oobSets };
  }

  // Ensemble prediction (majority vote)
  function predictForest(trees, px, py) {
    let votes = [0, 0];
    trees.forEach(tree => {
      votes[predictTree(tree, px, py)]++;
    });
    return votes[1] > votes[0] ? 1 : 0;
  }

  function draw() {
    const nTrees = parseInt(slider.value);
    nVal.textContent = nTrees;

    const { trees, oobSets } = buildForest(nTrees);

    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Layout: left = main plot, right = mini tree panels
    const mainW = 380, mainH = H - 10;
    const mainLeft = 5, mainTop = 5;
    const panelLeft = mainLeft + mainW + 10;
    const panelW = W - panelLeft - 5;

    // --- Main ensemble plot ---
    const mpad = { left: 35, right: 5, top: 5, bottom: 25 };
    const mPlotW = mainW - mpad.left - mpad.right;
    const mPlotH = mainH - mpad.top - mpad.bottom;

    function mtx(v) { return mainLeft + mpad.left + (v - xMin) / (xMax - xMin) * mPlotW; }
    function mty(v) { return mainTop + mpad.top + mPlotH - (v - yMin) / (yMax - yMin) * mPlotH; }

    // Decision regions (ensemble)
    const step = 4;
    for (let px = mainLeft + mpad.left; px < mainLeft + mpad.left + mPlotW; px += step) {
      for (let py = mainTop + mpad.top; py < mainTop + mpad.top + mPlotH; py += step) {
        const dataX = xMin + (px - mainLeft - mpad.left) / mPlotW * (xMax - xMin);
        const dataY = yMax - (py - mainTop - mpad.top) / mPlotH * (yMax - yMin);
        const pred = predictForest(trees, dataX, dataY);
        ctx.fillStyle = pred === 0 ? 'rgba(88, 196, 221, 0.18)' : 'rgba(252, 98, 85, 0.18)';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Points
    points.forEach(p => {
      const px = mtx(p.x), py = mty(p.y);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? '#58C4DD' : '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#ece6d0';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Accuracy
    let correct = 0;
    points.forEach(p => {
      if (predictForest(trees, p.x, p.y) === p.label) correct++;
    });
    ctx.fillStyle = '#ece6d0';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillText('Ensemble (' + nTrees + ' árboles)', mainLeft + mpad.left, mainTop + mpad.top + mPlotH + 18);
    ctx.fillText('Acc: ' + (correct / points.length * 100).toFixed(0) + '%', mainLeft + mpad.left + mPlotW - 60, mainTop + mpad.top + 14);

    // Axes
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText('x₁', mainLeft + mpad.left + mPlotW / 2, mainTop + mainH - 2);
    for (let gx = 1; gx <= 5; gx++) {
      ctx.fillText(gx, mtx(gx) - 3, mainTop + mpad.top + mPlotH + 12);
    }

    // --- Mini tree panels on the right ---
    const maxDisplay = Math.min(nTrees, 9);
    const cols = maxDisplay <= 3 ? 1 : (maxDisplay <= 6 ? 2 : 3);
    const rows = Math.ceil(maxDisplay / cols);
    const cellW = panelW / cols;
    const cellH = (H - 10) / rows;
    const miniPad = 3;

    for (let t = 0; t < maxDisplay; t++) {
      const col = t % cols, row = Math.floor(t / cols);
      const cx = panelLeft + col * cellW + miniPad;
      const cy = 5 + row * cellH + miniPad;
      const cw = cellW - 2 * miniPad;
      const ch = cellH - 2 * miniPad;

      // Background
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(168,162,144,0.2)';
      ctx.lineWidth = 1;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeRect(cx, cy, cw, ch);

      // Mini decision regions
      const mStep = 4;
      for (let px = cx + 2; px < cx + cw - 2; px += mStep) {
        for (let py = cy + 12; py < cy + ch - 2; py += mStep) {
          const dataX = xMin + (px - cx - 2) / (cw - 4) * (xMax - xMin);
          const dataY = yMax - (py - cy - 12) / (ch - 14) * (yMax - yMin);
          const pred = predictTree(trees[t], dataX, dataY);
          ctx.fillStyle = pred === 0 ? 'rgba(88, 196, 221, 0.2)' : 'rgba(252, 98, 85, 0.2)';
          ctx.fillRect(px, py, mStep, mStep);
        }
      }

      // Mini points
      points.forEach(p => {
        const px = cx + 2 + (p.x - xMin) / (xMax - xMin) * (cw - 4);
        const py = cy + 12 + (1 - (p.y - yMin) / (yMax - yMin)) * (ch - 14);
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.label === 0 ? '#58C4DD' : '#FC6255';
        ctx.fill();
      });

      // Label
      ctx.fillStyle = '#a8a290';
      ctx.font = '9px Fira Code, monospace';
      ctx.fillText('T' + (t + 1), cx + 3, cy + 10);

      // Individual accuracy
      let treeCorrect = 0;
      points.forEach(p => {
        if (predictTree(trees[t], p.x, p.y) === p.label) treeCorrect++;
      });
      ctx.fillStyle = '#83C167';
      ctx.fillText((treeCorrect / points.length * 100).toFixed(0) + '%', cx + cw - 25, cy + 10);
    }
  }

  slider.addEventListener('input', draw);
  draw();
}

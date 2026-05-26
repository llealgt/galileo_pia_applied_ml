// ============================================================
// Decision Tree BUILD Widget
// Muestra la construcción del árbol paso a paso (best-first):
//   - Panel izquierdo: espacio de features (Edad × Colesterol) con las
//     divisiones que se van agregando conforme crece el árbol.
//   - Panel derecho: el árbol correspondiente, revelado nodo por nodo.
// Cada paso = un split nuevo = una división nueva en el espacio.
// Datos: pacientes; salida = En Riesgo / Sano.
// ============================================================

function initDecisionTreeBuildWidget() {
  const canvas = document.getElementById('dt-build-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Dataset de pacientes: x = Edad, y = Colesterol. label 1 = En Riesgo.
  // Patrón en "escalera" → requiere varios splits para separarse.
  const points = [
    // Sanos (0)
    { x: 32, y: 170, label: 0 }, { x: 38, y: 200, label: 0 },
    { x: 45, y: 180, label: 0 }, { x: 50, y: 210, label: 0 },
    { x: 42, y: 190, label: 0 }, { x: 48, y: 160, label: 0 },
    { x: 40, y: 230, label: 0 }, { x: 55, y: 200, label: 0 },
    { x: 58, y: 220, label: 0 }, { x: 45, y: 250, label: 0 },
    { x: 50, y: 240, label: 0 }, { x: 38, y: 260, label: 0 },
    { x: 62, y: 170, label: 0 }, { x: 68, y: 180, label: 0 },
    { x: 70, y: 200, label: 0 }, { x: 72, y: 175, label: 0 },
    // En riesgo (1)
    { x: 62, y: 250, label: 1 }, { x: 68, y: 260, label: 1 },
    { x: 65, y: 240, label: 1 }, { x: 70, y: 255, label: 1 },
    { x: 72, y: 245, label: 1 }, { x: 45, y: 280, label: 1 },
    { x: 50, y: 290, label: 1 }, { x: 40, y: 275, label: 1 },
    { x: 55, y: 285, label: 1 }, { x: 75, y: 180, label: 1 },
    { x: 78, y: 200, label: 1 }, { x: 74, y: 170, label: 1 },
    { x: 76, y: 220, label: 1 }, { x: 73, y: 165, label: 1 },
  ];

  const xMin = 28, xMax = 82, yMin = 150, yMax = 300;
  const featName = { x: 'Edad', y: 'Colest' };
  const fullName = { x: 'Edad', y: 'Colesterol' };

  // ---- Left panel (feature space) ----
  const LW = 455;
  const dividerX = 462;
  const lpad = { left: 50, right: 16, top: 26, bottom: 36 };
  const lplotW = LW - lpad.left - lpad.right;
  const lplotH = H - lpad.top - lpad.bottom;
  function tx(v) { return lpad.left + (v - xMin) / (xMax - xMin) * lplotW; }
  function ty(v) { return lpad.top + lplotH - (v - yMin) / (yMax - yMin) * lplotH; }

  // ---- Right panel (tree) ----
  const rx0 = 486, rx1 = W - 14, ryTop = 56, ryBot = H - 24;

  // ---------- Impureza: ENTROPÍA (consistente con las slides previas) ----------
  // H(p) = -Σ p_i log2(p_i). La métrica de selección de splits es el
  // Information Gain = H(padre) - Σ w_k H(hijo_k).
  function entropy(labels) {
    if (!labels.length) return 0;
    const c = {};
    labels.forEach(l => c[l] = (c[l] || 0) + 1);
    let e = 0;
    Object.values(c).forEach(n => { const p = n / labels.length; if (p > 0) e -= p * Math.log2(p); });
    return e;
  }
  function majority(labels) {
    const c = {};
    labels.forEach(l => c[l] = (c[l] || 0) + 1);
    let best = 0, lbl = 0;
    Object.entries(c).forEach(([l, n]) => { if (n > best) { best = n; lbl = +l; } });
    return lbl;
  }
  function counts(pts) {
    let sano = 0, riesgo = 0;
    pts.forEach(p => { if (p.label === 0) sano++; else riesgo++; });
    return { sano, riesgo };
  }

  // Evalúa TODOS los umbrales de TODAS las features y devuelve el split con
  // mayor Information Gain (junto con las entropías de los hijos para mostrarlas).
  function bestSplit(pts) {
    let best = null;
    const parentImp = entropy(pts.map(p => p.label));
    for (const feature of ['x', 'y']) {
      const vals = [...new Set(pts.map(p => p[feature]))].sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const threshold = (vals[i] + vals[i + 1]) / 2;
        const left = pts.filter(p => p[feature] <= threshold);
        const right = pts.filter(p => p[feature] > threshold);
        if (!left.length || !right.length) continue;
        const leftImp = entropy(left.map(p => p.label));
        const rightImp = entropy(right.map(p => p.label));
        const wImp = (left.length * leftImp + right.length * rightImp) / pts.length;
        const gain = parentImp - wImp;
        if (!best || gain > best.gain) {
          best = { feature, threshold, gain, left, right, parentImp, leftImp, rightImp };
        }
      }
    }
    return best;
  }

  function makeNode(pts, bounds, depth) {
    const labels = pts.map(p => p.label);
    return {
      pts, bounds, depth,
      impurity: entropy(labels),
      label: majority(labels),
      count: pts.length,
      sano: counts(pts).sano, riesgo: counts(pts).riesgo,
      split: null, left: null, right: null,
      order: Infinity
    };
  }

  // Construye el árbol completo en orden BEST-FIRST, guardando el "order"
  // (paso) en que cada nodo interno fue dividido.
  function buildFullTree(maxSplits) {
    const root = makeNode(points, { xMin, xMax, yMin, yMax }, 0);
    const frontier = [root];
    let order = 0;
    while (order < maxSplits) {
      let bestLeaf = null, bestScore = -1, bestS = null;
      for (const leaf of frontier) {
        if (leaf.impurity === 0 || leaf.pts.length < 2) continue;
        const s = bestSplit(leaf.pts);
        if (s && s.gain > 1e-9) {
          const score = s.gain * leaf.pts.length; // ponderar por tamaño del nodo
          if (score > bestScore) { bestScore = score; bestLeaf = leaf; bestS = s; }
        }
      }
      if (!bestLeaf) break;
      bestLeaf.split = {
        feature: bestS.feature, threshold: bestS.threshold, gain: bestS.gain,
        parentImp: bestS.parentImp, parentN: bestLeaf.count,
        leftImp: bestS.leftImp, leftN: bestS.left.length,
        rightImp: bestS.rightImp, rightN: bestS.right.length
      };
      bestLeaf.order = order;
      const lb = { ...bestLeaf.bounds }, rb = { ...bestLeaf.bounds };
      if (bestS.feature === 'x') { lb.xMax = bestS.threshold; rb.xMin = bestS.threshold; }
      else { lb.yMax = bestS.threshold; rb.yMin = bestS.threshold; }
      bestLeaf.left = makeNode(bestS.left, lb, bestLeaf.depth + 1);
      bestLeaf.right = makeNode(bestS.right, rb, bestLeaf.depth + 1);
      frontier.splice(frontier.indexOf(bestLeaf), 1);
      frontier.push(bestLeaf.left, bestLeaf.right);
      order++;
    }
    return { root, totalSplits: order };
  }

  const MAX_SPLITS = 7;
  const { root, totalSplits } = buildFullTree(MAX_SPLITS);

  // Predicción tratando como hoja cualquier nodo aún no dividido en este paso.
  function predictAt(node, px, py, step) {
    if (!node.split || node.order >= step) return node.label;
    const val = node.split.feature === 'x' ? px : py;
    return val <= node.split.threshold
      ? predictAt(node.left, px, py, step)
      : predictAt(node.right, px, py, step);
  }

  function collectSplitsAt(node, step, arr) {
    if (!node.split || node.order >= step) return;
    arr.push({ feature: node.split.feature, threshold: node.split.threshold,
               bounds: node.bounds, order: node.order });
    collectSplitsAt(node.left, step, arr);
    collectSplitsAt(node.right, step, arr);
  }

  // Layout del árbol por CONTEO DE HOJAS: cada hoja recibe un slot horizontal
  // propio y cada nodo interno se centra sobre sus descendientes. Evita el
  // amontonamiento que produce dividir el rango por la mitad en árboles
  // desbalanceados.
  function layout(node, step, depth, out) {
    node._depth = depth;
    out.maxDepth = Math.max(out.maxDepth, depth);
    out.nodes.push(node);
    if (node.split && node.order < step) {
      layout(node.left, step, depth + 1, out);
      layout(node.right, step, depth + 1, out);
      node._xUnit = (node.left._xUnit + node.right._xUnit) / 2;
    } else {
      node._xUnit = out.leafCount;
      out.leafCount += 1;
    }
  }

  // ---------- Controles ----------
  const slider = document.getElementById('dtb-step-slider');
  const stepVal = document.getElementById('dtb-step-value');
  const playBtn = document.getElementById('dtb-play-btn');
  const resetBtn = document.getElementById('dtb-reset-btn');
  slider.max = totalSplits;

  let playTimer = null;

  function roundThr(feature, t) {
    return Math.round(t); // Edad y Colesterol → enteros
  }

  function draw() {
    const step = parseInt(slider.value);
    stepVal.textContent = step + ' / ' + totalSplits;

    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // ===== LEFT PANEL: feature space =====
    // Decision regions
    const cell = 4;
    for (let px = lpad.left; px < lpad.left + lplotW; px += cell) {
      for (let py = lpad.top; py < lpad.top + lplotH; py += cell) {
        const dx = xMin + (px - lpad.left) / lplotW * (xMax - xMin);
        const dy = yMax - (py - lpad.top) / lplotH * (yMax - yMin);
        const pred = predictAt(root, dx, dy, step);
        ctx.fillStyle = pred === 0 ? 'rgba(88,196,221,0.15)' : 'rgba(252,98,85,0.15)';
        ctx.fillRect(px, py, cell, cell);
      }
    }

    // Split lines (la más reciente resaltada)
    const splits = [];
    collectSplitsAt(root, step, splits);
    splits.forEach(s => {
      const isLatest = s.order === step - 1;
      ctx.strokeStyle = isLatest ? '#FFFF00' : 'rgba(255,255,0,0.45)';
      ctx.lineWidth = isLatest ? 2.5 : 1.3;
      ctx.setLineDash(isLatest ? [] : [5, 3]);
      if (s.feature === 'x') {
        const y1 = Math.max(s.bounds.yMin, yMin), y2 = Math.min(s.bounds.yMax, yMax);
        ctx.beginPath(); ctx.moveTo(tx(s.threshold), ty(y1)); ctx.lineTo(tx(s.threshold), ty(y2)); ctx.stroke();
      } else {
        const x1 = Math.max(s.bounds.xMin, xMin), x2 = Math.min(s.bounds.xMax, xMax);
        ctx.beginPath(); ctx.moveTo(tx(x1), ty(s.threshold)); ctx.lineTo(tx(x2), ty(s.threshold)); ctx.stroke();
      }
    });
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lpad.left, lpad.top); ctx.lineTo(lpad.left, lpad.top + lplotH);
    ctx.lineTo(lpad.left + lplotW, lpad.top + lplotH); ctx.stroke();

    // Points
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p.x), ty(p.y), 5.5, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? '#58C4DD' : '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1; ctx.stroke();
    });

    // Axis labels + ticks
    ctx.fillStyle = '#a8a290'; ctx.font = '12px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('Edad (años)', lpad.left + lplotW / 2, H - 8);
    ctx.save();
    ctx.translate(13, lpad.top + lplotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Colesterol (mg/dL)', 0, 0); ctx.restore();
    ctx.font = '9px Fira Code, monospace';
    for (let gx = 30; gx <= 80; gx += 10) ctx.fillText(gx, tx(gx), lpad.top + lplotH + 13);
    ctx.textAlign = 'right';
    for (let gy = 150; gy <= 300; gy += 50) ctx.fillText(gy, lpad.left - 5, ty(gy) + 3);
    ctx.textAlign = 'left';

    // Title + legend (left)
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText('Espacio de pacientes', lpad.left, 16);
    ctx.beginPath(); ctx.arc(lpad.left + 165, 12, 5, 0, Math.PI * 2); ctx.fillStyle = '#58C4DD'; ctx.fill();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('Sano', lpad.left + 174, 16);
    ctx.beginPath(); ctx.arc(lpad.left + 222, 12, 5, 0, Math.PI * 2); ctx.fillStyle = '#FC6255'; ctx.fill();
    ctx.fillStyle = '#a8a290'; ctx.fillText('En Riesgo', lpad.left + 231, 16);

    // Divider
    ctx.strokeStyle = 'rgba(168,162,144,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dividerX, 8); ctx.lineTo(dividerX, H - 8); ctx.stroke();

    // ===== RIGHT PANEL: tree =====
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Árbol de decisión', rx0, 16);

    const lay = { nodes: [], maxDepth: 0, leafCount: 0 };
    layout(root, step, 0, lay);
    const nLeaves = Math.max(lay.leafCount, 1);
    const levels = Math.max(lay.maxDepth, 1);
    const levelH = Math.min(84, (ryBot - ryTop) / (levels + 0.3));
    const HH = 19; // media altura de caja (para conectar aristas)
    function nodeX(n) { return rx0 + (n._xUnit + 0.5) / nLeaves * (rx1 - rx0); }
    function nodeY(n) { return ryTop + n._depth * levelH; }

    // Edges first
    lay.nodes.forEach(n => {
      if (n.split && n.order < step) {
        const x = nodeX(n), y = nodeY(n);
        [['left', '≤'], ['right', '>']].forEach(([side, sym]) => {
          const c = n[side];
          const cx = nodeX(c), cy = nodeY(c);
          ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y + HH); ctx.lineTo(cx, cy - HH); ctx.stroke();
          ctx.fillStyle = side === 'left' ? '#58C4DD' : '#FC6255';
          ctx.font = 'bold 11px Fira Code, monospace'; ctx.textAlign = 'center';
          ctx.fillText(sym, (x + cx) / 2 + (side === 'left' ? -8 : 8), (y + cy) / 2 + 2);
        });
      }
    });

    // Nodes
    lay.nodes.forEach(n => {
      const x = nodeX(n), y = nodeY(n);
      const isInternal = n.split && n.order < step;
      const justAdded = n.order === step - 1;
      ctx.textAlign = 'center';
      if (isInternal) {
        const w = 96, h = 2 * HH;
        ctx.fillStyle = 'rgba(154,114,172,0.32)';
        ctx.strokeStyle = justAdded ? '#FFFF00' : '#9A72AC';
        ctx.lineWidth = justAdded ? 3 : 1.5;
        roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ece6d0'; ctx.font = '12px Fira Code, monospace';
        ctx.fillText(featName[n.split.feature] + ' ≤ ' + roundThr(n.split.feature, n.split.threshold), x, y - 3);
        ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
        ctx.fillText('H = ' + n.impurity.toFixed(2), x, y + 11);
      } else {
        // Leaf
        const w = 80, h = 2 * HH;
        const isRisk = n.label === 1;
        ctx.fillStyle = isRisk ? 'rgba(252,98,85,0.3)' : 'rgba(88,196,221,0.3)';
        ctx.strokeStyle = justAdded ? '#FFFF00' : (isRisk ? '#FC6255' : '#58C4DD');
        ctx.lineWidth = justAdded ? 3 : 1.5;
        roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = isRisk ? '#FC6255' : '#58C4DD';
        ctx.font = 'bold 12px Fira Code, monospace';
        ctx.fillText(isRisk ? 'Riesgo' : 'Sano', x, y - 3);
        ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
        ctx.fillText('n=' + n.count + ' · H=' + n.impurity.toFixed(2), x, y + 11);
      }
    });

    // Accuracy footer (right panel, canvas)
    let correct = 0;
    points.forEach(p => { if (predictAt(root, p.x, p.y, step) === p.label) correct++; });
    const acc = (correct / points.length * 100).toFixed(0);
    ctx.fillStyle = '#83C167'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Accuracy: ' + acc + '%  (' + correct + '/' + points.length + ')', rx0, H - 10);

    // ---- Panel de detalles del entrenamiento (HTML) ----
    const infoEl = document.getElementById('dtb-info');
    if (infoEl) {
      if (step === 0) {
        const c = counts(points);
        infoEl.innerHTML =
          '<strong style="color:var(--c-yellow)">Raíz</strong> · ' + points.length +
          ' pacientes (' + c.sano + ' Sano, ' + c.riesgo + ' Riesgo) · entropía inicial ' +
          '<b>H = ' + root.impurity.toFixed(3) + '</b><br>' +
          '<span style="color:var(--c-text-dim)">En cada paso el árbol evalúa <em>todos</em> los umbrales de <em>todas</em> las features y elige el corte con mayor <b>Information Gain</b> = reducción de entropía.</span>';
      } else {
        const n = lay.nodes.find(nd => nd.order === step - 1);
        const s = n.split;
        infoEl.innerHTML =
          '<strong style="color:var(--c-yellow)">Paso ' + step + '</strong> · mejor división: ' +
          '<b style="color:#c79be0">' + fullName[s.feature] + ' ≤ ' + roundThr(s.feature, s.threshold) + '</b> ' +
          '<span style="color:var(--c-text-dim)">(la de mayor Information Gain entre todos los candidatos)</span><br>' +
          'H(padre) = <b>' + s.parentImp.toFixed(3) + '</b> &nbsp;→&nbsp; ' +
          '<span style="color:#58C4DD">izq n=' + s.leftN + ', H=' + s.leftImp.toFixed(3) + '</span> &nbsp;·&nbsp; ' +
          '<span style="color:#FC6255">der n=' + s.rightN + ', H=' + s.rightImp.toFixed(3) + '</span><br>' +
          'IG = ' + s.parentImp.toFixed(3) + ' − (' +
          s.leftN + '/' + s.parentN + '·' + s.leftImp.toFixed(3) + ' + ' +
          s.rightN + '/' + s.parentN + '·' + s.rightImp.toFixed(3) + ') = ' +
          '<b style="color:var(--c-green)">' + s.gain.toFixed(3) + '</b>';
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function stopPlay() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    if (playBtn) playBtn.textContent = '▶ Reproducir';
  }

  slider.addEventListener('input', () => { stopPlay(); draw(); });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (playTimer) { stopPlay(); return; }
      if (parseInt(slider.value) >= totalSplits) slider.value = 0;
      playBtn.textContent = '⏸ Pausa';
      playTimer = setInterval(() => {
        let v = parseInt(slider.value);
        if (v >= totalSplits) { stopPlay(); return; }
        slider.value = v + 1;
        draw();
      }, 1100);
      draw();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => { stopPlay(); slider.value = 0; draw(); });
  }

  draw();
}

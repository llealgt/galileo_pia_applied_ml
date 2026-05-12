// ============================================================
// Threshold Classification Widget
// Muestra cómo el umbral de clasificación afecta TP/FP/TN/FN
// y las métricas Precision, Recall, Accuracy, F1
// ============================================================

function initThresholdWidget(data) {
  const canvas = document.getElementById('threshold-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slider = document.getElementById('threshold-slider');
  const thresholdVal = document.getElementById('threshold-value');

  // Dataset propio con clases NO perfectamente separables
  // (no usamos data para puntos — necesitamos solapamiento para demostrar thresholds)
  const points = [
    // Class 0 (Benigno) — cluster principal zona baja-izquierda
    { x: 0.8, y: 1.0, label: 0 }, { x: 1.2, y: 0.6, label: 0 },
    { x: 0.5, y: 1.5, label: 0 }, { x: 1.5, y: 1.2, label: 0 },
    { x: 1.0, y: 0.4, label: 0 }, { x: 0.3, y: 0.8, label: 0 },
    { x: 1.8, y: 0.9, label: 0 }, { x: 0.7, y: 1.8, label: 0 },
    { x: 1.4, y: 1.7, label: 0 },
    // Class 0 — puntos en zona fronteriza / territorio de class 1
    { x: 2.8, y: 2.5, label: 0 }, { x: 3.2, y: 3.0, label: 0 },
    { x: 2.5, y: 3.2, label: 0 },
    // Class 1 (Maligno) — cluster principal zona alta-derecha
    { x: 4.0, y: 4.2, label: 1 }, { x: 4.5, y: 3.8, label: 1 },
    { x: 3.8, y: 4.5, label: 1 }, { x: 4.2, y: 4.8, label: 1 },
    { x: 4.8, y: 4.0, label: 1 }, { x: 3.5, y: 4.0, label: 1 },
    { x: 4.6, y: 4.5, label: 1 }, { x: 5.0, y: 3.5, label: 1 },
    { x: 3.6, y: 4.7, label: 1 },
    // Class 1 — puntos en zona fronteriza / territorio de class 0
    { x: 2.2, y: 2.0, label: 1 }, { x: 2.6, y: 2.8, label: 1 },
    { x: 1.8, y: 2.5, label: 1 },
  ];

  // Modelo logístico fijo (frontera diagonal por el centro)
  const w1 = 1.8, w2 = 1.8;
  const b = -(w1 * 2.7 + w2 * 2.7); // frontera pasa por ~(2.7, 2.7)

  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

  function getProb(px, py) {
    return sigmoid(w1 * px + w2 * py + b);
  }

  // Data range
  const allX = points.map(p => p.x), allY = points.map(p => p.y);
  const xMin = Math.min(...allX) - 0.8, xMax = Math.max(...allX) + 0.8;
  const yMin = Math.min(...allY) - 0.8, yMax = Math.max(...allY) + 0.8;

  // Plot area
  const pad = { left: 45, right: 200, top: 20, bottom: 35 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  function tx(v) { return pad.left + (v - xMin) / (xMax - xMin) * plotW; }
  function ty(v) { return pad.top + plotH - (v - yMin) / (yMax - yMin) * plotH; }

  function draw() {
    const threshold = parseFloat(slider.value);
    thresholdVal.textContent = threshold.toFixed(2);

    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Draw colored regions (heatmap of probability)
    const step = 3;
    for (let px = pad.left; px < pad.left + plotW; px += step) {
      for (let py = pad.top; py < pad.top + plotH; py += step) {
        const dataX = xMin + (px - pad.left) / plotW * (xMax - xMin);
        const dataY = yMax - (py - pad.top) / plotH * (yMax - yMin);
        const prob = getProb(dataX, dataY);
        if (prob >= threshold) {
          ctx.fillStyle = 'rgba(252, 98, 85, 0.12)';
        } else {
          ctx.fillStyle = 'rgba(88, 196, 221, 0.12)';
        }
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 0.5;
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      ctx.beginPath(); ctx.moveTo(tx(gx), pad.top); ctx.lineTo(tx(gx), pad.top + plotH); ctx.stroke();
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      ctx.beginPath(); ctx.moveTo(pad.left, ty(gy)); ctx.lineTo(pad.left + plotW, ty(gy)); ctx.stroke();
    }

    // Decision boundary line: w1*x + w2*y + b = logit(threshold)
    const logitT = Math.log(threshold / (1 - threshold));
    // w1*x + w2*y + b = logitT  =>  y = (logitT - b - w1*x) / w2
    if (Math.abs(w2) > 0.001) {
      const bx1 = xMin, by1 = (logitT - b - w1 * bx1) / w2;
      const bx2 = xMax, by2 = (logitT - b - w1 * bx2) / w2;
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(tx(bx1), ty(by1));
      ctx.lineTo(tx(bx2), ty(by2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Classify points and compute metrics
    let TP = 0, FP = 0, TN = 0, FN = 0;
    points.forEach(p => {
      const prob = getProb(p.x, p.y);
      const pred = prob >= threshold ? 1 : 0;
      if (p.label === 1 && pred === 1) TP++;
      else if (p.label === 0 && pred === 1) FP++;
      else if (p.label === 0 && pred === 0) TN++;
      else FN++;
    });

    // Draw points
    points.forEach(p => {
      const prob = getProb(p.x, p.y);
      const pred = prob >= threshold ? 1 : 0;
      const correct = pred === p.label;

      const px = tx(p.x), py = ty(p.y);

      // Outer ring: green if correct, red if error
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = correct ? 'rgba(131,193,103,0.4)' : 'rgba(252,98,85,0.4)';
      ctx.fill();
      ctx.strokeStyle = correct ? '#83C167' : '#FC6255';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot: class color
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? '#58C4DD' : '#FC6255';
      ctx.fill();
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

    // Axis tick labels
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      ctx.fillText(gx, tx(gx) - 3, pad.top + plotH + 14);
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      ctx.fillText(gy, pad.left - 18, ty(gy) + 4);
    }

    // Metrics panel on the right
    const mx = pad.left + plotW + 15;
    let my = pad.top + 10;

    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Métricas', mx, my); my += 22;

    const accuracy = (TP + TN) / (TP + TN + FP + FN);
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

    ctx.font = '11px Fira Code, monospace';

    // Accuracy
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Accuracy:', mx, my);
    ctx.fillStyle = '#83C167';
    ctx.fillText(accuracy.toFixed(2), mx + 100, my); my += 18;

    // Precision
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Precision:', mx, my);
    ctx.fillStyle = '#58C4DD';
    ctx.fillText(precision.toFixed(2), mx + 100, my); my += 18;

    // Recall
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Recall:', mx, my);
    ctx.fillStyle = '#FF862F';
    ctx.fillText(recall.toFixed(2), mx + 100, my); my += 18;

    // F1
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('F1 Score:', mx, my);
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(f1.toFixed(2), mx + 100, my); my += 28;

    // Confusion matrix mini
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Confusión', mx, my); my += 18;

    ctx.font = '11px Fira Code, monospace';
    // Header
    ctx.fillStyle = '#a8a290';
    ctx.fillText('        P=0  P=1', mx, my); my += 16;

    // Row Y=0
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Y=0:', mx, my);
    ctx.fillStyle = '#83C167';
    ctx.fillText('TN=' + TN, mx + 55, my);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('FP=' + FP, mx + 110, my); my += 16;

    // Row Y=1
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Y=1:', mx, my);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('FN=' + FN, mx + 55, my);
    ctx.fillStyle = '#83C167';
    ctx.fillText('TP=' + TP, mx + 110, my); my += 28;

    // Legend
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('— frontera de', mx, my); my += 14;
    ctx.fillText('  decisión', mx, my); my += 18;

    ctx.beginPath();
    ctx.arc(mx + 6, my - 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#58C4DD'; ctx.fill();
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Benigno', mx + 16, my); my += 16;

    ctx.beginPath();
    ctx.arc(mx + 6, my - 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FC6255'; ctx.fill();
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Maligno', mx + 16, my); my += 18;

    // Ring legend
    ctx.strokeStyle = '#83C167'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx + 6, my - 4, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Correcto', mx + 16, my); my += 16;

    ctx.strokeStyle = '#FC6255'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx + 6, my - 4, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Error', mx + 16, my);
  }

  slider.addEventListener('input', draw);
  draw();
}

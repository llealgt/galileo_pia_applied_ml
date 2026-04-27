// ============================================================
// Linear Regression Widget - Ajustar w,b con sliders
// ============================================================

function initLinearRegressionWidget(data) {
  const canvas = document.getElementById('lr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const wSlider = document.getElementById('lr-w-slider');
  const bSlider = document.getElementById('lr-b-slider');
  const wVal = document.getElementById('lr-w-val');
  const bVal = document.getElementById('lr-b-val');
  const eqEl = document.getElementById('lr-equation');
  const predEl = document.getElementById('lr-prediction');

  const xData = data.x;
  const yData = data.y;
  const xPred = 1.2;

  // Plot bounds
  const ox = 50, oy = H - 35, pw = W - 70, ph = H - 60;
  const xMin = 0, xMax = 3, yMin = -100, yMax = 700;

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

  function draw() {
    const w = parseFloat(wSlider.value);
    const b = parseFloat(bSlider.value);

    // Clear
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let xv = 0; xv <= 3; xv += 0.5) {
      ctx.beginPath(); ctx.moveTo(tx(xv), oy); ctx.lineTo(tx(xv), oy - ph); ctx.stroke();
    }
    for (let yv = 0; yv <= 700; yv += 100) {
      ctx.beginPath(); ctx.moveTo(ox, ty(yv)); ctx.lineTo(ox + pw, ty(yv)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - ph); ctx.lineTo(ox, oy); ctx.lineTo(ox + pw, oy);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let xv = 0.5; xv <= 3; xv += 0.5) {
      ctx.fillText(xv.toFixed(1), tx(xv), oy + 14);
    }
    ctx.textAlign = 'right';
    for (let yv = 0; yv <= 700; yv += 200) {
      ctx.fillText(yv, ox - 5, ty(yv) + 4);
    }

    // Axis labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Tamano (1000 sqft)', ox + pw / 2, oy + 28);
    ctx.save();
    ctx.translate(12, oy - ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Precio ($1000s)', 0, 0);
    ctx.restore();

    // Regression line
    ctx.strokeStyle = '#58C4DD';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx(xMin), ty(w * xMin + b));
    ctx.lineTo(tx(xMax), ty(w * xMax + b));
    ctx.stroke();

    // Data points (red X)
    for (let i = 0; i < xData.length; i++) {
      const px = tx(xData[i]), py = ty(yData[i]);
      ctx.strokeStyle = '#FC6255';
      ctx.lineWidth = 2.5;
      const s = 6;
      ctx.beginPath(); ctx.moveTo(px - s, py - s); ctx.lineTo(px + s, py + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + s, py - s); ctx.lineTo(px - s, py + s); ctx.stroke();
    }

    // Prediction point (green dot)
    const predY = w * xPred + b;
    const ppx = tx(xPred), ppy = ty(predY);
    ctx.fillStyle = '#83C167';
    ctx.beginPath(); ctx.arc(ppx, ppy, 6, 0, Math.PI * 2); ctx.fill();

    // Dashed lines to prediction
    ctx.strokeStyle = 'rgba(131, 193, 103, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(ppx, oy); ctx.lineTo(ppx, ppy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, ppy); ctx.lineTo(ppx, ppy); ctx.stroke();
    ctx.setLineDash([]);

    // Prediction label
    ctx.fillStyle = '#83C167';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`(${xPred}, ${predY.toFixed(0)})`, ppx + 8, ppy - 5);

    // Compute cost
    let cost = 0;
    for (let i = 0; i < xData.length; i++) {
      const err = w * xData[i] + b - yData[i];
      cost += err * err;
    }
    cost /= (2 * xData.length);

    // Cost display
    ctx.fillStyle = cost < 1 ? '#83C167' : (cost < 5000 ? '#FF862F' : '#FC6255');
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`J(w,b) = ${cost.toFixed(0)}`, ox + 5, 20);

    // Update text
    wVal.textContent = w;
    bVal.textContent = b;
    eqEl.textContent = `f(x) = ${w}x + ${b}`;
    predEl.textContent = `f(${xPred}) = ${predY.toFixed(0)}`;
  }

  wSlider.addEventListener('input', draw);
  bSlider.addEventListener('input', draw);
  draw();
}

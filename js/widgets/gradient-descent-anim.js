// ============================================================
// Gradient Descent Animation Widget
// ============================================================

function initGradientDescentWidget(data) {
  const contourCanvas = document.getElementById('gd-contour-canvas');
  const lineCanvas = document.getElementById('gd-line-canvas');
  if (!contourCanvas || !lineCanvas) return;

  const contourCtx = contourCanvas.getContext('2d');
  const lineCtx = lineCanvas.getContext('2d');

  const playBtn = document.getElementById('gd-play-btn');
  const stepBtn = document.getElementById('gd-step-btn');
  const resetBtn = document.getElementById('gd-reset-btn');
  const speedSlider = document.getElementById('gd-speed-slider');
  const iterVal = document.getElementById('gd-iter-val');
  const costVal = document.getElementById('gd-cost-val');

  const xData = data.x, yData = data.y;
  const m = xData.length;
  const alpha = 0.1;

  // --- Precompute GD trajectory ---
  const maxIters = 200;
  const trajectory = [];

  function computeGradient(w, b) {
    let dw = 0, db = 0;
    for (let i = 0; i < m; i++) {
      const err = w * xData[i] + b - yData[i];
      dw += err * xData[i];
      db += err;
    }
    return { dw: dw / m, db: db / m };
  }

  function computeCostLocal(w, b) {
    let cost = 0;
    for (let i = 0; i < m; i++) {
      const err = w * xData[i] + b - yData[i];
      cost += err * err;
    }
    return cost / (2 * m);
  }

  // Run GD
  let w = 0, b = 0;
  for (let iter = 0; iter <= maxIters; iter++) {
    const cost = computeCostLocal(w, b);
    trajectory.push({ w, b, cost, iter });
    const grad = computeGradient(w, b);
    w = w - alpha * grad.dw;
    b = b - alpha * grad.db;
  }

  // --- Precompute contour image ---
  const CW = contourCanvas.width, CH = contourCanvas.height;
  const wMin = -50, wMax = 400, bMin = -150, bMax = 350;
  const contourImageData = contourCtx.createImageData(CW, CH);

  // Compute max cost for color mapping
  let maxC = 0;
  for (let py = 0; py < CH; py++) {
    for (let px = 0; px < CW; px++) {
      const wv = wMin + (wMax - wMin) * px / CW;
      const bv = bMax - (bMax - bMin) * py / CH;
      const c = computeCostLocal(wv, bv);
      if (c > maxC) maxC = c;
    }
  }

  // Color map function
  function costToColor(cost) {
    const t = Math.min(1, Math.sqrt(cost / maxC));
    // Dark blue -> teal -> green -> orange -> red
    let r, g, bl;
    if (t < 0.25) {
      const s = t / 0.25;
      r = 27 + s * (88 - 27); g = 27 + s * (196 - 27); bl = 47 + s * (221 - 47);
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25;
      r = 88 + s * (131 - 88); g = 196 + s * (193 - 196); bl = 221 + s * (103 - 221);
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25;
      r = 131 + s * (255 - 131); g = 193 + s * (134 - 193); bl = 103 + s * (47 - 103);
    } else {
      const s = (t - 0.75) / 0.25;
      r = 255 - s * 3; g = 134 - s * 36; bl = 47 + s * 38;
    }
    return [Math.round(r), Math.round(g), Math.round(bl)];
  }

  for (let py = 0; py < CH; py++) {
    for (let px = 0; px < CW; px++) {
      const wv = wMin + (wMax - wMin) * px / CW;
      const bv = bMax - (bMax - bMin) * py / CH;
      const c = computeCostLocal(wv, bv);
      const [r, g, bl] = costToColor(c);
      const idx = (py * CW + px) * 4;
      contourImageData.data[idx] = r;
      contourImageData.data[idx + 1] = g;
      contourImageData.data[idx + 2] = bl;
      contourImageData.data[idx + 3] = 255;
    }
  }

  // Helper to convert w,b to canvas coords
  function tw(v) { return (v - wMin) / (wMax - wMin) * CW; }
  function tb(v) { return (bMax - v) / (bMax - bMin) * CH; }

  // --- Animation state ---
  let currentStep = 0;
  let isPlaying = false;
  let animId = null;
  let frameCounter = 0;

  function drawContour() {
    contourCtx.putImageData(contourImageData, 0, 0);

    // Axes labels
    contourCtx.fillStyle = '#ece6d0';
    contourCtx.font = '11px Fira Code, monospace';
    contourCtx.textAlign = 'center';
    contourCtx.fillText('w', CW / 2, CH - 3);
    contourCtx.save();
    contourCtx.translate(12, CH / 2);
    contourCtx.rotate(-Math.PI / 2);
    contourCtx.fillText('b', 0, 0);
    contourCtx.restore();

    // Tick values
    contourCtx.fillStyle = 'rgba(236,230,208,0.5)';
    contourCtx.font = '9px Fira Code, monospace';
    contourCtx.textAlign = 'center';
    for (let wv = 0; wv <= 400; wv += 100) {
      contourCtx.fillText(wv, tw(wv), CH - 12);
    }
    contourCtx.textAlign = 'right';
    for (let bv = -100; bv <= 300; bv += 100) {
      contourCtx.fillText(bv, 30, tb(bv) + 4);
    }

    // Draw path up to currentStep
    if (currentStep > 0) {
      contourCtx.strokeStyle = '#FC6255';
      contourCtx.lineWidth = 2;
      contourCtx.beginPath();
      contourCtx.moveTo(tw(trajectory[0].w), tb(trajectory[0].b));
      for (let i = 1; i <= currentStep && i < trajectory.length; i++) {
        contourCtx.lineTo(tw(trajectory[i].w), tb(trajectory[i].b));
      }
      contourCtx.stroke();

      // Draw dots at each step
      for (let i = 0; i <= currentStep && i < trajectory.length; i++) {
        const size = i === currentStep ? 5 : 2;
        const color = i === currentStep ? '#FFFF00' : '#FC6255';
        contourCtx.fillStyle = color;
        contourCtx.beginPath();
        contourCtx.arc(tw(trajectory[i].w), tb(trajectory[i].b), size, 0, Math.PI * 2);
        contourCtx.fill();
      }
    }

    // Start point
    contourCtx.fillStyle = '#FFFF00';
    contourCtx.beginPath();
    contourCtx.arc(tw(trajectory[0].w), tb(trajectory[0].b), 4, 0, Math.PI * 2);
    contourCtx.fill();

    // Minimum marker
    contourCtx.fillStyle = '#83C167';
    contourCtx.beginPath();
    contourCtx.arc(tw(200), tb(100), 5, 0, Math.PI * 2);
    contourCtx.fill();
    contourCtx.fillStyle = 'rgba(131,193,103,0.5)';
    contourCtx.font = '9px Fira Code, monospace';
    contourCtx.textAlign = 'left';
    contourCtx.fillText('min', tw(200) + 8, tb(100) + 4);
  }

  function drawRegressionLine() {
    const W = lineCanvas.width, H = lineCanvas.height;
    lineCtx.fillStyle = '#0d0d1a';
    lineCtx.fillRect(0, 0, W, H);

    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55;
    const xMin = 0, xMax = 3, yMin = -100, yMax = 700;
    function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
    function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

    // Grid
    lineCtx.strokeStyle = 'rgba(255,255,255,0.06)'; lineCtx.lineWidth = 0.5;
    for (let xv = 0; xv <= 3; xv++) {
      lineCtx.beginPath(); lineCtx.moveTo(tx(xv), oy); lineCtx.lineTo(tx(xv), oy - ph); lineCtx.stroke();
    }

    // Axes
    lineCtx.strokeStyle = '#a8a290'; lineCtx.lineWidth = 1;
    lineCtx.beginPath(); lineCtx.moveTo(ox, oy - ph); lineCtx.lineTo(ox, oy); lineCtx.lineTo(ox + pw, oy); lineCtx.stroke();

    // Current w, b
    const pt = trajectory[Math.min(currentStep, trajectory.length - 1)];
    const w = pt.w, b = pt.b;

    // Previous lines (ghost)
    if (currentStep > 0) {
      const ghostSteps = [0, Math.floor(currentStep / 4), Math.floor(currentStep / 2)];
      ghostSteps.forEach(gs => {
        if (gs < currentStep && gs < trajectory.length) {
          const gp = trajectory[gs];
          lineCtx.strokeStyle = 'rgba(88, 196, 221, 0.15)'; lineCtx.lineWidth = 1;
          lineCtx.beginPath();
          lineCtx.moveTo(tx(xMin), ty(gp.w * xMin + gp.b));
          lineCtx.lineTo(tx(xMax), ty(gp.w * xMax + gp.b));
          lineCtx.stroke();
        }
      });
    }

    // Current line
    lineCtx.strokeStyle = '#58C4DD'; lineCtx.lineWidth = 2.5;
    lineCtx.beginPath();
    lineCtx.moveTo(tx(xMin), ty(w * xMin + b));
    lineCtx.lineTo(tx(xMax), ty(w * xMax + b));
    lineCtx.stroke();

    // Data points
    for (let i = 0; i < xData.length; i++) {
      lineCtx.strokeStyle = '#FC6255'; lineCtx.lineWidth = 2.5;
      const px = tx(xData[i]), pyy = ty(yData[i]);
      const s = 6;
      lineCtx.beginPath(); lineCtx.moveTo(px - s, pyy - s); lineCtx.lineTo(px + s, pyy + s); lineCtx.stroke();
      lineCtx.beginPath(); lineCtx.moveTo(px + s, pyy - s); lineCtx.lineTo(px - s, pyy + s); lineCtx.stroke();
    }

    // Info text
    lineCtx.fillStyle = '#ece6d0'; lineCtx.font = '11px Fira Code, monospace'; lineCtx.textAlign = 'left';
    lineCtx.fillText(`w=${w.toFixed(1)}`, ox + 5, 15);
    lineCtx.fillText(`b=${b.toFixed(1)}`, ox + 5, 28);
  }

  function updateDisplay() {
    const pt = trajectory[Math.min(currentStep, trajectory.length - 1)];
    iterVal.textContent = currentStep;
    costVal.textContent = pt.cost.toFixed(0);
    costVal.style.color = pt.cost < 10 ? '#83C167' : '#FF862F';
  }

  function render() {
    drawContour();
    drawRegressionLine();
    updateDisplay();
  }

  function animate() {
    if (!isPlaying) return;
    frameCounter++;
    const speed = parseInt(speedSlider.value);
    if (frameCounter % Math.max(1, 11 - speed) === 0) {
      if (currentStep < maxIters) {
        currentStep++;
        render();
      } else {
        isPlaying = false;
        playBtn.innerHTML = '&#9654; Iniciar';
        return;
      }
    }
    animId = requestAnimationFrame(animate);
  }

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      isPlaying = false;
      playBtn.innerHTML = '&#9654; Continuar';
      if (animId) cancelAnimationFrame(animId);
    } else {
      if (currentStep >= maxIters) {
        currentStep = 0;
      }
      isPlaying = true;
      playBtn.innerHTML = '&#9208; Pausa';
      animate();
    }
  });

  stepBtn.addEventListener('click', () => {
    if (currentStep < maxIters) {
      currentStep++;
      render();
    }
  });

  resetBtn.addEventListener('click', () => {
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    currentStep = 0;
    playBtn.innerHTML = '&#9654; Iniciar';
    render();
  });

  render();
}

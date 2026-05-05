// ============================================================
// Sigmoid Widget
// Interactive sigmoid function visualization
// Sliders for w (weight) and b (bias)
// Shows how g(z) = 1/(1+e^{-z}) changes shape
// ============================================================

function initSigmoidWidget() {
  const canvas = document.getElementById('sigmoid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Chart area
  const ox = 70, oy = H - 50;
  const pw = W - 280, ph = H - 90;
  const xMin = -6, xMax = 6;
  const yMin = -0.1, yMax = 1.1;

  let w = 1.0, b = 0.0;

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

  function sigmoid(x) {
    const z = w * x + b;
    return 1.0 / (1.0 + Math.exp(-z));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 2) {
      ctx.beginPath(); ctx.moveTo(tx(i), oy); ctx.lineTo(tx(i), oy - ph); ctx.stroke();
    }
    for (let i = 0; i <= 1; i += 0.25) {
      ctx.beginPath(); ctx.moveTo(ox, ty(i)); ctx.lineTo(ox + pw, ty(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let i = -6; i <= 6; i += 2) {
      ctx.fillText(i, tx(i), oy + 18);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 1; i += 0.25) {
      ctx.fillText(i.toFixed(2), ox - 8, ty(i) + 4);
    }

    // Label axes
    ctx.fillStyle = '#ece6d0';
    ctx.font = '12px Fira Code';
    ctx.textAlign = 'center';
    ctx.fillText('x', ox + pw / 2, oy + 35);
    ctx.save();
    ctx.translate(15, oy - ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('g(w·x + b)', 0, 0);
    ctx.restore();

    // Threshold line at y=0.5
    ctx.strokeStyle = 'rgba(255,255,0,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, ty(0.5));
    ctx.lineTo(ox + pw, ty(0.5));
    ctx.stroke();
    ctx.setLineDash([]);

    // Label threshold
    ctx.fillStyle = '#FFFF00';
    ctx.font = '10px Fira Code';
    ctx.textAlign = 'left';
    ctx.fillText('umbral 0.5', ox + pw - 70, ty(0.5) - 5);

    // Draw sigmoid curve
    ctx.beginPath();
    ctx.strokeStyle = '#58C4DD';
    ctx.lineWidth = 3;
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * i / steps;
      const y = sigmoid(x);
      const px = tx(x), py = ty(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Decision boundary marker (where g(z) = 0.5, i.e., z = 0 → x = -b/w)
    if (w !== 0) {
      const xBound = -b / w;
      if (xBound >= xMin && xBound <= xMax) {
        ctx.beginPath();
        ctx.arc(tx(xBound), ty(0.5), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFF00';
        ctx.fill();

        // Vertical dashed line at boundary
        ctx.strokeStyle = 'rgba(255,255,0,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(tx(xBound), oy);
        ctx.lineTo(tx(xBound), oy - ph);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Color regions
    if (w !== 0) {
      const xBound = -b / w;
      // Region ŷ=1 (right of boundary for w>0, left for w<0)
      const x1Start = w > 0 ? Math.max(xBound, xMin) : xMin;
      const x1End = w > 0 ? xMax : Math.min(xBound, xMax);
      if (x1Start < x1End) {
        ctx.fillStyle = 'rgba(252,98,85,0.08)';
        ctx.fillRect(tx(x1Start), oy - ph, tx(x1End) - tx(x1Start), ph);
      }
      // Region ŷ=0
      const x0Start = w > 0 ? xMin : Math.max(xBound, xMin);
      const x0End = w > 0 ? Math.min(xBound, xMax) : xMax;
      if (x0Start < x0End) {
        ctx.fillStyle = 'rgba(88,196,221,0.08)';
        ctx.fillRect(tx(x0Start), oy - ph, tx(x0End) - tx(x0Start), ph);
      }
    }

    // Info panel
    const infoX = ox + pw + 25;
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Función Sigmoid', infoX, 30);

    ctx.font = '11px Fira Code';
    ctx.fillStyle = '#58C4DD';
    ctx.fillText('g(z) = 1/(1+e⁻ᶻ)', infoX, 55);

    ctx.fillStyle = '#a8a290';
    ctx.fillText('z = w·x + b', infoX, 80);

    ctx.fillStyle = '#83C167';
    ctx.font = '12px Fira Code';
    ctx.fillText('w = ' + w.toFixed(1), infoX, 115);
    ctx.fillText('b = ' + b.toFixed(1), infoX, 137);

    if (w !== 0) {
      const xBound = -b / w;
      ctx.fillStyle = '#FFFF00';
      ctx.font = '11px Fira Code';
      ctx.fillText('Frontera:', infoX, 170);
      ctx.fillText('x = ' + xBound.toFixed(2), infoX, 190);
    }

    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code';
    ctx.fillText('w > 0: curva ↗', infoX, 225);
    ctx.fillText('w < 0: curva ↘', infoX, 243);
    ctx.fillText('|w| grande: más', infoX, 261);
    ctx.fillText('  empinada', infoX, 277);
    ctx.fillText('b: desplaza', infoX, 300);
    ctx.fillText('  lateralmente', infoX, 316);
  }

  // Sliders
  const wSlider = document.getElementById('sigmoid-w-slider');
  const bSlider = document.getElementById('sigmoid-b-slider');
  const wLabel = document.getElementById('sigmoid-w-value');
  const bLabel = document.getElementById('sigmoid-b-value');

  if (wSlider) {
    wSlider.addEventListener('input', function() {
      w = parseFloat(this.value);
      if (wLabel) wLabel.textContent = w.toFixed(1);
      draw();
    });
  }
  if (bSlider) {
    bSlider.addEventListener('input', function() {
      b = parseFloat(this.value);
      if (bLabel) bLabel.textContent = b.toFixed(1);
      draw();
    });
  }

  draw();
}

// ============================================================
// Regularization Widget — illustrative version.
// Three predetermined boundary curves interpolated by λ:
//   λ small → highly oscillating curve (overfit)
//   λ medium → smooth parabola (right fit)
//   λ large → straight line (underfit)
// Data: overlapping classes (not linearly separable).
// ============================================================

function initRegularizationWidget(_unusedData) {
  const canvas = document.getElementById('regularization-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Overlapping dataset, parabolic-ish underlying trend, plenty of noise.
  const class0 = [
    [0.6, 6.4], [1.0, 5.8], [1.4, 5.2], [1.9, 5.5], [2.4, 4.7],
    [2.9, 4.2], [3.4, 4.7], [3.9, 4.3], [4.4, 4.8], [4.9, 5.0],
    [5.4, 5.6], [5.9, 6.1], [6.4, 6.4],
    [1.2, 6.2], [2.7, 5.8], [3.7, 5.5], [4.7, 5.7], [5.7, 4.7],
    [2.2, 6.0], [4.2, 6.2],
    // Noise (blue in red zone)
    [2.0, 2.7], [3.5, 2.0], [4.8, 2.5], [1.5, 3.2]
  ];
  const class1 = [
    [0.6, 3.6], [1.0, 2.8], [1.4, 2.3], [1.9, 1.8], [2.4, 1.3],
    [2.9, 1.2], [3.4, 0.9], [3.9, 1.1], [4.4, 1.4], [4.9, 1.7],
    [5.4, 2.2], [5.9, 2.7], [6.4, 3.5],
    [1.7, 1.0], [3.1, 1.8], [4.5, 1.9], [2.5, 0.7], [5.1, 0.8],
    [3.7, 1.6], [4.1, 0.6],
    // Noise (red in blue zone)
    [1.6, 4.7], [3.3, 4.3], [5.2, 4.2], [2.7, 5.0]
  ];

  const ox = 50, oy = H - 45;
  const pw = W - 220, ph = H - 80;
  const xMin = 0, xMax = 7, yMin = 0, yMax = 7;

  let lambda = 0.0;

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

  // The three reference curves, all expressed as y = f(x).
  function yOverfit(x) {
    // High-frequency oscillations that wrap around clusters
    return 3.5
      + 1.6 * Math.sin(2.2 * x - 0.5)
      + 0.8 * Math.sin(5.5 * x + 1.0)
      - 0.3 * Math.cos(3.8 * x);
  }
  function yRightFit(x) {
    // Smooth parabola opening downward
    return 4.6 - 0.32 * (x - 3.3) * (x - 3.3);
  }
  function yUnderfit(x) {
    // Diagonal straight line
    return 4.6 - 0.28 * x;
  }

  // Smooth interpolation between the three curves based on λ.
  // λ ∈ [0, 5]   : overfit  → right-fit
  // λ ∈ [5, 50]  : right-fit → underfit (linear)
  function boundaryY(x, lam) {
    if (lam <= 5) {
      const t = lam / 5;
      const s = t * t * (3 - 2 * t); // smoothstep
      return (1 - s) * yOverfit(x) + s * yRightFit(x);
    } else {
      const t = (lam - 5) / 45;
      const s = Math.min(1, t);
      const ss = s * s * (3 - 2 * s);
      return (1 - ss) * yRightFit(x) + ss * yUnderfit(x);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Light decision-region tint (class0 above boundary, class1 below).
    const step = 4;
    for (let py = oy - ph; py <= oy; py += step) {
      for (let px = ox; px <= ox + pw; px += step) {
        const x = xMin + (px - ox) / pw * (xMax - xMin);
        const y = yMax - (py - (oy - ph)) / ph * (yMax - yMin);
        const yBoundary = boundaryY(x, lambda);
        ctx.fillStyle = (y > yBoundary) ? 'rgba(88,196,221,0.12)' : 'rgba(252,98,85,0.12)';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 7; i++) {
      ctx.beginPath(); ctx.moveTo(tx(i), oy); ctx.lineTo(tx(i), oy - ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, ty(i)); ctx.lineTo(ox + pw, ty(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();

    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 7; i++) ctx.fillText(i, tx(i), oy + 14);
    ctx.textAlign = 'right';
    for (let i = 0; i <= 7; i++) ctx.fillText(i, ox - 5, ty(i) + 3);

    // Decision boundary (yellow line)
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const samples = 400;
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = boundaryY(x, lambda);
      const yClamped = Math.max(yMin, Math.min(yMax, y));
      const px = tx(x);
      const py = ty(yClamped);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Data points
    class0.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#58C4DD';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    class1.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Info panel
    const infoX = ox + pw + 15;
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 12px Fira Code';
    ctx.textAlign = 'left';
    ctx.fillText('Regularización', infoX, 30);

    ctx.fillStyle = '#83C167';
    ctx.font = '12px Fira Code';
    ctx.fillText('λ = ' + lambda.toFixed(2), infoX, 60);

    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code';
    if (lambda < 1.5) {
      ctx.fillText('λ pequeño:', infoX, 90);
      ctx.fillStyle = '#FC6255';
      ctx.fillText('Overfitting', infoX, 108);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('(frontera', infoX, 126);
      ctx.fillText(' contorsionada)', infoX, 142);
    } else if (lambda > 20) {
      ctx.fillText('λ grande:', infoX, 90);
      ctx.fillStyle = '#58C4DD';
      ctx.fillText('Underfitting', infoX, 108);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('(frontera', infoX, 126);
      ctx.fillText(' lineal)', infoX, 142);
    } else {
      ctx.fillText('λ moderado:', infoX, 90);
      ctx.fillStyle = '#83C167';
      ctx.fillText('Right fit', infoX, 108);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('(curva', infoX, 126);
      ctx.fillText(' suave)', infoX, 142);
    }
  }

  const slider = document.getElementById('reg-lambda-slider');
  const lamLabel = document.getElementById('reg-lambda-value');
  if (slider) {
    slider.addEventListener('input', function() {
      lambda = parseFloat(this.value);
      if (lamLabel) lamLabel.textContent = lambda.toFixed(2);
      draw();
    });
  }

  draw();
}

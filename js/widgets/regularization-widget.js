// ============================================================
// Regularization Widget
// Shows how λ affects the decision boundary complexity
// Slider for λ: 0 = overfitting, large = smooth boundary
// ============================================================

function initRegularizationWidget(data) {
  const canvas = document.getElementById('regularization-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const class0 = data.class0;
  const class1 = data.class1;

  // Chart area
  const ox = 50, oy = H - 45;
  const pw = W - 220, ph = H - 80;
  const xMin = -1, xMax = 7, yMin = -1, yMax = 7;

  let lambda = 0.1;

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

  // Generate polynomial features for a point (degree 4)
  // Track degree of each feature for selective regularization
  const featureDegrees = [];
  (function() {
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4 - i; j++) {
        featureDegrees.push(i + j);
      }
    }
  })();

  function polyFeatures(x1, x2) {
    const feats = [];
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4 - i; j++) {
        feats.push(Math.pow(x1, i) * Math.pow(x2, j));
      }
    }
    return feats;
  }

  // Compute weights using regularized logistic regression (simplified gradient descent)
  function trainModel(lam) {
    // Combine data
    const points = [];
    class0.forEach(p => points.push({ x: p, y: 0 }));
    class1.forEach(p => points.push({ x: p, y: 1 }));

    const m = points.length;
    const nFeats = polyFeatures(0, 0).length;
    const w = new Array(nFeats).fill(0);

    // Adaptive learning rate and iterations for stability
    const alpha = 0.3 / (1 + lam * 0.03);
    const iters = 800;

    // Precompute features for all points
    const allFeats = points.map(p => polyFeatures(p.x[0], p.x[1]));

    for (let iter = 0; iter < iters; iter++) {
      const grad = new Array(nFeats).fill(0);
      for (let i = 0; i < m; i++) {
        const feats = allFeats[i];
        let z = 0;
        for (let j = 0; j < nFeats; j++) z += w[j] * feats[j];
        // Clamp z to avoid overflow in exp
        const zc = Math.max(-30, Math.min(30, z));
        const pred = 1.0 / (1.0 + Math.exp(-zc));
        const err = pred - points[i].y;
        for (let j = 0; j < nFeats; j++) {
          grad[j] += err * feats[j] / m;
        }
      }
      // Update with regularization
      // Don't regularize bias (degree 0) or linear terms (degree 1)
      // This ensures high λ → only linear terms survive → linear boundary
      for (let j = 0; j < nFeats; j++) {
        const deg = featureDegrees[j];
        const regScale = (deg <= 1) ? 0 : lam / m;
        const reg = regScale * w[j];
        w[j] -= alpha * (grad[j] + reg);
      }
    }
    return w;
  }

  // Predict probability
  function predict(w, x1, x2) {
    const feats = polyFeatures(x1, x2);
    let z = 0;
    for (let j = 0; j < feats.length; j++) z += w[j] * feats[j];
    return 1.0 / (1.0 + Math.exp(-z));
  }

  let weights = trainModel(lambda);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Draw decision regions (pixelated for speed)
    const step = 4;
    for (let py = oy - ph; py <= oy; py += step) {
      for (let px = ox; px <= ox + pw; px += step) {
        const x1 = xMin + (px - ox) / pw * (xMax - xMin);
        const x2 = yMax - (py - (oy - ph)) / ph * (yMax - yMin);
        const prob = predict(weights, x1, x2);
        if (prob >= 0.5) {
          ctx.fillStyle = 'rgba(252,98,85,0.15)';
        } else {
          ctx.fillStyle = 'rgba(88,196,221,0.15)';
        }
        ctx.fillRect(px, py, step, step);
      }
    }

    // Draw decision boundary (contour at prob = 0.5)
    const resolution = 2;
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2.5;

    // March through grid finding boundary crossings
    for (let py = oy - ph; py <= oy; py += resolution) {
      for (let px = ox; px <= ox + pw; px += resolution) {
        const x1 = xMin + (px - ox) / pw * (xMax - xMin);
        const x2 = yMax - (py - (oy - ph)) / ph * (yMax - yMin);
        const x1r = xMin + (px + resolution - ox) / pw * (xMax - xMin);
        const x2b = yMax - (py + resolution - (oy - ph)) / ph * (yMax - yMin);

        const p00 = predict(weights, x1, x2);
        const p10 = predict(weights, x1r, x2);
        const p01 = predict(weights, x1, x2b);

        // Check if boundary crosses this cell
        if ((p00 >= 0.5) !== (p10 >= 0.5) || (p00 >= 0.5) !== (p01 >= 0.5)) {
          ctx.fillStyle = '#FFFF00';
          ctx.fillRect(px, py, resolution, resolution);
        }
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

    // Axis numbers
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i, tx(i), oy + 14);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i, ox - 5, ty(i) + 3);
    }

    // Draw data points
    class0.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 7, 0, Math.PI * 2);
      ctx.fillStyle = '#58C4DD';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    class1.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 7, 0, Math.PI * 2);
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
    if (lambda < 0.05) {
      ctx.fillText('λ ≈ 0:', infoX, 90);
      ctx.fillStyle = '#FC6255';
      ctx.fillText('Overfitting', infoX, 108);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('(frontera', infoX, 126);
      ctx.fillText(' compleja)', infoX, 142);
    } else if (lambda > 5) {
      ctx.fillText('λ grande:', infoX, 90);
      ctx.fillStyle = '#58C4DD';
      ctx.fillText('Underfitting', infoX, 108);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('(frontera', infoX, 126);
      ctx.fillText(' demasiado', infoX, 142);
      ctx.fillText(' simple)', infoX, 158);
    } else {
      ctx.fillText('λ moderado:', infoX, 90);
      ctx.fillStyle = '#83C167';
      ctx.fillText('Buen balance', infoX, 108);
    }

    // Norm of weights
    let wNorm = 0;
    for (let j = 1; j < weights.length; j++) wNorm += weights[j] * weights[j];
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code';
    ctx.fillText('||w||² = ', infoX, 185);
    ctx.fillText(wNorm.toFixed(1), infoX, 201);
  }

  // Slider
  const slider = document.getElementById('reg-lambda-slider');
  const lamLabel = document.getElementById('reg-lambda-value');
  if (slider) {
    slider.addEventListener('input', function() {
      lambda = parseFloat(this.value);
      if (lamLabel) lamLabel.textContent = lambda.toFixed(2);
      weights = trainModel(lambda);
      draw();
    });
  }

  draw();
}

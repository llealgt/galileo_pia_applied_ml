// ============================================================
// Multi-Regression Widget
// Sliders for w1..w4 + b to predict house prices
// ============================================================

function initMultiRegressionWidget(data) {
  const canvas = document.getElementById('multi-regression-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const X = data.X;
  const yTrue = data.y;
  const featureNames = ['Tamaño', 'Habs', 'Pisos', 'Edad'];
  const m = X.length;
  const n = X[0].length;

  // State
  let weights = [200, 10, 50, -3];
  let bias = 50;

  // Layout
  const sliderX = 20, sliderW = 150;
  const chartX = 210, chartW = W - 230;
  const topPad = 20;

  // Compute predictions
  function predict() {
    return X.map(row => {
      let f = bias;
      for (let j = 0; j < n; j++) f += weights[j] * row[j];
      return f;
    });
  }

  // Compute MSE
  function mse(preds) {
    let s = 0;
    for (let i = 0; i < m; i++) s += (preds[i] - yTrue[i]) ** 2;
    return s / (2 * m);
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const preds = predict();
    const cost = mse(preds);

    // Draw sliders area
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Parámetros', sliderX, topPad + 5);

    const sliderConfigs = [
      { label: 'w₁ (Tam)', min: -100, max: 500, color: '#58C4DD' },
      { label: 'w₂ (Hab)', min: -100, max: 200, color: '#83C167' },
      { label: 'w₃ (Pis)', min: -200, max: 300, color: '#FF862F' },
      { label: 'w₄ (Edad)', min: -20, max: 20, color: '#FC6255' },
      { label: 'b (bias)', min: -200, max: 400, color: '#FFFF00' }
    ];

    const sliderStartY = topPad + 25;
    const sliderSpacing = 62;

    for (let s = 0; s < sliderConfigs.length; s++) {
      const cfg = sliderConfigs[s];
      const y = sliderStartY + s * sliderSpacing;
      const val = s < n ? weights[s] : bias;

      // Label
      ctx.fillStyle = cfg.color;
      ctx.font = '11px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cfg.label, sliderX, y);

      // Value
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), sliderX + sliderW, y);

      // Slider track
      const trackY = y + 12;
      ctx.fillStyle = '#232340';
      ctx.fillRect(sliderX, trackY, sliderW, 6);
      ctx.fillStyle = 'rgba(88,196,221,0.3)';
      ctx.fillRect(sliderX, trackY, sliderW, 6);

      // Slider thumb
      const t = (val - cfg.min) / (cfg.max - cfg.min);
      const thumbX = sliderX + t * sliderW;
      ctx.beginPath();
      ctx.arc(thumbX, trackY + 3, 7, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color;
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Min/Max labels
      ctx.fillStyle = '#a8a290';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cfg.min, sliderX, trackY + 18);
      ctx.textAlign = 'right';
      ctx.fillText(cfg.max, sliderX + sliderW, trackY + 18);
    }

    // Draw chart - bar chart comparison
    const barAreaX = chartX + 20;
    const barAreaW = chartW - 40;
    const barAreaY = topPad + 30;
    const barAreaH = H - 80;
    const barGroupW = barAreaW / m;
    const barW = barGroupW * 0.35;

    // Title
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Predicción vs Real (precio $1000s)', chartX + chartW / 2, topPad + 5);

    // Y axis scale
    const maxY = Math.max(...yTrue, ...preds.map(Math.abs), 100);
    const yScale = barAreaH / (maxY * 1.2);

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barAreaX, barAreaY);
    ctx.lineTo(barAreaX, barAreaY + barAreaH);
    ctx.lineTo(barAreaX + barAreaW, barAreaY + barAreaH);
    ctx.stroke();

    // Y grid + labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxY * 1.1; v += 100) {
      const y = barAreaY + barAreaH - v * yScale;
      if (y < barAreaY) break;
      ctx.fillText(v.toFixed(0), barAreaX - 5, y + 3);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(barAreaX, y);
      ctx.lineTo(barAreaX + barAreaW, y);
      ctx.stroke();
    }

    // Bars
    for (let i = 0; i < m; i++) {
      const gx = barAreaX + i * barGroupW + barGroupW * 0.1;
      const baseline = barAreaY + barAreaH;

      // True bar
      const trueH = Math.max(0, yTrue[i]) * yScale;
      ctx.fillStyle = 'rgba(88,196,221,0.6)';
      ctx.fillRect(gx, baseline - trueH, barW, trueH);
      ctx.strokeStyle = '#58C4DD';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, baseline - trueH, barW, trueH);

      // Predicted bar
      const predH = Math.max(0, preds[i]) * yScale;
      const predNeg = preds[i] < 0;
      ctx.fillStyle = predNeg ? 'rgba(252,98,85,0.4)' : 'rgba(255,134,47,0.6)';
      ctx.fillRect(gx + barW + 2, baseline - (predNeg ? 0 : predH), barW, predNeg ? Math.abs(preds[i]) * yScale : predH);
      ctx.strokeStyle = predNeg ? '#FC6255' : '#FF862F';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx + barW + 2, baseline - (predNeg ? 0 : predH), barW, predNeg ? Math.abs(preds[i]) * yScale : predH);

      // House label
      ctx.fillStyle = '#a8a290';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Casa ' + (i + 1), gx + barW, baseline + 14);

      // Error
      const err = Math.abs(preds[i] - yTrue[i]);
      if (err > 5) {
        ctx.fillStyle = err > 100 ? '#FC6255' : '#FFFF00';
        ctx.font = '8px Fira Code, monospace';
        ctx.fillText('±' + err.toFixed(0), gx + barW, baseline - Math.max(trueH, predH) - 5);
      }
    }

    // Legend
    ctx.fillStyle = '#58C4DD';
    ctx.fillRect(chartX + chartW - 150, topPad + 20, 12, 12);
    ctx.fillStyle = '#ece6d0';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Real', chartX + chartW - 134, topPad + 30);

    ctx.fillStyle = '#FF862F';
    ctx.fillRect(chartX + chartW - 150, topPad + 36, 12, 12);
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Predicción', chartX + chartW - 134, topPad + 46);

    // Cost display
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('J(w⃗,b) = ' + cost.toFixed(1), chartX + chartW / 2, H - 10);
  }

  // Mouse interaction
  let dragging = null;
  const sliderConfigs = [
    { min: -100, max: 500 },
    { min: -100, max: 200 },
    { min: -200, max: 300 },
    { min: -20, max: 20 },
    { min: -200, max: 400 }
  ];

  function getSliderIndex(x, y) {
    const sliderStartY = topPad + 25;
    for (let s = 0; s < 5; s++) {
      const trackY = sliderStartY + s * 62 + 12;
      if (x >= sliderX - 5 && x <= sliderX + sliderW + 5 &&
          y >= trackY - 10 && y <= trackY + 16) {
        return s;
      }
    }
    return -1;
  }

  function updateSlider(idx, x) {
    const t = Math.max(0, Math.min(1, (x - sliderX) / sliderW));
    const cfg = sliderConfigs[idx];
    const val = cfg.min + t * (cfg.max - cfg.min);
    if (idx < 4) {
      weights[idx] = Math.round(val * 10) / 10;
    } else {
      bias = Math.round(val * 10) / 10;
    }
    draw();
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    const idx = getSliderIndex(sx, sy);
    if (idx >= 0) {
      dragging = idx;
      updateSlider(idx, sx);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (dragging === null) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    updateSlider(dragging, sx);
  });

  canvas.addEventListener('mouseup', () => { dragging = null; });
  canvas.addEventListener('mouseleave', () => { dragging = null; });

  draw();
}

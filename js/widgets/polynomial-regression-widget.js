// ============================================================
// Polynomial Regression Widget
// Toggle between linear, quadratic, cubic, sqrt fits
// Shows R², equation, and fitted curve on scatter plot
// ============================================================

function initPolynomialWidget(data) {
  const canvas = document.getElementById('polynomial-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const xData = data.x;
  const yData = data.y;
  const m = xData.length;

  // Chart area
  const ox = 70, oy = H - 50;
  const pw = W - 320, ph = H - 90;
  const xMin = 0, xMax = 8;
  const yMin = -5, yMax = 60;

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

  // Fit models using least squares (normal equation)
  function fitModel(type) {
    // Build design matrix
    let X;
    switch (type) {
      case 'linear':
        X = xData.map(x => [1, x]);
        break;
      case 'quadratic':
        X = xData.map(x => [1, x, x * x]);
        break;
      case 'cubic':
        X = xData.map(x => [1, x, x * x, x * x * x]);
        break;
      case 'sqrt':
        X = xData.map(x => [1, x, Math.sqrt(x)]);
        break;
    }

    // Normal equation: θ = (XᵀX)⁻¹Xᵀy
    const n = X[0].length;
    const XtX = Array.from({ length: n }, () => Array(n).fill(0));
    const Xty = Array(n).fill(0);

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        Xty[j] += X[i][j] * yData[i];
        for (let k = 0; k < n; k++) {
          XtX[j][k] += X[i][j] * X[i][k];
        }
      }
    }

    // Simple matrix inverse for small n (Gauss-Jordan)
    const aug = XtX.map((row, i) => [...row, Xty[i]]);
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
      }
      [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
      const pivot = aug[i][i];
      if (Math.abs(pivot) < 1e-10) return null;
      for (let j = 0; j <= n; j++) aug[i][j] /= pivot;
      for (let k = 0; k < n; k++) {
        if (k === i) continue;
        const factor = aug[k][i];
        for (let j = 0; j <= n; j++) aug[k][j] -= factor * aug[i][j];
      }
    }

    const theta = aug.map(row => row[n]);

    // Prediction function
    let predict;
    switch (type) {
      case 'linear':
        predict = (x) => theta[0] + theta[1] * x;
        break;
      case 'quadratic':
        predict = (x) => theta[0] + theta[1] * x + theta[2] * x * x;
        break;
      case 'cubic':
        predict = (x) => theta[0] + theta[1] * x + theta[2] * x * x + theta[3] * x * x * x;
        break;
      case 'sqrt':
        predict = (x) => theta[0] + theta[1] * x + theta[2] * Math.sqrt(x);
        break;
    }

    // R²
    const yMean = yData.reduce((a, b) => a + b, 0) / m;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < m; i++) {
      const pred = predict(xData[i]);
      ssTot += (yData[i] - yMean) ** 2;
      ssRes += (yData[i] - pred) ** 2;
    }
    const r2 = 1 - ssRes / ssTot;

    return { theta, predict, r2, type };
  }

  // Model types
  const types = ['linear', 'quadratic', 'cubic', 'sqrt'];
  const labels = ['Lineal', 'Cuadrática', 'Cúbica', '√x'];
  const colors = ['#58C4DD', '#83C167', '#FF862F', '#9A72AC'];
  const equations = {
    linear: (t) => `f(x) = ${t[1].toFixed(2)}x + ${t[0].toFixed(2)}`,
    quadratic: (t) => `f(x) = ${t[2].toFixed(3)}x² + ${t[1].toFixed(2)}x + ${t[0].toFixed(2)}`,
    cubic: (t) => `f(x) = ${t[3].toFixed(4)}x³ + ${t[2].toFixed(3)}x² + ${t[1].toFixed(2)}x + ${t[0].toFixed(1)}`,
    sqrt: (t) => `f(x) = ${t[1].toFixed(2)}x + ${t[2].toFixed(2)}√x + ${t[0].toFixed(2)}`
  };

  let activeType = 'linear';
  const models = {};
  types.forEach(t => { models[t] = fitModel(t); });

  function draw() {
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 0.5;
    for (let v = 0; v <= xMax; v++) {
      ctx.beginPath(); ctx.moveTo(tx(v), oy); ctx.lineTo(tx(v), oy - ph); ctx.stroke();
    }
    for (let v = 0; v <= yMax; v += 10) {
      ctx.beginPath(); ctx.moveTo(ox, ty(v)); ctx.lineTo(ox + pw, ty(v)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - ph);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox + pw, oy);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let v = 1; v <= 7; v++) ctx.fillText(v, tx(v), oy + 15);
    ctx.textAlign = 'right';
    for (let v = 0; v <= yMax; v += 10) ctx.fillText(v, ox - 5, ty(v) + 4);
    ctx.textAlign = 'center';
    ctx.fillText('x', ox + pw / 2, oy + 30);
    ctx.save();
    ctx.translate(ox - 35, oy - ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y', 0, 0);
    ctx.restore();

    // Data points
    for (let i = 0; i < m; i++) {
      ctx.beginPath();
      ctx.arc(tx(xData[i]), ty(yData[i]), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw active model curve
    const model = models[activeType];
    if (model) {
      const typeIdx = types.indexOf(activeType);
      ctx.strokeStyle = colors[typeIdx];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let px = 0.3; px <= xMax; px += 0.05) {
        const py = model.predict(px);
        const sx = tx(px), sy = ty(py);
        if (sy > oy - ph - 20 && sy < oy + 20) {
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Buttons panel (right side)
    const btnX = ox + pw + 30;
    const btnW = W - btnX - 15;
    const btnH = 36;

    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Modelo:', btnX, topInfoY(0) - 10);

    for (let i = 0; i < types.length; i++) {
      const y = topInfoY(0) + i * (btnH + 6);
      const isActive = types[i] === activeType;
      ctx.fillStyle = isActive ? `rgba(${hexToRgb(colors[i])},0.2)` : 'rgba(255,255,255,0.03)';
      ctx.fillRect(btnX, y, btnW, btnH);
      ctx.strokeStyle = isActive ? colors[i] : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(btnX, y, btnW, btnH);
      ctx.fillStyle = isActive ? colors[i] : '#a8a290';
      ctx.font = '12px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], btnX + btnW / 2, y + 23);
    }

    // Info panel
    if (model) {
      const infoY = topInfoY(0) + types.length * (btnH + 6) + 15;
      const typeIdx = types.indexOf(activeType);

      ctx.fillStyle = colors[typeIdx];
      ctx.font = 'bold 12px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('R² = ' + model.r2.toFixed(4), btnX, infoY);

      ctx.fillStyle = '#ece6d0';
      ctx.font = '10px Fira Code, monospace';
      const eqText = equations[activeType](model.theta);
      // Word wrap equation
      const maxLineW = btnW;
      wrapText(ctx, eqText, btnX, infoY + 20, maxLineW, 14);

      // Quality indicator
      const qualY = infoY + 55;
      let quality, qualColor;
      if (model.r2 > 0.99) { quality = 'Excelente'; qualColor = '#83C167'; }
      else if (model.r2 > 0.95) { quality = 'Muy bueno'; qualColor = '#58C4DD'; }
      else if (model.r2 > 0.85) { quality = 'Bueno'; qualColor = '#FFFF00'; }
      else { quality = 'Mejorable'; qualColor = '#FC6255'; }

      ctx.fillStyle = qualColor;
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillText('Ajuste: ' + quality, btnX, qualY);
    }
  }

  function topInfoY(offset) { return 30 + offset; }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const chars = text.split('');
    let line = '';
    let ly = y;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line, x, ly);
        line = chars[i];
        ly += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, ly);
  }

  // Click handler for buttons
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    const btnX = ox + pw + 30;
    const btnW = W - btnX - 15;
    const btnH = 36;

    for (let i = 0; i < types.length; i++) {
      const y = topInfoY(0) + i * (btnH + 6);
      if (mx >= btnX && mx <= btnX + btnW && my >= y && my <= y + btnH) {
        activeType = types[i];
        draw();
        return;
      }
    }
  });

  draw();
}

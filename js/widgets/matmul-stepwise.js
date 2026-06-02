// ============================================================
// Matrix Multiplication Stepwise Widget
// Muestra A (2×3) · B (3×2) = C (2×2) y, al presionar "Siguiente",
// calcula una celda C[i,j] a la vez resaltando la fila i de A y la
// columna j de B, y mostrando el dot product completo. Al final
// menciona cómo esto simplifica forward propagation.
// ============================================================

function initMatmulStepwise() {
  const canvas = document.getElementById('matmul-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const nextBtn = document.getElementById('mm-next-btn');
  const resetBtn = document.getElementById('mm-reset-btn');
  const stepLbl = document.getElementById('mm-step');

  // Matrices (valores prediseñados; cálculo verificado)
  const A = [[1, 2, 3], [4, 5, 6]];                    // 2×3
  const B = [[7, 8], [9, 10], [11, 12]];               // 3×2
  const C = [[58, 64], [139, 154]];                    // 2×2 = A·B
  const order = [[0, 0], [0, 1], [1, 0], [1, 1]];      // row-major

  let step = 0;
  const TOTAL = 5;

  // ---- layout ----
  const cs = 42;                                       // tamaño de celda
  const Aw = 3 * cs, Ah = 2 * cs;
  const Bw = 2 * cs, Bh = 3 * cs;
  const Cw = 2 * cs, Ch = 2 * cs;
  const yMid = 100;                                    // centro vertical de las matrices
  const ay = yMid - Ah / 2;                            // A top-y
  const by = yMid - Bh / 2;                            // B top-y
  const cyy = yMid - Ch / 2;                           // C top-y
  // x positions
  const Ax = 60;
  const sym1X = Ax + Aw + 24;                          // ×
  const Bx = sym1X + 24;
  const sym2X = Bx + Bw + 24;                          // =
  const Cx = sym2X + 24;

  function drawBrackets(x, y, w, h) {
    ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 2;
    const o = 6, k = 5;
    ctx.beginPath();
    ctx.moveTo(x - o, y); ctx.lineTo(x - o, y + h);
    ctx.moveTo(x - o, y); ctx.lineTo(x - o + k, y);
    ctx.moveTo(x - o, y + h); ctx.lineTo(x - o + k, y + h);
    ctx.moveTo(x + w + o, y); ctx.lineTo(x + w + o, y + h);
    ctx.moveTo(x + w + o, y); ctx.lineTo(x + w + o - k, y);
    ctx.moveTo(x + w + o, y + h); ctx.lineTo(x + w + o - k, y + h);
    ctx.stroke();
  }

  function drawMatrix(M, x, y, label, color, highlight) {
    const rows = M.length, cols = M[0].length;
    ctx.fillStyle = color; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + cols * cs / 2, y - 12);
    drawBrackets(x, y, cols * cs, rows * cs);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const cellX = x + j * cs, cellY = y + i * cs;
        const hi = highlight && highlight(i, j);
        if (hi) { ctx.fillStyle = hi; ctx.fillRect(cellX, cellY, cs, cs); }
        ctx.strokeStyle = 'rgba(168,162,144,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, cs, cs);
        if (M[i][j] !== null && M[i][j] !== undefined) {
          ctx.fillStyle = '#ece6d0'; ctx.font = '15px Fira Code, monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(M[i][j], cellX + cs / 2, cellY + cs / 2);
        }
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    const cellsDone = Math.min(step, 4);
    const computing = (step >= 1 && step <= 4) ? order[step - 1] : null;

    // C mostrada (con celdas ya calculadas)
    const Cshown = [[null, null], [null, null]];
    for (let k = 0; k < cellsDone; k++) {
      const [r, cc] = order[k];
      Cshown[r][cc] = C[r][cc];
    }

    drawMatrix(A, Ax, ay, 'A  (2×3)', '#FF862F', (i, j) =>
      computing && computing[0] === i ? 'rgba(255,255,0,0.32)' : null);

    // símbolos × y =
    ctx.fillStyle = '#a8a290'; ctx.font = 'bold 22px Fira Code, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('×', sym1X, yMid);
    ctx.fillText('=', sym2X, yMid);
    ctx.textBaseline = 'alphabetic';

    drawMatrix(B, Bx, by, 'B  (3×2)', '#58C4DD', (i, j) =>
      computing && computing[1] === j ? 'rgba(255,255,0,0.32)' : null);

    drawMatrix(Cshown, Cx, cyy, 'C = A·B  (2×2)', '#83C167', (i, j) =>
      computing && computing[0] === i && computing[1] === j ? 'rgba(255,255,0,0.32)' : null);

    // --- fórmula / mensaje ---
    if (computing) {
      const [r, cc] = computing;
      const expr = A[r].map((v, k) => v + '·' + B[k][cc]).join(' + ');
      ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 16px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('C[' + r + ', ' + cc + '] = ' + expr + ' = ' + C[r][cc], W / 2, H - 56);
      ctx.fillStyle = '#83C167'; ctx.font = 'italic 13px Fira Code, monospace';
      ctx.fillText('fila ' + r + ' de A  ·  columna ' + cc + ' de B   (dot product)', W / 2, H - 34);
    } else if (step === 0) {
      ctx.fillStyle = '#a8a290'; ctx.font = 'italic 13px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Cada celda  C[i, j]  =  (fila i de A) · (columna j de B)', W / 2, H - 50);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('Presiona "Siguiente" para calcular las 4 celdas una por una.', W / 2, H - 30);
    } else if (step === 5) {
      ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 15px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✓ Matriz C completa — toda construida con dot products fila × columna', W / 2, H - 64);
      ctx.fillStyle = '#5CD0B3'; ctx.font = 'bold 14px Fira Code, monospace';
      ctx.fillText('Forward propagation:   Z = A_in @ W + b', W / 2, H - 42);
      ctx.fillStyle = '#a8a290'; ctx.font = 'italic 11px Fira Code, monospace';
      ctx.fillText('una sola multiplicación de matrices reemplaza el for-loop sobre todas las neuronas', W / 2, H - 22);
    }
  }

  function updateLabel() {
    const L = [
      'Paso 0 / ' + TOTAL + ' — presiona "Siguiente"',
      'Paso 1 / ' + TOTAL + ' — C[0,0]',
      'Paso 2 / ' + TOTAL + ' — C[0,1]',
      'Paso 3 / ' + TOTAL + ' — C[1,0]',
      'Paso 4 / ' + TOTAL + ' — C[1,1]',
      'Paso 5 / ' + TOTAL + ' — ✓ matriz completa'
    ];
    if (stepLbl) stepLbl.textContent = L[step];
  }

  function next() { if (step < TOTAL) { step++; updateLabel(); draw(); } }
  function reset() { step = 0; updateLabel(); draw(); }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (resetBtn) resetBtn.addEventListener('click', reset);

  updateLabel();
  draw();
}

// ============================================================
// Neuron (Sigmoid) Widget — Demand Prediction
// Una neurona logística interactiva: input = precio, salida =
// a = g(w·x + b) = probabilidad de ser "top seller".
// Sliders w, b, x. Muestra la curva sigmoide y el "neuron box".
// ============================================================

function initNeuronSigmoidWidget() {
  const canvas = document.getElementById('neuron-sigmoid-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sW = document.getElementById('ns-w');
  const sB = document.getElementById('ns-b');
  const sX = document.getElementById('ns-x');
  const lW = document.getElementById('ns-w-val');
  const lB = document.getElementById('ns-b-val');
  const lX = document.getElementById('ns-x-val');

  const xMin = 0, xMax = 10;          // precio
  const pad = { l: 52, r: 16, t: 24, b: 40 };
  const pw = 430 - pad.l - pad.r, ph = H - pad.t - pad.b;
  const tx = v => pad.l + (v - xMin) / (xMax - xMin) * pw;
  const ty = v => pad.t + ph - v * ph;   // a en [0,1]
  const sig = z => 1 / (1 + Math.exp(-z));

  function draw() {
    const w = parseFloat(sW.value), b = parseFloat(sB.value), x = parseFloat(sX.value);
    if (lW) lW.textContent = w.toFixed(1);
    if (lB) lB.textContent = b.toFixed(1);
    if (lX) lX.textContent = x.toFixed(1);
    const z = w * x + b, a = sig(z);

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // --- Plot sigmoide ---
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i += 2) { ctx.beginPath(); ctx.moveTo(tx(i), pad.t); ctx.lineTo(tx(i), pad.t + ph); ctx.stroke(); }
    [0, 0.5, 1].forEach(v => { ctx.beginPath(); ctx.moveTo(pad.l, ty(v)); ctx.lineTo(pad.l + pw, ty(v)); ctx.stroke(); });
    // ejes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('precio  x', pad.l + pw / 2, H - 22);
    ctx.textAlign = 'right'; ctx.fillText('1', pad.l - 6, ty(1) + 4); ctx.fillText('0.5', pad.l - 6, ty(0.5) + 4); ctx.fillText('0', pad.l - 6, ty(0) + 4);
    ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
    ctx.fillText('a = P(top seller)', 0, 0); ctx.restore();

    // curva
    ctx.strokeStyle = '#5CD0B3'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const xx = xMin + i / 200 * (xMax - xMin); const yy = sig(w * xx + b); const px = tx(xx), py = ty(yy); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    // umbral 0.5
    ctx.strokeStyle = 'rgba(255,255,0,0.4)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, ty(0.5)); ctx.lineTo(pad.l + pw, ty(0.5)); ctx.stroke(); ctx.setLineDash([]);
    // punto actual
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(tx(x), pad.t + ph); ctx.lineTo(tx(x), ty(a)); ctx.lineTo(pad.l, ty(a)); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(tx(x), ty(a), 6, 0, Math.PI * 2); ctx.fillStyle = '#FC6255'; ctx.fill();
    ctx.strokeStyle = '#1b1b2f'; ctx.stroke();

    // --- Neuron box (derecha) ---
    const cx = 580, cy = 150;
    // input x
    ctx.fillStyle = '#FF862F'; ctx.font = 'bold 14px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x = ' + x.toFixed(1), cx - 130, cy + 5);
    // flecha
    ctx.strokeStyle = '#FF862F'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 95, cy); ctx.lineTo(cx - 45, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 45, cy); ctx.lineTo(cx - 53, cy - 5); ctx.lineTo(cx - 53, cy + 5); ctx.closePath(); ctx.fill();
    // neuron
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(154,114,172,0.25)'; ctx.fill();
    ctx.strokeStyle = '#9A72AC'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText('z=' + z.toFixed(2), cx, cy - 4);
    ctx.fillText('g(z)', cx, cy + 12);
    // salida a
    ctx.strokeStyle = '#FF40FF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 38, cy); ctx.lineTo(cx + 90, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 90, cy); ctx.lineTo(cx + 82, cy - 5); ctx.lineTo(cx + 82, cy + 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FF40FF'; ctx.font = 'bold 18px Fira Code, monospace';
    ctx.fillText('a = ' + a.toFixed(3), cx + 60, cy - 16);
    // veredicto
    ctx.fillStyle = a >= 0.5 ? '#83C167' : '#FC6255'; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText(a >= 0.5 ? 'ŷ = 1 (top seller)' : 'ŷ = 0 (no)', cx, cy + 70);
    // fórmula
    ctx.fillStyle = '#a8a290'; ctx.font = '12px Fira Code, monospace';
    ctx.fillText('a = g(w·x + b) = 1 / (1 + e^-(w·x+b))', cx, cy + 100);
  }

  [sW, sB, sX].forEach(s => s && s.addEventListener('input', draw));
  draw();
}

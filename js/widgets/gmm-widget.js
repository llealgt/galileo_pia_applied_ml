// ============================================================
// GMM (Gaussian Mixture Model) Widget — Soft Clustering
// Misma data que k-means (60 puntos, 3 blobs). Cada paso de EM
// (precomputado offline con numpy) se aplica al presionar el botón.
//   E-step: pinta cada punto con MEZCLA RGB según sus responsibilidades
//   M-step: re-dibuja las elipses de covarianza (μ_k, Σ_k) actualizadas
// Refuerza la idea: GMM es soft (probabilidades), K-means es hard.
// ============================================================

function initGMMWidget() {
  const canvas = document.getElementById('gmm-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const stepBtn = document.getElementById('gmm-step-btn');
  const resetBtn = document.getElementById('gmm-reset-btn');
  const phaseLbl = document.getElementById('gmm-phase');

  // Mismos 60 blobs que el widget de K-means
  const DATA = [[0.138,0.77],[0.922,0.201],[0.896,0.199],[0.066,0.733],[0.067,0.711],[0.835,0.205],[0.05,0.624],[0.875,0.108],[0.93,0.122],[0.06,0.762],[0.405,0.857],[0.118,0.713],[0.402,0.95],[0.402,0.881],[0.872,0.187],[0.357,0.835],[0.092,0.585],[0.408,0.804],[0.115,0.755],[0.378,0.855],[0.832,0.144],[0.05,0.622],[0.391,0.926],[0.075,0.736],[0.426,0.851],[0.835,0.142],[0.077,0.7],[0.42,0.872],[0.116,0.749],[0.379,0.864],[0.107,0.732],[0.881,0.117],[0.4,0.829],[0.844,0.158],[0.355,0.875],[0.882,0.05],[0.075,0.692],[0.118,0.685],[0.93,0.097],[0.382,0.913],[0.871,0.117],[0.092,0.682],[0.95,0.114],[0.379,0.838],[0.347,0.895],[0.398,0.943],[0.927,0.087],[0.071,0.681],[0.404,0.895],[0.078,0.682],[0.082,0.687],[0.359,0.832],[0.05,0.628],[0.901,0.069],[0.901,0.182],[0.866,0.131],[0.408,0.812],[0.412,0.857],[0.066,0.728],[0.069,0.726]];

  // EM snapshots precomputados (numpy offline). Solo (mus, sigs, pis) — responsibilidades se computan en vivo.
  // Phases: init, E, M, E, M, E, M, E, M, E, M
  const SNAPS = [
    { p:'init', mus:[[0.875,0.146],[0.153,0.815],[0.41,0.444]], sigs:[[[0.04,0.0],[0.0,0.04]],[[0.04,0.0],[0.0,0.04]],[[0.04,0.0],[0.0,0.04]]], pis:[0.333,0.333,0.333] },
    { p:'E',    mus:[[0.875,0.146],[0.153,0.815],[0.41,0.444]], sigs:[[[0.04,0.0],[0.0,0.04]],[[0.04,0.0],[0.0,0.04]],[[0.04,0.0],[0.0,0.04]]], pis:[0.333,0.333,0.333] },
    { p:'M',    mus:[[0.88,0.198],[0.198,0.73],[0.389,0.587]],  sigs:[[[0.0027,-0.0011],[-0.0011,0.0059]],[[0.0193,-0.0038],[-0.0038,0.0108]],[[0.0233,-0.0092],[-0.0092,0.0155]]], pis:[0.324,0.38,0.295] },
    { p:'E',    mus:[[0.88,0.198],[0.198,0.73],[0.389,0.587]],  sigs:[[[0.0027,-0.0011],[-0.0011,0.0059]],[[0.0193,-0.0038],[-0.0038,0.0108]],[[0.0233,-0.0092],[-0.0092,0.0155]]], pis:[0.324,0.38,0.295] },
    { p:'M',    mus:[[0.883,0.196],[0.197,0.727],[0.372,0.605]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0191,-0.0031],[-0.0031,0.0107]],[[0.0144,-0.0039],[-0.0039,0.012]]],   pis:[0.333,0.38,0.287] },
    { p:'E',    mus:[[0.883,0.196],[0.197,0.727],[0.372,0.605]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0191,-0.0031],[-0.0031,0.0107]],[[0.0144,-0.0039],[-0.0039,0.012]]],   pis:[0.333,0.38,0.287] },
    { p:'M',    mus:[[0.883,0.196],[0.185,0.729],[0.388,0.603]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0172,-0.0027],[-0.0027,0.0107]],[[0.0103,-0.0018],[-0.0018,0.0113]]], pis:[0.333,0.381,0.285] },
    { p:'E',    mus:[[0.883,0.196],[0.185,0.729],[0.388,0.603]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0172,-0.0027],[-0.0027,0.0107]],[[0.0103,-0.0018],[-0.0018,0.0113]]], pis:[0.333,0.381,0.285] },
    { p:'M',    mus:[[0.883,0.196],[0.166,0.729],[0.413,0.603]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0134,-0.0019],[-0.0019,0.0106]],[[0.0044,0.0003],[0.0003,0.0113]]],   pis:[0.333,0.381,0.286] },
    { p:'E',    mus:[[0.883,0.196],[0.166,0.729],[0.413,0.603]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0134,-0.0019],[-0.0019,0.0106]],[[0.0044,0.0003],[0.0003,0.0113]]],   pis:[0.333,0.381,0.286] },
    { p:'M',    mus:[[0.883,0.196],[0.138,0.731],[0.425,0.611]],sigs:[[[0.0011,0.0001],[0.0001,0.005]],[[0.0065,-0.001],[-0.001,0.0105]],[[0.001,0.001],[0.001,0.0121]]],         pis:[0.333,0.356,0.311] }
  ];
  const COLORS = [
    [252, 98, 85],   // rojo
    [88, 196, 221],  // azul
    [131, 193, 103]  // verde
  ];

  let step = 0;

  const pad = { l: 50, r: 220, t: 30, b: 40 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const tx = x => pad.l + x * pw;
  const ty = y => pad.t + (1 - y) * ph;

  // Computar responsibilities (60 × 3) dada una snapshot
  function computeR(snap) {
    const R = new Array(DATA.length);
    for (let i = 0; i < DATA.length; i++) {
      const probs = [];
      for (let k = 0; k < 3; k++) {
        const dx = DATA[i][0] - snap.mus[k][0];
        const dy = DATA[i][1] - snap.mus[k][1];
        const s = snap.sigs[k];
        const det = s[0][0]*s[1][1] - s[0][1]*s[1][0];
        const inv00 =  s[1][1]/det, inv11 = s[0][0]/det, inv01 = -s[0][1]/det;
        const ex = -0.5 * (dx*(dx*inv00 + dy*inv01) + dy*(dx*inv01 + dy*inv11));
        probs.push(snap.pis[k] * Math.exp(ex) / (2*Math.PI*Math.sqrt(Math.abs(det))));
      }
      const sum = probs[0] + probs[1] + probs[2] + 1e-12;
      R[i] = probs.map(p => p / sum);
    }
    return R;
  }

  // Dibujar elipse de covarianza (1σ)
  function drawCovEllipse(mu, sig, color, alpha) {
    // eigendecomposition de 2x2 simétrica
    const a = sig[0][0], b = sig[0][1], d = sig[1][1];
    const tr = a + d, det = a*d - b*b;
    const lam1 = tr/2 + Math.sqrt(Math.max(0, tr*tr/4 - det));
    const lam2 = tr/2 - Math.sqrt(Math.max(0, tr*tr/4 - det));
    const theta = Math.atan2(lam1 - a, b);
    // semi-ejes en coord-data (multiplica para 2σ visual)
    const r1 = 2.0 * Math.sqrt(Math.max(0, lam1));
    const r2 = 2.0 * Math.sqrt(Math.max(0, lam2));
    // dibujar
    ctx.save();
    ctx.translate(tx(mu[0]), ty(mu[1]));
    ctx.rotate(-theta);
    ctx.scale(r1 * pw, r2 * ph);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI*2);
    ctx.restore();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = color.replace('1)', alpha + ')').replace('rgb', 'rgba').replace(')', alpha === undefined ? ')' : ',' + alpha + ')');
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = 'rgba(168,162,144,0.18)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(pad.l + i*pw/4, pad.t); ctx.lineTo(pad.l + i*pw/4, pad.t+ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t + i*ph/4); ctx.lineTo(pad.l+pw, pad.t + i*ph/4); ctx.stroke();
    }

    const snap = SNAPS[step];
    const R = (snap.p === 'init') ? null : computeR(snap);

    // dibujar elipses de cada componente
    for (let k = 0; k < 3; k++) {
      const c = COLORS[k];
      const cstr = `rgba(${c[0]},${c[1]},${c[2]},`;
      // semi-eje y rotación
      const sig = snap.sigs[k];
      const a = sig[0][0], b = sig[0][1], d = sig[1][1];
      const tr = a + d;
      const disc = Math.sqrt(Math.max(0, tr*tr/4 - (a*d - b*b)));
      const lam1 = tr/2 + disc, lam2 = tr/2 - disc;
      let theta;
      if (Math.abs(b) > 1e-8) {
        theta = Math.atan2(lam1 - a, b);
      } else {
        theta = a >= d ? 0 : Math.PI/2;
      }
      const r1 = 2.0 * Math.sqrt(Math.max(0, lam1));
      const r2 = 2.0 * Math.sqrt(Math.max(0, lam2));

      // dibujar la elipse en pixeles correctamente
      ctx.save();
      ctx.translate(tx(snap.mus[k][0]), ty(snap.mus[k][1]));
      ctx.rotate(-theta);
      // scale (cuidado: ty invierte y)
      ctx.scale(r1 * pw, r2 * ph);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI*2);
      ctx.restore();
      ctx.fillStyle = cstr + '0.10)'; ctx.fill();
      ctx.strokeStyle = cstr + '0.9)'; ctx.lineWidth = 2.5; ctx.stroke();

      // centroide
      ctx.beginPath(); ctx.arc(tx(snap.mus[k][0]), ty(snap.mus[k][1]), 6, 0, Math.PI*2);
      ctx.fillStyle = cstr + '1)'; ctx.fill();
      ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // dibujar puntos coloreados con mezcla RGB según responsibilities
    for (let i = 0; i < DATA.length; i++) {
      let r, g, b;
      if (R === null) {
        r = 168; g = 162; b = 144;
      } else {
        r = Math.round(R[i][0]*COLORS[0][0] + R[i][1]*COLORS[1][0] + R[i][2]*COLORS[2][0]);
        g = Math.round(R[i][0]*COLORS[0][1] + R[i][1]*COLORS[1][1] + R[i][2]*COLORS[2][1]);
        b = Math.round(R[i][0]*COLORS[0][2] + R[i][1]*COLORS[1][2] + R[i][2]*COLORS[2][2]);
      }
      ctx.beginPath(); ctx.arc(tx(DATA[i][0]), ty(DATA[i][1]), 5, 0, Math.PI*2);
      ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // panel derecho
    const px = pad.l + pw + 24;
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('GMM (EM)', px, 50);
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText('iter EM: ' + Math.floor(step/2), px, 72);
    ctx.fillText('paso ' + step + '/' + (SNAPS.length-1), px, 92);

    const phaseColor = snap.p === 'E' ? '#FFFF00' : snap.p === 'M' ? '#83C167' : '#a8a290';
    const phaseText = snap.p === 'init' ? 'inicialización' : snap.p === 'E' ? '① E-STEP' : '② M-STEP';
    const phaseDesc = snap.p === 'init' ? 'gaussianas centradas al azar' :
                      snap.p === 'E' ? 'calcular responsibilidades de cada punto' :
                      'refit gaussianas (μ, Σ) dados los pesos';
    ctx.fillStyle = phaseColor; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText(phaseText, px, 122);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    // wrap descripción
    const words = phaseDesc.split(' ');
    let line = '', y = 142;
    for (const w of words) {
      if ((line + w).length > 22) { ctx.fillText(line, px, y); line = w + ' '; y += 14; }
      else line += w + ' ';
    }
    ctx.fillText(line, px, y);

    // leyenda
    ctx.fillStyle = '#a8a290'; ctx.fillText('π_k (mezcla):', px, 200);
    for (let k = 0; k < 3; k++) {
      const c = COLORS[k];
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.beginPath(); ctx.arc(px + 8, 220 + k*16, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#a8a290';
      ctx.fillText('π_' + (k+1) + ' = ' + snap.pis[k].toFixed(2), px + 22, 224 + k*16);
    }

    if (phaseLbl) phaseLbl.textContent = (snap.p === 'init' ? 'init' : (snap.p === 'E' ? '① E-step' : '② M-step')) + ' · iter ' + Math.floor(step/2);
  }

  function next() {
    if (step < SNAPS.length - 1) step++;
    draw();
  }
  function reset() {
    step = 0; draw();
  }

  if (stepBtn) stepBtn.addEventListener('click', next);
  if (resetBtn) resetBtn.addEventListener('click', reset);
  draw();
}

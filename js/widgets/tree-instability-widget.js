// ============================================================
// Tree Instability Widget
// Demuestra que un cambio pequeño en los datos (voltear la etiqueta
// de UN ejemplo) produce un árbol completamente diferente.
// Click en un animal → cambia su etiqueta → el árbol se reconstruye.
// (Inspirado en "Trees are highly sensitive to small changes", C2_W4.)
// ============================================================

function initTreeInstabilityWidget() {
  const canvas = document.getElementById('tree-instab-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Features: ear/face/whisk (binarias). l = 1 gato, 0 perro.
  // Dataset diseñado: con etiquetas originales la raíz es OREJAS;
  // al voltear el ejemplo idx 3 la raíz pasa a BIGOTES (árbol distinto).
  const FEATURES = [
    { key: 'ear',   name: 'Orejas',  v0: 'Caídas',     v1: 'Puntiagudas', a0: 'C', a1: 'P' },
    { key: 'face',  name: 'Cara',    v0: 'Redonda',    v1: 'No redonda',  a0: 'R', a1: 'N' },
    { key: 'whisk', name: 'Bigotes', v0: 'Ausente',    v1: 'Presente',    a0: '✗', a1: '✓' }
  ];
  const base = [
    { ear: 1, face: 1, whisk: 0, l: 1 },
    { ear: 0, face: 1, whisk: 0, l: 1 },
    { ear: 1, face: 1, whisk: 1, l: 0 },
    { ear: 0, face: 0, whisk: 1, l: 1 }, // ← ejemplo sensible (idx 3)
    { ear: 0, face: 0, whisk: 0, l: 1 },
    { ear: 0, face: 1, whisk: 0, l: 1 },
    { ear: 1, face: 1, whisk: 0, l: 0 },
    { ear: 1, face: 0, whisk: 1, l: 0 },
    { ear: 1, face: 0, whisk: 1, l: 0 },
    { ear: 1, face: 0, whisk: 1, l: 0 }
  ];
  const SENSITIVE = 3;
  let data = base.map(r => ({ ...r }));
  const origLabels = base.map(r => r.l);

  // Emojis por posición (gris/colores variados) — el emoji refleja la etiqueta.
  const catEmoji = ['🐱', '🐱', '🐱', '🐱', '🐱', '🐱', '🐱', '🐱', '🐱', '🐱'];
  const dogEmoji = ['🐶', '🐶', '🐶', '🐶', '🐶', '🐶', '🐶', '🐶', '🐶', '🐶'];

  function Hf(p) { return (p <= 0 || p >= 1) ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); }
  function entropy(rows) { return rows.length ? Hf(rows.filter(r => r.l).length / rows.length) : 0; }

  function buildTree(rows, depth, maxDepth) {
    const cat = rows.filter(r => r.l).length, dog = rows.length - cat;
    const label = cat >= dog ? 1 : 0;
    if (depth >= maxDepth || cat === 0 || dog === 0 || rows.length < 2)
      return { leaf: true, label, cat, dog };
    const par = entropy(rows);
    let best = null;
    for (const f of FEATURES) {
      const A = rows.filter(r => r[f.key] === 0), B = rows.filter(r => r[f.key] === 1);
      if (!A.length || !B.length) continue;
      const ig = par - (A.length / rows.length * entropy(A) + B.length / rows.length * entropy(B));
      if (!best || ig > best.ig + 1e-12) best = { f, ig, A, B };
    }
    if (!best || best.ig <= 1e-9) return { leaf: true, label, cat, dog };
    return {
      leaf: false, feat: best.f, ig: best.ig,
      left: buildTree(best.A, depth + 1, maxDepth),
      right: buildTree(best.B, depth + 1, maxDepth)
    };
  }

  // Layout por conteo de hojas
  function layout(node, depth, out) {
    node._d = depth; out.maxD = Math.max(out.maxD, depth); out.nodes.push(node);
    if (!node.leaf) {
      layout(node.left, depth + 1, out); layout(node.right, depth + 1, out);
      node._x = (node.left._x + node.right._x) / 2;
    } else { node._x = out.leaves++; }
  }

  // Geometría
  const colX = i => 78 + i * ((W - 120) / 9);
  const emojiY = 56;
  const ftY = [78, 92, 106];
  const treeTop = 168, treeBot = H - 16;

  const resetBtn = document.getElementById('ti-reset-btn');

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // Título / instrucción
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Haz click en un animal para cambiar su etiqueta (gato ⇄ perro) y observa cómo el árbol se reconstruye:', 16, 22);

    // Fila de emojis (clickable) + features
    ctx.textAlign = 'left'; ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.fillText('Orejas',  8, ftY[0] + 3);
    ctx.fillText('Cara',    8, ftY[1] + 3);
    ctx.fillText('Bigotes', 8, ftY[2] + 3);

    data.forEach((r, i) => {
      const x = colX(i);
      // resaltar el ejemplo sensible
      if (i === SENSITIVE) {
        ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2;
        roundRect(x - 20, emojiY - 22, 40, 34, 5); ctx.stroke();
      }
      ctx.font = '26px serif'; ctx.textAlign = 'center';
      ctx.fillText(r.l ? '🐱' : '🐶', x, emojiY + 4);
      // features
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = '#58C4DD'; ctx.fillText(r.ear ? 'P' : 'C', x, ftY[0] + 3);
      ctx.fillStyle = '#FF862F'; ctx.fillText(r.face ? 'N' : 'R', x, ftY[1] + 3);
      ctx.fillStyle = '#83C167'; ctx.fillText(r.whisk ? '✓' : '✗', x, ftY[2] + 3);
    });
    ctx.fillStyle = '#FFFF00'; ctx.font = 'italic 9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('↑ prueba este', colX(SENSITIVE), emojiY - 26);

    // Divider
    ctx.strokeStyle = 'rgba(168,162,144,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, 120); ctx.lineTo(W - 12, 120); ctx.stroke();

    // Construir árbol
    const tree = buildTree(data, 0, 3);
    const rootFeat = tree.leaf ? '—' : tree.feat.name;
    const changed = data.some((r, i) => r.l !== origLabels[i]);

    // Banner de raíz
    ctx.textAlign = 'left'; ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillStyle = '#ece6d0'; ctx.fillText('Raíz del árbol:', 16, 145);
    ctx.fillStyle = '#9A72AC'; ctx.fillText(rootFeat, 150, 145);
    if (changed) {
      ctx.fillStyle = '#FC6255'; ctx.font = 'bold 13px Fira Code, monospace';
      ctx.fillText('⚠ cambiaste 1 ejemplo → el árbol se reorganizó por completo', 250, 145);
    } else {
      ctx.fillStyle = '#83C167'; ctx.font = '12px Fira Code, monospace';
      ctx.fillText('(dataset original)', 250, 145);
    }

    // Layout + render del árbol
    const lay = { nodes: [], maxD: 0, leaves: 0 };
    layout(tree, 0, lay);
    const nLeaves = Math.max(lay.leaves, 1);
    const levelH = Math.min(86, (treeBot - treeTop) / (lay.maxD + 0.6));
    const nx = n => 60 + (n._x + 0.5) / nLeaves * (W - 120);
    const ny = n => treeTop + n._d * levelH;
    const HH = 16;

    // aristas
    lay.nodes.forEach(n => {
      if (!n.leaf) {
        const x = nx(n), y = ny(n);
        [['left', n.feat.v0], ['right', n.feat.v1]].forEach(([side, lbl]) => {
          const c = n[side], cx = nx(c), cy = ny(c);
          ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y + HH); ctx.lineTo(cx, cy - HH); ctx.stroke();
          ctx.fillStyle = side === 'left' ? '#58C4DD' : '#FC6255';
          ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'center';
          ctx.fillText(lbl, (x + cx) / 2, (y + cy) / 2 - 1);
        });
      }
    });
    // nodos
    lay.nodes.forEach(n => {
      const x = nx(n), y = ny(n); ctx.textAlign = 'center';
      if (!n.leaf) {
        const w = 96, h = 2 * HH;
        ctx.fillStyle = 'rgba(154,114,172,0.32)'; ctx.strokeStyle = (n._d === 0) ? '#FFFF00' : '#9A72AC';
        ctx.lineWidth = (n._d === 0) ? 2.5 : 1.5;
        roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace';
        ctx.fillText(n.feat.name, x, y + 4);
      } else {
        const w = 78, h = 2 * HH; const isCat = n.label === 1;
        ctx.fillStyle = isCat ? 'rgba(252,98,85,0.3)' : 'rgba(88,196,221,0.3)';
        ctx.strokeStyle = isCat ? '#FC6255' : '#58C4DD'; ctx.lineWidth = 1.5;
        roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = isCat ? '#FC6255' : '#58C4DD'; ctx.font = 'bold 12px Fira Code, monospace';
        ctx.fillText(isCat ? 'Gato' : 'Perro', x, y - 2);
        ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
        ctx.fillText(`🐱${n.cat} 🐶${n.dog}`, x, y + 10);
      }
    });
  }

  // Click → togglear etiqueta del ejemplo más cercano en la fila de emojis
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (my > 115) return; // solo la zona de animales
    let bi = 0, bd = Infinity;
    for (let i = 0; i < data.length; i++) { const d = Math.abs(mx - colX(i)); if (d < bd) { bd = d; bi = i; } }
    if (bd < 46) { data[bi].l = data[bi].l ? 0 : 1; draw(); }
  });
  canvas.style.cursor = 'pointer';

  if (resetBtn) resetBtn.addEventListener('click', () => { data = base.map(r => ({ ...r })); draw(); });

  draw();
}

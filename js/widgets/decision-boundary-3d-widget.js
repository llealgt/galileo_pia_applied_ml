// ============================================================
// Decision Boundary 3D Widget
// Superficie sigmoid σ(w₁x₁ + w₂x₂ + b) con plano threshold
// Usa Plotly.js para renderizado 3D interactivo
// ============================================================

function initDecisionBoundary3DWidget(data) {
  const container = document.getElementById('decision-boundary-3d-plotly');
  if (!container || container.dataset.initialized) return;
  container.dataset.initialized = 'true';

  const w1Slider = document.getElementById('db3d-w1-slider');
  const w2Slider = document.getElementById('db3d-w2-slider');
  const bSlider  = document.getElementById('db3d-b-slider');
  const w1Val = document.getElementById('db3d-w1-value');
  const w2Val = document.getElementById('db3d-w2-value');
  const bVal  = document.getElementById('db3d-b-value');
  const threshCheck = document.getElementById('db3d-thresh-check');

  // Data points from CLASSIFICATION.binary
  const pts0 = data.class0; // array of [x1, x2]
  const pts1 = data.class1;

  // Sigmoid
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

  // Grid for surface
  const N = 50;
  const xMin = -0.5, xMax = 7, yMin = -0.5, yMax = 7.5;
  const xVals = [], yVals = [];
  for (let i = 0; i <= N; i++) {
    xVals.push(xMin + (xMax - xMin) * i / N);
    yVals.push(yMin + (yMax - yMin) * i / N);
  }

  function buildSigmoidSurface(w1, w2, b) {
    const zGrid = [];
    for (let j = 0; j <= N; j++) {
      const row = [];
      for (let i = 0; i <= N; i++) {
        row.push(sigmoid(w1 * xVals[i] + w2 * yVals[j] + b));
      }
      zGrid.push(row);
    }
    return zGrid;
  }

  function buildThresholdPlane() {
    const zGrid = [];
    for (let j = 0; j <= N; j++) {
      const row = [];
      for (let i = 0; i <= N; i++) {
        row.push(0.5);
      }
      zGrid.push(row);
    }
    return zGrid;
  }

  // Initial values
  let w1 = parseFloat(w1Slider.value);
  let w2 = parseFloat(w2Slider.value);
  let b  = parseFloat(bSlider.value);

  // Trace 0: Sigmoid surface
  const sigmoidSurface = {
    x: xVals,
    y: yVals,
    z: buildSigmoidSurface(w1, w2, b),
    type: 'surface',
    colorscale: [
      [0.0,  '#1a3a6b'],
      [0.15, '#2966a8'],
      [0.3,  '#58C4DD'],
      [0.45, '#88ddd0'],
      [0.5,  '#FFFF00'],
      [0.55, '#ffbb55'],
      [0.7,  '#FC6255'],
      [0.85, '#d03030'],
      [1.0,  '#8b1a1a']
    ],
    cmin: 0,
    cmax: 1,
    showscale: true,
    colorbar: {
      title: { text: 'P(y=1)', font: { color: '#ece6d0', size: 11, family: 'Fira Code' } },
      tickfont: { color: '#a8a290', size: 10, family: 'Fira Code' },
      tickvals: [0, 0.25, 0.5, 0.75, 1.0],
      len: 0.6,
      thickness: 15,
      x: 1.02
    },
    contours: {
      z: { show: false }
    },
    lighting: {
      ambient: 0.55,
      diffuse: 0.6,
      specular: 0.2,
      roughness: 0.5
    },
    opacity: 0.85,
    hoverinfo: 'skip',
    name: 'σ(w·x+b)'
  };

  // Trace 1: Threshold plane at z=0.5
  const thresholdPlane = {
    x: xVals,
    y: yVals,
    z: buildThresholdPlane(),
    type: 'surface',
    colorscale: [[0, 'rgba(255,255,0,0.25)'], [1, 'rgba(255,255,0,0.25)']],
    showscale: false,
    opacity: 0.3,
    hoverinfo: 'skip',
    name: 'Threshold 0.5',
    visible: true
  };

  // Trace 2: Class 0 points (blue)
  const class0 = {
    x: pts0.map(p => p[0]),
    y: pts0.map(p => p[1]),
    z: pts0.map(() => 0),
    type: 'scatter3d',
    mode: 'markers',
    marker: {
      size: 6,
      color: '#58C4DD',
      symbol: 'circle',
      line: { color: '#ffffff', width: 1 }
    },
    showlegend: true,
    name: data.labels[0] + ' (y=0)',
    hoverinfo: 'text',
    hovertext: pts0.map(p => `(${p[0].toFixed(1)}, ${p[1].toFixed(1)}) → y=0`)
  };

  // Trace 3: Class 1 points (red)
  const class1 = {
    x: pts1.map(p => p[0]),
    y: pts1.map(p => p[1]),
    z: pts1.map(() => 1),
    type: 'scatter3d',
    mode: 'markers',
    marker: {
      size: 6,
      color: '#FC6255',
      symbol: 'diamond',
      line: { color: '#ffffff', width: 1 }
    },
    showlegend: true,
    name: data.labels[1] + ' (y=1)',
    hoverinfo: 'text',
    hovertext: pts1.map(p => `(${p[0].toFixed(1)}, ${p[1].toFixed(1)}) → y=1`)
  };

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: {
        title: { text: 'x₁', font: { color: '#ece6d0', size: 13 } },
        range: [xMin, xMax],
        color: '#a8a290',
        gridcolor: 'rgba(255,255,255,0.12)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
        tickfont: { size: 10, color: '#a8a290', family: 'Fira Code' }
      },
      yaxis: {
        title: { text: 'x₂', font: { color: '#ece6d0', size: 13 } },
        range: [yMin, yMax],
        color: '#a8a290',
        gridcolor: 'rgba(255,255,255,0.12)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
        tickfont: { size: 10, color: '#a8a290', family: 'Fira Code' }
      },
      zaxis: {
        title: { text: 'σ(z)', font: { color: '#ece6d0', size: 13 } },
        range: [0, 1.05],
        color: '#a8a290',
        gridcolor: 'rgba(255,255,255,0.12)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
        tickfont: { size: 10, color: '#a8a290', family: 'Fira Code' },
        tickvals: [0, 0.25, 0.5, 0.75, 1.0]
      },
      bgcolor: '#0d0d1a',
      camera: {
        eye: { x: 1.8, y: -1.6, z: 0.9 },
        up: { x: 0, y: 0, z: 1 }
      },
      aspectratio: { x: 1, y: 1, z: 0.6 }
    },
    margin: { l: 0, r: 30, t: 10, b: 10 },
    font: { family: 'Fira Code, monospace', color: '#a8a290', size: 10 },
    legend: {
      x: 0.02, y: 0.98,
      bgcolor: 'rgba(13,13,26,0.7)',
      bordercolor: 'rgba(168,162,144,0.3)',
      borderwidth: 1,
      font: { color: '#ece6d0', size: 10, family: 'Fira Code' }
    }
  };

  const traces = [sigmoidSurface, thresholdPlane, class0, class1];

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: false
  });

  // Update function
  function update() {
    w1 = parseFloat(w1Slider.value);
    w2 = parseFloat(w2Slider.value);
    b  = parseFloat(bSlider.value);
    w1Val.textContent = w1.toFixed(1);
    w2Val.textContent = w2.toFixed(1);
    bVal.textContent  = b.toFixed(1);

    const newZ = buildSigmoidSurface(w1, w2, b);
    const showThresh = threshCheck ? threshCheck.checked : true;

    Plotly.restyle(container, {
      z: [newZ]
    }, [0]); // update trace 0 only

    Plotly.restyle(container, {
      visible: [showThresh]
    }, [1]); // update trace 1 visibility
  }

  w1Slider.addEventListener('input', update);
  w2Slider.addEventListener('input', update);
  bSlider.addEventListener('input', update);
  if (threshCheck) {
    threshCheck.addEventListener('change', update);
  }
}

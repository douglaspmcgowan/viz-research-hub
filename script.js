// ===================================================================
// Ways of Thinking — Interactive script
// Starfield background, active nav tracking, small inline demos
// ===================================================================

// ── Starfield ────────────────────────────────────────────────────
(function starfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars;
  const STAR_COUNT = 220;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      tw: Math.random() * Math.PI * 2,  // twinkle phase
      tws: 0.01 + Math.random() * 0.02   // twinkle speed
    }));
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      s.tw += s.tws;
      if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      const twinkle = 0.65 + 0.35 * Math.sin(s.tw);
      const a = s.a * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      // warm vs cool stars
      const warm = (s.r > 1);
      ctx.fillStyle = warm
        ? `rgba(232, 184, 92, ${a})`
        : `rgba(210, 220, 240, ${a})`;
      ctx.fill();
      if (s.r > 1) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        g.addColorStop(0, `rgba(232, 184, 92, ${a * 0.3})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(s.x - s.r * 5, s.y - s.r * 5, s.r * 10, s.r * 10);
      }
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();

// ── Active nav on scroll ─────────────────────────────────────────
(function activeNav() {
  const links = document.querySelectorAll('.sidebar nav a');
  const targets = [...links].map(a => {
    const href = a.getAttribute('href');
    return href.startsWith('#') ? document.querySelector(href) : null;
  });

  function onScroll() {
    const scrollY = window.scrollY + 140;
    let activeIdx = 0;
    targets.forEach((t, i) => {
      if (t && t.offsetTop <= scrollY) activeIdx = i;
    });
    links.forEach((l, i) => l.classList.toggle('active', i === activeIdx));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Tangle.js style reactive number demo ─────────────────────────
(function tangleDemo() {
  const demo = document.getElementById('tangle-demo');
  if (!demo) return;

  // State
  const state = {
    households: 20,      // % of US households
    reduction: 10,       // % reduction per household
  };

  function updateAll() {
    document.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.dataset.bind;
      if (key === 'households') el.textContent = state.households + '%';
      else if (key === 'reduction') el.textContent = state.reduction + '%';
      else if (key === 'savings') {
        const s = (state.households / 100) * (state.reduction / 100) * 100;
        el.textContent = s.toFixed(2) + '%';
      } else if (key === 'power-plants') {
        // 1% national energy ≈ 7 power plants, rough example
        const s = (state.households / 100) * (state.reduction / 100) * 100;
        el.textContent = (s * 7).toFixed(1);
      }
    });
  }

  // Drag to change
  document.querySelectorAll('.tangle-var').forEach(el => {
    let startX, startVal;
    const key = el.dataset.var;
    el.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startVal = state[key];
      function onMove(e) {
        const dx = e.clientX - startX;
        let nv = Math.round(startVal + dx * 0.3);
        nv = Math.max(0, Math.min(100, nv));
        state[key] = nv;
        updateAll();
      }
      function onUp() {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
    // touch
    el.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startVal = state[key];
      function onMove(e) {
        const dx = e.touches[0].clientX - startX;
        let nv = Math.round(startVal + dx * 0.3);
        nv = Math.max(0, Math.min(100, nv));
        state[key] = nv;
        updateAll();
      }
      function onEnd() {
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      }
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onEnd);
    });
  });
  updateAll();
})();

// ── Simple force-directed graph demo ──────────────────────────────
(function graphDemo() {
  const canvas = document.getElementById('graph-demo');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  let w, h;

  // Sample nodes: a tiny knowledge graph
  const nodes = [
    { id: 'you', label: 'YOU', type: 'me', x: 0, y: 0, vx: 0, vy: 0, r: 10 },
    { id: 'p1', label: 'Paper A', type: 'paper', x: 0, y: 0, vx: 0, vy: 0, r: 6 },
    { id: 'p2', label: 'Paper B', type: 'paper', x: 0, y: 0, vx: 0, vy: 0, r: 6 },
    { id: 'p3', label: 'Paper C', type: 'paper', x: 0, y: 0, vx: 0, vy: 0, r: 6 },
    { id: 'p4', label: 'Paper D', type: 'paper', x: 0, y: 0, vx: 0, vy: 0, r: 6 },
    { id: 'i1', label: 'Idea 1', type: 'idea', x: 0, y: 0, vx: 0, vy: 0, r: 7 },
    { id: 'i2', label: 'Idea 2', type: 'idea', x: 0, y: 0, vx: 0, vy: 0, r: 7 },
    { id: 'i3', label: 'Idea 3', type: 'idea', x: 0, y: 0, vx: 0, vy: 0, r: 7 },
    { id: 'per1', label: 'Person', type: 'person', x: 0, y: 0, vx: 0, vy: 0, r: 5 },
    { id: 'per2', label: 'Person', type: 'person', x: 0, y: 0, vx: 0, vy: 0, r: 5 },
    { id: 't1', label: 'Talk', type: 'talk', x: 0, y: 0, vx: 0, vy: 0, r: 5 },
  ];

  const links = [
    ['you', 'i1'], ['you', 'i2'], ['you', 'p1'],
    ['i1', 'p1'], ['i1', 'p2'], ['i1', 'i3'],
    ['i2', 'p3'], ['i2', 't1'],
    ['p1', 'per1'], ['p2', 'per1'], ['p3', 'per2'],
    ['t1', 'per2'], ['i3', 'p4'], ['p4', 'per2'],
  ];

  const colorFor = (type) => {
    switch (type) {
      case 'me':     return '#e8b85c';
      case 'paper':  return '#7de3ff';
      case 'idea':   return '#a588ff';
      case 'person': return '#f09bc8';
      case 'talk':   return '#8ce99a';
      default:       return '#aaa';
    }
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = rect.width * window.devicePixelRatio;
    h = canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    // Initialize node positions
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      n.x = rect.width / 2 + Math.cos(a) * 80 + (Math.random() - 0.5) * 30;
      n.y = rect.height / 2 + Math.sin(a) * 80 + (Math.random() - 0.5) * 30;
    });
    nodes[0].x = rect.width / 2;  // center "you"
    nodes[0].y = rect.height / 2;
  }

  function tick() {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 900 / (d * d);
        const fx = force * dx / d;
        const fy = force * dy / d;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Spring on links
    for (const [aId, bId] of links) {
      const a = nodes.find(n => n.id === aId);
      const b = nodes.find(n => n.id === bId);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const spring = (d - 90) * 0.01;
      const fx = spring * dx / d;
      const fy = spring * dy / d;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.002;
      n.vy += (cy - n.y) * 0.002;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
    }

    // Draw
    ctx.clearRect(0, 0, w, h);
    // Links
    ctx.strokeStyle = 'rgba(140, 140, 160, 0.3)';
    ctx.lineWidth = 1;
    for (const [aId, bId] of links) {
      const a = nodes.find(n => n.id === aId);
      const b = nodes.find(n => n.id === bId);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // Nodes
    for (const n of nodes) {
      const color = colorFor(n.type);
      // Glow
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
      g.addColorStop(0, color + '44');
      g.addColorStop(1, color + '00');
      ctx.fillStyle = g;
      ctx.fillRect(n.x - n.r * 3, n.y - n.r * 3, n.r * 6, n.r * 6);
      // Core
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (n.type === 'me') {
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#e8b85c';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y - n.r - 6);
      }
    }

    requestAnimationFrame(tick);
  }

  // Drag support
  let dragging = null;
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const n of nodes) {
      const dx = n.x - mx, dy = n.y - my;
      if (Math.sqrt(dx * dx + dy * dy) < n.r + 4) { dragging = n; break; }
    }
  });
  canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
      const rect = canvas.getBoundingClientRect();
      dragging.x = e.clientX - rect.left;
      dragging.y = e.clientY - rect.top;
      dragging.vx = 0; dragging.vy = 0;
    }
  });
  canvas.addEventListener('mouseup', () => dragging = null);
  canvas.addEventListener('mouseleave', () => dragging = null);

  resize();
  window.addEventListener('resize', resize);
  tick();
})();

// ── 4-level zoom demo ─────────────────────────────────────────────
(function zoomDemo() {
  const demo = document.getElementById('zoom-demo');
  if (!demo) return;

  const levels = demo.querySelectorAll('.zoom-level');
  const buttons = demo.querySelectorAll('.zoom-btn');

  function show(n) {
    levels.forEach(l => l.classList.toggle('visible', +l.dataset.zoom === n));
    buttons.forEach(b => b.classList.toggle('active', +b.dataset.zoom === n));
  }

  buttons.forEach(b => {
    b.addEventListener('click', () => show(+b.dataset.zoom));
  });

  show(1);
})();

// ── Mobile nav toggle ─────────────────────────────────────────────
(function navToggle() {
  const btn = document.querySelector('.nav-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;

  const setOpen = (open) => {
    sidebar.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '×' : '☰';
  };

  btn.addEventListener('click', () => {
    setOpen(!sidebar.classList.contains('open'));
  });

  // Auto-close when a nav link is tapped
  sidebar.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });
})();

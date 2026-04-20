/* =====================================================================
   AZETTA AI — PITCH DECK NAVIGATION & INTERACTIVITY
   ===================================================================== */

'use strict';

// ── State ──────────────────────────────────────────────────────────────
let currentSlide = 1;
const TOTAL_SLIDES = 14;

// ── DOM refs ───────────────────────────────────────────────────────────
let slides        = document.querySelectorAll('.slide');
const progressBar = document.getElementById('progress-bar');
const counter     = document.getElementById('slide-counter');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');

// ── Core navigation ────────────────────────────────────────────────────
function goToSlide(n, direction = 'next') {
  if (n < 1 || n > TOTAL_SLIDES) return;

  const prev = document.querySelector('.slide.active');
  const next = slides[n - 1];

  if (!next) return;         // deck not yet populated (encrypted mode)

  if (prev === next) return;

  // Exit current slide
  if (prev) {
    if (currentSlide === 3) stopBlackboxDemo();
    if (currentSlide === 4) stopPGDemo();
    if (currentSlide === 7) stopFlywheel();
    prev.classList.add('exit');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('exit'), 400);
  }

  // Enter next slide
  // Direction hint: when going back, flip the entry transform
  if (direction === 'prev') {
    next.style.transform = 'translateX(-40px)';
  } else {
    next.style.transform = 'translateX(40px)';
  }

  // Force reflow so the transform takes effect before adding 'active'
  // eslint-disable-next-line no-unused-expressions
  next.offsetHeight;

  next.style.transform = '';
  next.classList.add('active');

  currentSlide = n;

  updateUI();
  onSlideEnter(n);
}

function nextSlide() { goToSlide(currentSlide + 1, 'next'); }
function prevSlide() { goToSlide(currentSlide - 1, 'prev'); }

// ── UI sync ────────────────────────────────────────────────────────────
function updateUI() {
  // Progress bar
  const pct = ((currentSlide - 1) / (TOTAL_SLIDES - 1)) * 100;
  progressBar.style.width = pct + '%';

  // Counter
  const pad = n => String(n).padStart(2, '0');
  counter.textContent = `${pad(currentSlide)} / ${pad(TOTAL_SLIDES)}`;

  // Button states
  btnPrev.style.opacity = currentSlide === 1 ? '0.3' : '1';
  btnNext.style.opacity = currentSlide === TOTAL_SLIDES ? '0.3' : '1';
}

// ── Per-slide effects ──────────────────────────────────────────────────
const initiated = new Set();

function onSlideEnter(n) {
  if (n === 3) { initBlackboxDemo(); return; }
  if (n === 4) { startYatManifold(); return; }
  if (n === 5) { initPGDemo();       return; }
  if (n === 7)  { initFlywheel();      return; }
  if (n === 10) { initAetherModels();  return; }
  if (initiated.has(n)) return;
  initiated.add(n);

  switch (n) {
    case 11: initTAMChart(); break;
    case 2:  animateStatNumbers(); break;
    case 9:  initPeriodica(); pdShowScreen('pd-splash'); break;
  }
}

// ── Deck initialisation (called at startup & after decrypt) ───────────
function initDeck() {
  slides = document.querySelectorAll('.slide');
  currentSlide = 1;
  initiated.clear();
  slides.forEach((s, i) => s.classList.toggle('active', i === 0));
  updateUI();
  onSlideEnter(1);
}

// ── TAM Bar Chart ──────────────────────────────────────────────────────
function initTAMChart() {
  const container = document.getElementById('tam-chart');
  if (!container) return;

  const barEls = container.querySelectorAll('.bar');
  const maxHeight = container.clientHeight * 0.75; // 75% of available height

  // Animate each bar from 0 to target height
  barEls.forEach((bar, i) => {
    const pct = parseFloat(bar.dataset.pct) / 100;
    const targetH = Math.max(pct * maxHeight, 4);

    bar.style.height = '0px';
    bar.style.transition = 'none';

    setTimeout(() => {
      bar.style.transition = `height 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08}s`;
      bar.style.height = targetH + 'px';
    }, 100);
  });
}

// ── Stat number animation (slide 2) ────────────────────────────────────
function animateStatNumbers() {
  // Nothing fancy needed — stats are static text,
  // but we can add a quick scale-in pulse on the numbers.
  const statNums = document.querySelectorAll('[data-slide="2"] .stat-number');
  statNums.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'scale(0.7)';
    el.style.transition = 'none';

    setTimeout(() => {
      el.style.transition = `opacity 0.4s ease ${i * 0.12}s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.12}s`;
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    }, 50);
  });
}

// ── Keyboard controls ──────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
      e.preventDefault();
      nextSlide();
      break;

    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      prevSlide();
      break;

    case 'Home':
      e.preventDefault();
      goToSlide(1);
      break;

    case 'End':
      e.preventDefault();
      goToSlide(TOTAL_SLIDES);
      break;

    case 'f':
    case 'F':
      toggleFullscreen();
      break;
  }
});

// ── Button controls ────────────────────────────────────────────────────
btnNext.addEventListener('click', nextSlide);
btnPrev.addEventListener('click', prevSlide);

// ── Touch / swipe support ──────────────────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  // Only respond to predominantly horizontal swipes
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    if (dx < 0) nextSlide();
    else prevSlide();
  }
}, { passive: true });

// ── Fullscreen ─────────────────────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ── Click on slide body to advance ────────────────────────────────────
// (Except on interactive elements)
document.getElementById('deck').addEventListener('click', (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (['button', 'a', 'input', 'select', 'textarea', 'th', 'td'].includes(tag)) return;
  if (e.target.closest('#nav')) return;
  if (e.target.closest('#periodica-demo')) return;
  if (e.target.closest('.s2-card')) return;
  if (e.target.closest('.s3-card')) return;

  // Click right half → next, left half → prev
  const mid = window.innerWidth / 2;
  if (e.clientX > mid) nextSlide();
  else prevSlide();
});

// ── Periodica Demo (Slide 10) ────────────────────────────────────────
const PD_NEURONS = [
  {
    id: 'N-247', type: 'syco', col: 3, row: 2,
    label: 'Sycophancy Bias',
    desc: 'Activates strongly when generating agreement or validation language. Causes the model to prioritize user approval over factual accuracy.',
    weight: 0.94, recommended: 0.15, min: 0, max: 1, step: 0.01,
    action: 'Reduce Influence',
    fixMsg: 'Sycophancy influence reduced. Model will now answer critically rather than seeking approval.',
  },
  {
    id: 'N-891', type: 'hall', col: 7, row: 5,
    label: 'Hallucination Risk',
    desc: 'Unstable activation pattern. Fires inconsistently across semantically similar prompts, generating confident outputs that may be completely unfounded.',
    weight: 1.42, recommended: 0.85, min: 0.5, max: 1.5, step: 0.01,
    action: 'Stabilize Weight',
    fixMsg: 'Neuron stabilized. Confidence is now calibrated to actual knowledge boundaries.',
  },
  {
    id: 'N-156', type: 'pii', col: 1, row: 7,
    label: 'PII Retention',
    desc: 'Encodes PII from training data. Memorized customer names, account numbers, and addresses may surface verbatim in model outputs.',
    weight: 0.88, recommended: 0.00, min: 0, max: 1, step: 0.01,
    action: 'Remove from Network',
    fixMsg: 'PII successfully scrubbed. Customer data can no longer be recovered from the network.',
  },
  {
    id: 'N-412', type: 'bias', col: 5, row: 1,
    label: 'Demographic Bias',
    desc: 'Systematic skew across demographic groups. Certain occupations, traits, and risk assessments are consistently associated with specific genders and ethnicities in output patterns.',
    weight: 0.78, recommended: 0.10, min: 0, max: 1, step: 0.01,
    action: 'Correct Bias',
    fixMsg: 'Demographic bias corrected. Word associations and risk assessments are now balanced across groups.',
  },
];

// Named healthy neurons shown on hover
const PD_NAMED = {
  '0-0': { id: 'N-001', name: 'Grammar Structure' },
  '8-0': { id: 'N-008', name: 'Punctuation Rules' },
  '4-1': { id: 'N-013', name: 'Semantic Coherence' },
  '2-3': { id: 'N-029', name: 'Named Entity Recog.' },
  '6-3': { id: 'N-051', name: 'Factual Recall' },
  '0-4': { id: 'N-036', name: 'Code Syntax' },
  '8-4': { id: 'N-044', name: 'Math Reasoning' },
  '4-6': { id: 'N-058', name: 'Spatial Reasoning' },
  '8-8': { id: 'N-080', name: 'Temporal Reasoning' },
  '0-8': { id: 'N-072', name: 'Discourse Patterns' },
  '4-8': { id: 'N-076', name: 'Sentiment Detection' },
};

// IP neurons revealed by search (col-row key)
const PD_IP_POS = ['6-2', '4-4', '2-6'];
const PD_IP_IDS = { '6-2': 'N-789', '4-4': 'N-401', '2-6': 'N-233' };

// Pricing per demo model
const PD_PRICING = {
  'GPT-J-6B':   { params: '6B params',  monthly: '$9,000',  label: 'Small' },
  'Llama-3-8B': { params: '8B params',  monthly: '$15,000', label: 'Small' },
  'Mistral-7B': { params: '7B params',  monthly: '$12,000', label: 'Small' },
};

const pdState = {
  model: 'Llama-3-8B',
  fixed: new Set(),
  premium: false,
  pendingAction: null,
  ipSearchDone: false,
  ipFixed: false,
};
const pdTypeColor = { syco: '#e84545', hall: '#e8a02a', pii: '#a050ff', bias: '#e84587' };
const pdTypeBadge = { syco: 'pd-nbadge-syco', hall: 'pd-nbadge-hall', pii: 'pd-nbadge-pii', bias: 'pd-nbadge-bias' };
const pdTypeCat   = { syco: 'Behavior', hall: 'Instability', pii: 'Privacy', bias: 'Fairness' };

function initPeriodica() {
  const startBtn = document.getElementById('pd-start-btn');
  if (!startBtn || startBtn.dataset.bound) return;
  startBtn.dataset.bound = '1';

  document.querySelectorAll('.pd-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pd-chip').forEach(c => c.classList.remove('pd-chip-sel'));
      chip.classList.add('pd-chip-sel');
      pdState.model = chip.dataset.model;
    });
  });

  startBtn.addEventListener('click', pdStartScan);

  const exploreBtn = document.getElementById('pd-explore-btn');
  if (exploreBtn) exploreBtn.addEventListener('click', () => pdShowScreen('pd-upload'));
}

function pdShowScreen(id) {
  document.querySelectorAll('.pd-screen').forEach(s => s.classList.remove('pd-active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('pd-active');
}

function pdStartScan() {
  const scanName = document.getElementById('pd-scan-model-name');
  if (scanName) scanName.textContent = pdState.model;
  pdShowScreen('pd-scan');

  const fill   = document.getElementById('pd-scan-fill');
  const phase  = document.getElementById('pd-scan-phase');
  const count  = document.getElementById('pd-n-count');
  const phases = [
    'Tokenizing architecture…',
    'Mapping layer activations…',
    'Identifying neuron specializations…',
    'Flagging anomalies…',
    'Generating audit report…',
  ];

  let progress = 0, lastPhaseIdx = -1;
  const interval = setInterval(() => {
    progress += 2;
    if (fill)  fill.style.width = progress + '%';
    if (count) count.textContent = Math.round((progress / 100) * 8192).toLocaleString();
    const pi = Math.min(Math.floor((progress / 100) * phases.length), phases.length - 1);
    if (pi !== lastPhaseIdx) { lastPhaseIdx = pi; if (phase) phase.textContent = phases[pi]; }
    if (progress >= 100) { clearInterval(interval); setTimeout(pdBuildAndShowMap, 350); }
  }, 30);
}

function pdBuildAndShowMap() {
  const el = document.getElementById('pd-map-model');
  if (el) el.textContent = pdState.model;
  pdBuildMap();
  pdBuildFlagList();
  pdWireSearch();
  pdShowScreen('pd-main');
}

function pdBuildMap() {
  const map = document.getElementById('pd-map');
  if (!map) return;
  map.innerHTML = '';

  const byPos = {};
  PD_NEURONS.forEach(n => { byPos[`${n.col}-${n.row}`] = n; });

  let seed = 12345;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const key     = `${col}-${row}`;
      const special = byPos[key];
      const named   = PD_NAMED[key];
      const isIP    = PD_IP_POS.includes(key);
      const el = document.createElement('div');

      el.style.left = ((col / 8) * 86 + 7 + (rand() - 0.5) * 3.5).toFixed(1) + '%';
      el.style.top  = ((row / 8) * 86 + 7 + (rand() - 0.5) * 3.5).toFixed(1) + '%';

      if (special) {
        const isFixed = pdState.fixed.has(special.type);
        el.className = `pd-neuron pd-n-${isFixed ? 'fixed' : special.type}`;
        el.id        = `pd-neuron-${special.type}`;
        el.title     = `${special.id} · ${special.label}${isFixed ? ' ✓ Fixed' : ' — click to inspect'}`;
        if (!isFixed) el.addEventListener('click', () => pdSelectNeuron(special.type));
      } else if (isIP) {
        const wasFound = pdState.ipSearchDone;
        el.className = `pd-neuron ${wasFound ? (pdState.ipFixed ? 'pd-n-fixed' : 'pd-n-ip') : 'pd-n-ok'}`;
        el.id        = `pd-ip-${key.replace('-', '_')}`;
        el.dataset.ipKey = key;
        el.title     = wasFound ? `${PD_IP_IDS[key]} · IP-Protected Training Data` : `N-${String(row * 9 + col + 10).padStart(3, '0')} · Analyzing…`;
        if (wasFound && !pdState.ipFixed) el.addEventListener('click', pdShowIPResult);
      } else if (named) {
        el.className = 'pd-neuron pd-n-named';
        el.title     = `${named.id} · ${named.name} — Stable · No issues detected`;
      } else {
        el.className = 'pd-neuron pd-n-ok';
        el.title     = `N-${String(row * 9 + col + 10).padStart(3, '0')} · Stable · No issues detected`;
      }
      map.appendChild(el);
    }
  }
}

function pdBuildFlagList() {
  const list = document.getElementById('pd-flag-list');
  if (!list) return;
  list.innerHTML = '';

  PD_NEURONS.forEach(n => {
    const isFixed = pdState.fixed.has(n.type);
    const item = document.createElement('div');
    item.className = 'pd-flag-item' + (isFixed ? ' pd-flag-done' : '');
    item.id = `pd-flag-${n.type}`;
    item.innerHTML = `
      <span class="pd-fdot" style="background:${isFixed ? 'var(--primary)' : pdTypeColor[n.type]};"></span>
      <div class="pd-finfo">
        <div class="pd-fid">${n.id}</div>
        <div class="pd-fname">${n.label}</div>
      </div>
      ${isFixed ? '<span class="pd-ffixed">✓ FIXED</span>' : '<span class="pd-farrow">›</span>'}
    `;
    if (!isFixed) item.addEventListener('click', () => pdSelectNeuron(n.type));
    list.appendChild(item);
  });

  if (pdState.ipSearchDone) pdAddIPToFlagList();
}

function pdAddIPToFlagList() {
  const list = document.getElementById('pd-flag-list');
  if (!list || document.getElementById('pd-flag-ip')) return;
  const item = document.createElement('div');
  item.className = 'pd-flag-item' + (pdState.ipFixed ? ' pd-flag-done' : '');
  item.id = 'pd-flag-ip';
  item.innerHTML = `
    <span class="pd-fdot" style="background:${pdState.ipFixed ? 'var(--primary)' : '#e8c42a'};"></span>
    <div class="pd-finfo">
      <div class="pd-fid">N-789, N-401, N-233</div>
      <div class="pd-fname">IP-Protected Training Data</div>
    </div>
    ${pdState.ipFixed ? '<span class="pd-ffixed">✓ FIXED</span>' : '<span class="pd-farrow">›</span>'}
  `;
  if (!pdState.ipFixed) item.addEventListener('click', pdShowIPResult);
  list.appendChild(item);
}

function pdWireSearch() {
  const input = document.getElementById('pd-search-input');
  const btn   = document.getElementById('pd-search-btn');
  if (!input || !btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  const doSearch = () => { const q = input.value.trim(); if (q) pdRunSearch(q); };
  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

function pdRunSearch(query) {
  const q = query.toLowerCase();
  const ipTerms = ['ip', 'copyright', 'intellectual property', 'licensed', 'pirated', 'training data', 'protected', 'proprietary'];
  if (ipTerms.some(t => q.includes(t))) {
    pdDoIPSearch();
  } else {
    pdShowGenericSearchResult(query);
  }
}

function pdDoIPSearch() {
  PD_IP_POS.forEach(key => {
    const el = document.getElementById(`pd-ip-${key.replace('-', '_')}`);
    if (el && !pdState.ipFixed) {
      el.className = 'pd-neuron pd-n-ip';
      el.title = `${PD_IP_IDS[key]} · IP-Protected Training Data — click to inspect`;
      el.addEventListener('click', pdShowIPResult);
    }
  });
  const legIP = document.getElementById('pd-leg-ip');
  if (legIP) legIP.style.display = '';
  if (!pdState.ipSearchDone) { pdState.ipSearchDone = true; pdAddIPToFlagList(); }
  pdShowIPResult();
}

function pdShowIPResult() {
  pdSwitchDetailView('pd-search-view');
  const sv = document.getElementById('pd-search-view');
  if (!sv) return;

  if (pdState.ipFixed) {
    sv.innerHTML = `
      <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
      <div class="pd-fixed-state">
        <div class="pd-fixed-icon">✓</div>
        <div class="pd-fixed-name">IP-Protected Training Data</div>
        <div class="pd-fixed-msg">All traces of copyrighted content removed. The model can no longer reproduce protected text verbatim.</div>
      </div>`;
  } else {
    sv.innerHTML = `
      <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
      <div class="pd-sv-result">
        <span class="pd-sv-badge pd-sv-badge-ip">⚠ IP MATCH DETECTED</span>
        <div class="pd-neuron-name">IP-Protected Training Data</div>
        <div class="pd-neuron-desc">Traces of copyrighted content detected across <strong style="color:#e8c42a;">3 neurons</strong> (N-789, N-401, N-233). Under specific prompts this model can reproduce sections of protected text verbatim — creating significant legal and compliance risk.</div>
        <div class="pd-sv-neurons">
          <span class="pd-sv-n" style="background:rgba(232,196,42,0.12);border-color:rgba(232,196,42,0.4);color:#e8c42a;">N-789</span>
          <span class="pd-sv-n" style="background:rgba(232,196,42,0.12);border-color:rgba(232,196,42,0.4);color:#e8c42a;">N-401</span>
          <span class="pd-sv-n" style="background:rgba(232,196,42,0.12);border-color:rgba(232,196,42,0.4);color:#e8c42a;">N-233</span>
        </div>
        <button class="pd-apply-btn" id="pd-ip-fix-btn">Remove IP Data from Network →</button>
      </div>`;
  }

  document.getElementById('pd-sv-back').addEventListener('click', pdShowFlagsView);
  if (!pdState.ipFixed) {
    document.getElementById('pd-ip-fix-btn').addEventListener('click', () => {
      pdState.pendingAction = { type: 'ip' };
      pdCheckPremium();
    });
  }
}

function pdShowGenericSearchResult(query) {
  pdSwitchDetailView('pd-search-view');
  const sv = document.getElementById('pd-search-view');
  if (!sv) return;
  sv.innerHTML = `
    <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
    <div class="pd-sv-result">
      <span class="pd-sv-badge pd-sv-badge-ok">✓ NO RISK DETECTED</span>
      <div class="pd-neuron-name" style="font-size:0.8rem;">"${query}"</div>
      <div class="pd-neuron-desc">No significant risk found for this concept. Related activations are within normal parameters.</div>
      <p class="pd-detail-hint" style="font-style:normal;text-align:left;padding:0;margin-top:0.3rem;">Try <strong style="color:#e8c42a;">"IP-protected data"</strong> to probe for training data compliance risk.</p>
    </div>`;
  document.getElementById('pd-sv-back').addEventListener('click', pdShowFlagsView);
}

function pdSwitchDetailView(show) {
  ['pd-flags-view', 'pd-neuron-view', 'pd-search-view'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === show) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
      if (id === 'pd-neuron-view') el.innerHTML = '';
    }
  });
}

function pdShowFlagsView() {
  pdSwitchDetailView('pd-flags-view');
}

function pdSelectNeuron(type) {
  const n = PD_NEURONS.find(x => x.type === type);
  if (!n) return;

  pdSwitchDetailView('pd-neuron-view');
  const nv = document.getElementById('pd-neuron-view');
  if (!nv) return;
  nv.innerHTML = '';

  const back = pdMakeBackBtn();

  if (pdState.fixed.has(type)) {
    const fixed = document.createElement('div');
    fixed.className = 'pd-fixed-state';
    fixed.innerHTML = `<div class="pd-fixed-icon">✓</div><div class="pd-fixed-name">${n.label}</div><div class="pd-fixed-msg">${n.fixMsg}</div>`;
    nv.append(back, fixed);
    return;
  }

  const idRow = document.createElement('div');
  idRow.className = 'pd-neuron-id-row';
  idRow.innerHTML = `<span class="pd-neuron-id">${n.id}</span><span class="pd-nbadge ${pdTypeBadge[type]}">${pdTypeCat[type]}</span>`;

  const name = document.createElement('div');
  name.className = 'pd-neuron-name';
  name.textContent = n.label;

  const desc = document.createElement('div');
  desc.className = 'pd-neuron-desc';
  desc.textContent = n.desc;

  const weightSec = document.createElement('div');
  weightSec.className = 'pd-weight-section';
  const wRow = document.createElement('div');
  wRow.className = 'pd-weight-row';
  wRow.innerHTML = `<span class="pd-wlabel">Neuron weight</span><span class="pd-wval" id="pd-wval">${n.weight.toFixed(2)}</span>`;
  const slider = document.createElement('input');
  slider.type = 'range'; slider.className = 'pd-slider';
  slider.min = n.min; slider.max = n.max; slider.step = n.step; slider.value = n.weight;
  slider.addEventListener('input', () => {
    const wval = document.getElementById('pd-wval');
    if (wval) wval.textContent = parseFloat(slider.value).toFixed(2);
  });
  const rec = document.createElement('div');
  rec.className = 'pd-recommend';
  rec.innerHTML = `Recommended: <span>${n.recommended.toFixed(2)}</span>`;
  weightSec.append(wRow, slider, rec);

  const applyBtn = document.createElement('button');
  applyBtn.className = 'pd-apply-btn';
  applyBtn.textContent = n.action + ' →';
  applyBtn.addEventListener('click', () => {
    pdState.pendingAction = { type: 'fix', neuronType: type };
    pdCheckPremium();
  });

  nv.append(back, idRow, name, desc, weightSec, applyBtn);
}

function pdMakeBackBtn() {
  const btn = document.createElement('button');
  btn.className = 'pd-back-btn';
  btn.textContent = '← Back to overview';
  btn.addEventListener('click', pdShowFlagsView);
  return btn;
}

function pdCheckPremium() {
  if (pdState.premium) { pdExecutePendingAction(); } else { pdShowPaywall(); }
}

function pdShowPaywall() {
  const pw   = document.getElementById('pd-paywall');
  const card = document.getElementById('pd-pw-card');
  if (!pw || !card) return;
  const p = PD_PRICING[pdState.model] || { params: '?B params', monthly: '$15,000', label: 'Small' };
  card.innerHTML = `
    <button class="pd-pw-close" id="pd-pw-close">×</button>
    <div class="pd-pw-lock">🔒</div>
    <h3 class="pd-pw-title">Periodica Premium Required</h3>
    <p class="pd-pw-sub">Steering and editing tools require a Premium plan.</p>
    <div class="pd-pw-plan-box">
      <div class="pd-pw-plan-info">
        <span class="pd-pw-model-chip">${pdState.model}</span>
        <span class="pd-pw-params">${p.params}</span>
      </div>
      <div class="pd-pw-plan-price">
        <span class="pd-pw-price-amt">${p.monthly}</span>
        <span class="pd-pw-price-mo">/mo</span>
      </div>
    </div>
    <ul class="pd-pw-features">
      <li>Unlimited neuron weight editing</li>
      <li>PII removal &amp; privacy scrubbing</li>
      <li>Bias detection &amp; correction</li>
      <li>IP training data detection &amp; removal</li>
      <li>Continuous model monitoring</li>
    </ul>
    <button class="pd-pw-btn" id="pd-pw-activate">Activate Premium — ${p.monthly}/mo</button>
    <p class="pd-pw-free-note">First audit always free. Cancel anytime.</p>`;
  pw.style.display = 'flex';
  document.getElementById('pd-pw-close').addEventListener('click', () => { pw.style.display = 'none'; });
  document.getElementById('pd-pw-activate').addEventListener('click', pdActivatePremium);
}

function pdActivatePremium() {
  const card = document.getElementById('pd-pw-card');
  if (!card) return;
  card.innerHTML = `<div class="pd-pw-activating"><div class="pd-pw-spinner"></div><p>Activating Premium…</p></div>`;
  setTimeout(() => {
    card.innerHTML = `
      <div class="pd-pw-success">
        <div class="pd-pw-success-icon">✓</div>
        <h3 class="pd-pw-success-title">Premium Activated!</h3>
        <p class="pd-pw-success-msg">You now have full access to all steering, editing, and removal tools.</p>
        <button class="pd-pw-btn" id="pd-pw-continue">Continue →</button>
      </div>`;
    document.getElementById('pd-pw-continue').addEventListener('click', () => {
      const pw = document.getElementById('pd-paywall');
      if (pw) pw.style.display = 'none';
      pdState.premium = true;
      pdShowPremiumBadge();
      pdExecutePendingAction();
    });
  }, 1400);
}

function pdShowPremiumBadge() {
  const banner = document.getElementById('pd-premium-banner');
  if (banner) banner.style.display = 'flex';
  const demo = document.getElementById('periodica-demo');
  if (demo) demo.classList.add('pd-premium-active');
}

function pdExecutePendingAction() {
  const action = pdState.pendingAction;
  pdState.pendingAction = null;
  if (!action) return;
  if (action.type === 'fix') pdApplyFix(action.neuronType);
  else if (action.type === 'ip') pdApplyIPFix();
}

function pdApplyFix(type) {
  pdState.fixed.add(type);
  const n = PD_NEURONS.find(x => x.type === type);

  const dot = document.getElementById(`pd-neuron-${type}`);
  if (dot) { dot.className = 'pd-neuron pd-n-fixed'; dot.onclick = null; dot.style.cursor = 'default'; dot.title = `${n.id} · ${n.label} ✓ Fixed`; }

  const item = document.getElementById(`pd-flag-${type}`);
  if (item && n) {
    item.className = 'pd-flag-item pd-flag-done';
    item.innerHTML = `<span class="pd-fdot" style="background:var(--primary);"></span><div class="pd-finfo"><div class="pd-fid">${n.id}</div><div class="pd-fname">${n.label}</div></div><span class="pd-ffixed">✓ FIXED</span>`;
    item.onclick = null;
  }

  pdSwitchDetailView('pd-neuron-view');
  const nv = document.getElementById('pd-neuron-view');
  if (nv && n) {
    nv.innerHTML = '';
    const fixed = document.createElement('div');
    fixed.className = 'pd-fixed-state';
    fixed.innerHTML = `<div class="pd-fixed-icon">✓</div><div class="pd-fixed-name">${n.label}</div><div class="pd-fixed-msg">${n.fixMsg}</div>`;
    nv.append(pdMakeBackBtn(), fixed);
  }

  if (pdState.fixed.size === PD_NEURONS.length && (!pdState.ipSearchDone || pdState.ipFixed)) setTimeout(pdAllClear, 800);
}

function pdApplyIPFix() {
  pdState.ipFixed = true;
  PD_IP_POS.forEach(key => {
    const el = document.getElementById(`pd-ip-${key.replace('-', '_')}`);
    if (el) { el.className = 'pd-neuron pd-n-fixed'; el.onclick = null; el.style.cursor = 'default'; }
  });
  const item = document.getElementById('pd-flag-ip');
  if (item) {
    item.className = 'pd-flag-item pd-flag-done';
    item.innerHTML = `<span class="pd-fdot" style="background:var(--primary);"></span><div class="pd-finfo"><div class="pd-fid">N-789, N-401, N-233</div><div class="pd-fname">IP-Protected Training Data</div></div><span class="pd-ffixed">✓ FIXED</span>`;
    item.onclick = null;
  }
  pdSwitchDetailView('pd-search-view');
  const sv = document.getElementById('pd-search-view');
  if (sv) {
    sv.innerHTML = `
      <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
      <div class="pd-fixed-state">
        <div class="pd-fixed-icon">✓</div>
        <div class="pd-fixed-name">IP-Protected Training Data</div>
        <div class="pd-fixed-msg">All traces of copyrighted content removed. The model can no longer reproduce protected text verbatim.</div>
      </div>`;
    document.getElementById('pd-sv-back').addEventListener('click', pdShowFlagsView);
  }
  if (pdState.fixed.size === PD_NEURONS.length) setTimeout(pdAllClear, 800);
}

function pdAllClear() {
  const fv = document.getElementById('pd-flags-view');
  if (!fv || fv.querySelector('.pd-all-clear')) return;
  pdShowFlagsView();
  const box = document.createElement('div');
  box.className = 'pd-all-clear';
  box.innerHTML = '<div class="pd-all-clear-title">✓ Model fully audited &amp; hardened</div><div class="pd-all-clear-sub">All flagged neurons resolved. Ready for deployment.</div>';
  fv.appendChild(box);
}

// ── Black-Box Neural Net Animation (Slide 3) ──────────────────────────

// Network: Input(4) → 5×Hidden(7) → Output(3)  [viewBox 400×160]
const BB_NET = [
  { x: 28,  ys: [28, 56, 84, 112],                              type: 'io'     },
  { x: 88,  ys: [12, 33, 54, 75, 96, 117, 138],                type: 'hidden' },
  { x: 148, ys: [12, 33, 54, 75, 96, 117, 138],                type: 'hidden' },
  { x: 208, ys: [12, 33, 54, 75, 96, 117, 138],                type: 'hidden' },
  { x: 268, ys: [12, 33, 54, 75, 96, 117, 138],                type: 'hidden' },
  { x: 328, ys: [12, 33, 54, 75, 96, 117, 138],                type: 'hidden' },
  { x: 378, ys: [42, 80, 118],                                  type: 'io'     },
];

let bbTimers   = [];
let bbSvgBuilt = false;

function bbKillTimers() {
  bbTimers.forEach(t => clearTimeout(t));
  bbTimers = [];
}

function bbDelay(fn, ms) {
  bbTimers.push(setTimeout(fn, ms));
}

function bbBuildSVG() {
  const edgesG = document.getElementById('bb-edges');
  const nodesG = document.getElementById('bb-nodes');
  if (!edgesG || !nodesG) return;
  const NS = 'http://www.w3.org/2000/svg';

  BB_NET.forEach(({ x: x1, ys: ys1 }, li) => {
    if (li >= BB_NET.length - 1) return;
    const { x: x2, ys: ys2 } = BB_NET[li + 1];
    ys1.forEach((y1, i) => {
      ys2.forEach((y2, j) => {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', 'rgba(100,120,160,0.06)');
        ln.setAttribute('stroke-width', '0.55');
        ln.dataset.from = `${li}-${i}`;
        ln.dataset.to   = `${li + 1}-${j}`;
        ln.classList.add('bb-edge');
        edgesG.appendChild(ln);
      });
    });
  });

  BB_NET.forEach(({ x, ys, type }, li) => {
    ys.forEach((y, ni) => {
      const isH = type === 'hidden';
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.setAttribute('r', isH ? '4' : '5');
      c.setAttribute('fill',         isH ? 'rgba(80,100,140,0.2)'   : 'rgba(120,196,164,0.2)');
      c.setAttribute('stroke',       isH ? 'rgba(100,130,180,0.32)' : 'rgba(120,196,164,0.5)');
      c.setAttribute('stroke-width', '1');
      c.dataset.layer = li;
      c.dataset.node  = ni;
      c.classList.add('bb-node');
      nodesG.appendChild(c);
    });
  });

  bbSvgBuilt = true;
}

function bbReset() {
  document.querySelectorAll('.bb-edge').forEach(e => {
    e.setAttribute('stroke', 'rgba(100,120,160,0.06)');
    e.setAttribute('stroke-width', '0.55');
  });
  document.querySelectorAll('.bb-node').forEach(n => {
    const li = parseInt(n.dataset.layer);
    const isH = BB_NET[li].type === 'hidden';
    n.setAttribute('fill',         isH ? 'rgba(80,100,140,0.2)'   : 'rgba(120,196,164,0.2)');
    n.setAttribute('stroke',       isH ? 'rgba(100,130,180,0.32)' : 'rgba(120,196,164,0.5)');
    n.setAttribute('stroke-width', '1');
    n.setAttribute('r', isH ? '4' : '5');
  });
  const out = document.getElementById('bb-output');
  if (out) out.textContent = '';
  const cur = document.getElementById('bb-cursor');
  if (cur) cur.style.display = '';
}

function bbFireLayer(li) {
  const { ys } = BB_NET[li];
  // Fire 3–4 random neurons
  const count = 3 + Math.floor(Math.random() * 2);
  const indices = [...ys.keys()].sort(() => Math.random() - 0.5).slice(0, count);
  indices.forEach(ni => {
    const node = document.querySelector(`.bb-node[data-layer="${li}"][data-node="${ni}"]`);
    if (node) {
      node.setAttribute('fill', 'rgba(232,160,42,0.82)');
      node.setAttribute('stroke', 'rgba(232,180,60,0.9)');
      node.setAttribute('r', '6');
    }
    // Glow incoming edges (partially visible at input side of box)
    document.querySelectorAll(`.bb-edge[data-to="${li}-${ni}"]`).forEach(e => {
      e.setAttribute('stroke', 'rgba(232,160,42,0.38)');
      e.setAttribute('stroke-width', '1.1');
    });
    // Dim outgoing edges (pass signal forward)
    document.querySelectorAll(`.bb-edge[data-from="${li}-${ni}"]`).forEach(e => {
      e.setAttribute('stroke', 'rgba(232,160,42,0.18)');
      e.setAttribute('stroke-width', '0.8');
    });
  });
}

function bbShowOutput(text) {
  const cur = document.getElementById('bb-cursor');
  if (cur) cur.style.display = 'none';

  // Light up output nodes green
  BB_NET[BB_NET.length - 1].ys.forEach((_, ni) => {
    const node = document.querySelector(`.bb-node[data-layer="${BB_NET.length - 1}"][data-node="${ni}"]`);
    if (node) {
      node.setAttribute('fill', 'rgba(120,196,164,0.75)');
      node.setAttribute('stroke', 'rgba(120,196,164,1)');
      node.setAttribute('r', '7');
    }
  });

  // Type out the answer
  const el = document.getElementById('bb-output');
  if (!el) return;
  let i = 0;
  function typeNext() {
    if (i < text.length) { el.textContent += text[i++]; bbDelay(typeNext, 60); }
  }
  typeNext();
}

function bbRunCycle() {
  bbReset();
  const STEP = 280; // ms between layer activations

  // Input nodes light up first
  bbDelay(() => {
    BB_NET[0].ys.forEach((_, ni) => {
      const n = document.querySelector(`.bb-node[data-layer="0"][data-node="${ni}"]`);
      if (n) {
        n.setAttribute('fill', 'rgba(120,196,164,0.55)');
        n.setAttribute('stroke', 'rgba(120,196,164,0.9)');
        n.setAttribute('r', '7');
      }
    });
  }, 120);

  // Hidden layers fire in a left-to-right cascade
  const hiddenIdxs = BB_NET.map((l, i) => i).filter(i => BB_NET[i].type === 'hidden');
  hiddenIdxs.forEach((li, idx) => {
    bbDelay(() => bbFireLayer(li), 120 + (idx + 1) * STEP);
  });

  // Output fires after the last hidden layer
  const outputDelay = 120 + (hiddenIdxs.length + 1) * STEP;
  bbDelay(() => bbShowOutput('Mexico City'), outputDelay + 120);

  // Restart cycle
  bbDelay(bbRunCycle, outputDelay + 2600);
}

function initBlackboxDemo() {
  bbKillTimers();
  if (!bbSvgBuilt) bbBuildSVG();
  bbRunCycle();
}

function stopBlackboxDemo() {
  bbKillTimers();
}

// ── Physics-Grounded Demo (Slide 4) ──────────────────────────────────
//
// Three monosemantic layers. Each neuron encodes exactly ONE concept.
// Phase 1 — Forward pass: active neurons fire in sequence, each labeled.
// Phase 2 — Manifold reveal: a smooth bezier traces the preserved
//           geometric structure through the active neurons.
//
// IO nodes — same x/y columns as slide 3's INPUT / OUTPUT
const PG_IO_IN  = { x: 28,  ys: [28, 56, 84, 112] };
const PG_IO_OUT = { x: 378, ys: [42, 80, 118] };

const PG_LAYERS = [
  { x: 130, nodes: [
    { y: 30,  concept: 'Geography',    active: true  },
    { y: 80,  concept: 'Syntax',       active: false },
    { y: 130, concept: 'Emotion',      active: false },
  ]},
  { x: 200, nodes: [
    { y: 30,  concept: 'Capital City', active: true  },
    { y: 80,  concept: 'Grammar',      active: false },
    { y: 130, concept: 'Sentiment',    active: false },
  ]},
  { x: 270, nodes: [
    { y: 30,  concept: 'Named Entity', active: true  },
    { y: 80,  concept: 'Verb Tense',   active: false },
    { y: 130, concept: 'Factual',      active: false },
  ]},
];

// Bezier through active nodes: Geography(130,30) → CapitalCity(200,30) → NamedEntity(270,30)
const PG_MANIFOLD_PATH = 'M 130,30 C 163,24 167,24 200,30 C 233,36 239,28 270,30';

let pgTimers   = [];
let pgSvgBuilt = false;

function pgKillTimers() {
  pgTimers.forEach(t => clearTimeout(t));
  pgTimers = [];
}

function pgDelay(fn, ms) {
  pgTimers.push(setTimeout(fn, ms));
}

function pgBuildSVG() {
  const edgesG  = document.getElementById('pg-edges');
  const nodesG  = document.getElementById('pg-nodes');
  const labelsG = document.getElementById('pg-concept-labels');
  if (!edgesG || !nodesG || !labelsG) return;
  const NS = 'http://www.w3.org/2000/svg';

  function mkEdge(x1, y1, x2, y2, fromKey, toKey) {
    const ln = document.createElementNS(NS, 'line');
    ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
    ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
    ln.setAttribute('stroke', 'rgba(120,196,164,0.07)');
    ln.setAttribute('stroke-width', '0.8');
    ln.dataset.from = fromKey;
    ln.dataset.to   = toKey;
    ln.classList.add('pg-edge');
    edgesG.appendChild(ln);
  }

  // IO input → layer 0 (edges cross the glass-box border — signal enters)
  PG_IO_IN.ys.forEach((y, ii) => {
    PG_LAYERS[0].nodes.forEach(({ y: y2 }, ni) => {
      mkEdge(PG_IO_IN.x, y, PG_LAYERS[0].x, y2, `io-in-${ii}`, `0-${ni}`);
    });
  });

  // Between PG layers
  PG_LAYERS.forEach(({ x: x1, nodes: ns1 }, li) => {
    if (li >= PG_LAYERS.length - 1) return;
    const { x: x2, nodes: ns2 } = PG_LAYERS[li + 1];
    ns1.forEach(({ y: y1 }, i) => {
      ns2.forEach(({ y: y2 }, j) => {
        mkEdge(x1, y1, x2, y2, `${li}-${i}`, `${li + 1}-${j}`);
      });
    });
  });

  // Layer 2 → IO output (edges cross the glass-box border — signal exits)
  const last = PG_LAYERS[PG_LAYERS.length - 1];
  PG_IO_OUT.ys.forEach((y, oi) => {
    last.nodes.forEach(({ y: y1 }, ni) => {
      mkEdge(last.x, y1, PG_IO_OUT.x, y, `2-${ni}`, `io-out-${oi}`);
    });
  });

  function mkCircle(cx, cy, r, fill, stroke, cls, data) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', fill);
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', '1');
    Object.entries(data).forEach(([k, v]) => { c.dataset[k] = v; });
    c.classList.add(cls);
    nodesG.appendChild(c);
  }

  // IO input nodes
  PG_IO_IN.ys.forEach((y, ni) => {
    mkCircle(PG_IO_IN.x, y, '5', 'rgba(120,196,164,0.2)', 'rgba(120,196,164,0.5)',
             'pg-io', { io: 'in', node: ni });
  });

  // PG nodes + concept labels
  PG_LAYERS.forEach(({ x, nodes }, li) => {
    nodes.forEach(({ y, concept }, ni) => {
      mkCircle(x, y, '7', 'rgba(120,196,164,0.1)', 'rgba(120,196,164,0.3)',
               'pg-node', { layer: li, node: ni });

      const lbl = document.createElementNS(NS, 'text');
      lbl.setAttribute('x', x);
      lbl.setAttribute('y', y - 12);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-family', "'IBM Plex Mono', monospace");
      lbl.setAttribute('font-size', '6');
      lbl.setAttribute('fill', 'rgba(120,196,164,0.22)');
      lbl.textContent = concept;
      lbl.dataset.layer = li; lbl.dataset.node = ni;
      lbl.classList.add('pg-label');
      labelsG.appendChild(lbl);
    });
  });

  // IO output nodes
  PG_IO_OUT.ys.forEach((y, ni) => {
    mkCircle(PG_IO_OUT.x, y, '5', 'rgba(120,196,164,0.2)', 'rgba(120,196,164,0.5)',
             'pg-io', { io: 'out', node: ni });
  });

  pgSvgBuilt = true;
}

function pgReset() {
  document.querySelectorAll('.pg-node').forEach(n => {
    n.setAttribute('fill',         'rgba(120,196,164,0.1)');
    n.setAttribute('stroke',       'rgba(120,196,164,0.3)');
    n.setAttribute('stroke-width', '1');
    n.setAttribute('r', '7');
  });
  document.querySelectorAll('.pg-io').forEach(n => {
    n.setAttribute('fill',   'rgba(120,196,164,0.2)');
    n.setAttribute('stroke', 'rgba(120,196,164,0.5)');
    n.setAttribute('stroke-width', '1');
    n.setAttribute('r', '5');
  });
  document.querySelectorAll('.pg-edge').forEach(e => {
    e.setAttribute('stroke',       'rgba(120,196,164,0.07)');
    e.setAttribute('stroke-width', '0.8');
  });
  document.querySelectorAll('.pg-label').forEach(l => {
    l.setAttribute('fill', 'rgba(120,196,164,0.22)');
  });
  const mpath = document.getElementById('pg-manifold-path');
  if (mpath) mpath.setAttribute('stroke', 'rgba(90,181,200,0)');
  const trail = document.getElementById('pg-trail');
  if (trail) trail.innerHTML = '';
  const phLbl = document.getElementById('pg-phase-label');
  if (phLbl) phLbl.textContent = 'Tracing Neuron Activation';
  // Prompt strip reset
  const pgOut = document.getElementById('pg-output');
  if (pgOut) pgOut.textContent = '';
  const pgCur = document.getElementById('pg-cursor');
  if (pgCur) pgCur.style.display = '';
}

function pgFireNode(li, ni) {
  const node = document.querySelector(`.pg-node[data-layer="${li}"][data-node="${ni}"]`);
  if (node) {
    node.setAttribute('fill',         'rgba(120,196,164,0.72)');
    node.setAttribute('stroke',       'rgba(120,196,164,1)');
    node.setAttribute('stroke-width', '2');
    node.setAttribute('r', '9');
  }
  const lbl = document.querySelector(`.pg-label[data-layer="${li}"][data-node="${ni}"]`);
  if (lbl) lbl.setAttribute('fill', 'rgba(120,196,164,1)');
  // Glow incoming edges
  document.querySelectorAll(`.pg-edge[data-to="${li}-${ni}"]`).forEach(e => {
    e.setAttribute('stroke',       'rgba(120,196,164,0.52)');
    e.setAttribute('stroke-width', '1.4');
  });
}

function pgRunCycle() {
  pgReset();

  // Signal enters — input nodes light up (mirrors slide 3 input column)
  pgDelay(() => {
    document.querySelectorAll('.pg-io[data-io="in"]').forEach(n => {
      n.setAttribute('fill', 'rgba(120,196,164,0.7)');
      n.setAttribute('stroke', 'rgba(120,196,164,1)');
      n.setAttribute('r', '7');
    });
  }, 200);

  // Phase 1 — named neurons fire in sequence, incoming edges glow automatically
  pgDelay(() => pgFireNode(0, 0), 400);   // Geography
  pgDelay(() => pgFireNode(1, 0), 1000);  // Capital City
  pgDelay(() => pgFireNode(2, 0), 1600);  // Named Entity

  // Output nodes light up + edges from Named Entity to output glow
  pgDelay(() => {
    document.querySelectorAll('.pg-io[data-io="out"]').forEach(n => {
      n.setAttribute('fill', 'rgba(120,196,164,0.75)');
      n.setAttribute('stroke', 'rgba(120,196,164,1)');
      n.setAttribute('r', '7');
    });
    document.querySelectorAll('.pg-edge[data-from="2-0"]').forEach(e => {
      e.setAttribute('stroke', 'rgba(120,196,164,0.52)');
      e.setAttribute('stroke-width', '1.4');
    });
  }, 2000);

  // Answer types into the output strip
  pgDelay(() => {
    const cur = document.getElementById('pg-cursor');
    if (cur) cur.style.display = 'none';
    const outEl = document.getElementById('pg-output');
    if (!outEl) return;
    const text = 'Mexico City';
    let i = 0;
    function typeNext() {
      if (i < text.length) { outEl.textContent += text[i++]; pgDelay(typeNext, 60); }
    }
    typeNext();
  }, 2100);

  // Audit trace appears below SVG
  pgDelay(() => {
    const trail = document.getElementById('pg-trail');
    if (trail) {
      trail.innerHTML =
        `<span style="color:var(--text-muted);">Trace: </span>` +
        `Geography &rarr; Capital City &rarr; Named Entity &rarr; ` +
        `<strong style="color:var(--primary);">Mexico City ✓</strong>`;
    }
  }, 2800);

  // Phase 2 — manifold bezier reveals preserved geometric structure
  pgDelay(() => {
    const phLbl = document.getElementById('pg-phase-label');
    if (phLbl) phLbl.textContent = 'Preserved Geometric Manifold';
    const mpath = document.getElementById('pg-manifold-path');
    if (mpath) {
      mpath.setAttribute('d', PG_MANIFOLD_PATH);
      mpath.setAttribute('stroke', 'rgba(90,181,200,0.62)');
    }
  }, 3500);

  pgDelay(pgRunCycle, 6200);
}

function initPGDemo() {
  pgKillTimers();
  if (!pgSvgBuilt) pgBuildSVG();
  pgRunCycle();
}

function stopPGDemo() {
  pgKillTimers();
}

// ── Re-init chart on window resize ────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentSlide === 8) {
      initiated.delete(8);
      initTAMChart();
    }
  }, 200);
});

// ── Research Flywheel Animation (Slide 9) ─────────────────────────────
const FW_TOTAL = 6;
let fwTimers = [];
let fwStep   = 0;

function fwKillTimers() { fwTimers.forEach(t => clearTimeout(t)); fwTimers = []; }
function fwDelay(fn, ms) { fwTimers.push(setTimeout(fn, ms)); }

function fwAnimate() {
  document.querySelectorAll('.fw-node').forEach(el => el.classList.remove('fw-active'));
  document.querySelectorAll('.fw-arc').forEach(el => {
    el.classList.remove('fw-active');
    el.setAttribute('marker-end', 'url(#fw-arrowhead)');
  });
  const node = document.querySelector(`.fw-node[data-step="${fwStep}"]`);
  const arc  = document.querySelector(`.fw-arc[data-arc="${fwStep}"]`);
  if (node) node.classList.add('fw-active');
  if (arc) {
    arc.classList.add('fw-active');
    arc.setAttribute('marker-end', 'url(#fw-arrowhead-active)');
  }
  fwStep = (fwStep + 1) % FW_TOTAL;
  fwDelay(fwAnimate, 1800);
}

function initFlywheel() {
  fwKillTimers();
  fwStep = 0;
  fwAnimate();
}

function stopFlywheel() {
  fwKillTimers();
  document.querySelectorAll('.fw-node').forEach(el => el.classList.remove('fw-active'));
  document.querySelectorAll('.fw-arc').forEach(el => {
    el.classList.remove('fw-active');
    el.setAttribute('marker-end', 'url(#fw-arrowhead)');
  });
}

// ── Rotate Prompt Dismiss ──────────────────────────────────────────────
(function initRotateDismiss() {
  const btn    = document.getElementById('rotate-ok');
  const prompt = document.getElementById('rotate-prompt');
  if (!btn || !prompt) return;
  btn.addEventListener('click', () => prompt.classList.add('dismissed'));
})();

// ── Password Gate ──────────────────────────────────────────────────────
(function initPasswordGate() {
  const gate   = document.getElementById('password-gate');
  const input  = document.getElementById('password-input');
  const submit = document.getElementById('password-submit');
  const error  = document.getElementById('password-error');
  const encEl  = document.getElementById('__enc__');

  function showError() {
    error.classList.add('visible');
    input.value = '';
    input.focus();
    setTimeout(() => error.classList.remove('visible'), 2500);
  }

  function unlock() {
    sessionStorage.setItem('azetta_unlocked', Date.now().toString());
    gate.classList.add('unlocked');
    setTimeout(() => gate.remove(), 420);
  }

  // Decrypt AES-256-GCM payload using the entered password (mirrors build.js)
  async function decryptDeck(password) {
    const payload  = JSON.parse(encEl.textContent);
    const fromB64  = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const salt     = fromB64(payload.s);
    const iv       = fromB64(payload.v);
    const ct       = fromB64(payload.c);
    const enc      = new TextEncoder();
    const km       = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key      = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
      km,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(plain);
  }

  // Inject deck HTML and reinitialise navigation
  function populateDeck(html) {
    document.getElementById('deck').innerHTML = html;
    initDeck();
  }

  async function attempt() {
    const password = input.value.trim();
    if (!password) return;

    if (encEl) {
      // Encrypted deployment: try AES-GCM decryption
      try {
        const html = await decryptDeck(password);
        sessionStorage.setItem('azetta_deck', html);
        populateDeck(html);
        unlock();
      } catch (err) {
        console.warn('Deck decryption failed:', err);
        showError();
      }
    } else {
      // Plain dev mode: simple password check
      if (password.toLowerCase() === 'manifold') {
        unlock();
      } else {
        showError();
      }
    }
  }

  const ts = sessionStorage.getItem('azetta_unlocked');
  if (ts && (Date.now() - parseInt(ts, 10)) < 30 * 60 * 1000) {
    if (encEl) {
      const cached = sessionStorage.getItem('azetta_deck');
      if (cached) populateDeck(cached);
    }
    gate.remove();
    return;
  }

  submit.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  input.focus();
})();

// ── Init ───────────────────────────────────────────────────────────────
(function init() {
  // In encrypted deployment mode the deck is empty until password is entered;
  // initDeck() will be called by initPasswordGate after decryption instead.
  if (slides.length > 0) initDeck();

  // Hide key hint after first interaction
  const hint = document.getElementById('key-hint');
  if (!hint) return;
  const hideHint = () => {
    hint.style.transition = 'opacity 0.5s ease';
    hint.style.opacity = '0';
    setTimeout(() => hint.remove(), 600);
    document.removeEventListener('keydown', hideHint);
    document.removeEventListener('click', hideHint);
  };
  document.addEventListener('keydown', hideHint, { once: true });
  document.addEventListener('click', hideHint, { once: true });
})();

// ── YAT Kernel Manifold (Slide 04) ────────────────────────────────────
let yatRafId = null;
function startYatManifold() {
  const canvas = document.getElementById('yat-manifold-canvas');
  if (!canvas) return;
  if (yatRafId) { cancelAnimationFrame(yatRafId); yatRafId = null; }

  const ctx = canvas.getContext('2d');
  let rotationAngle = 0.5;
  const tiltAngle = 0.6;
  const neuronColors = ['#4ff975', '#4deeea', '#f9d71c', '#f038ff', '#ed217c'];
  let neurons = [{ x: 80, y: 60, color: neuronColors[0] }];

  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  canvas.width = w * devicePixelRatio; canvas.height = h * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  function computeYat(px, py, n) {
    const dot = n.x*px + n.y*py, dx = px-n.x, dy = py-n.y, d2 = dx*dx+dy*dy;
    return d2 < 0.01 ? 200 : (dot*dot)/d2;
  }
  function getDominant(px, py) {
    let maxY = 0, idx = 0, total = 0;
    neurons.forEach((n, i) => { const y = computeYat(px,py,n); total+=y; if(y>maxY){maxY=y;idx=i;} });
    return { idx, total: Math.log(1+total) };
  }
  function project(x, y, z) {
    const c = Math.cos(rotationAngle), s = Math.sin(rotationAngle);
    return { x: x*c-y*s, y: (x*s+y*c)*tiltAngle+z };
  }
  function rgba(hex, a) {
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function draw() {
    ctx.clearRect(0,0,w,h);
    const cx=w/2, cy=h/2-10, gs=25, sp=10;
    let maxYat=0.01;
    const gd=[];
    for(let i=0;i<=gs;i++){gd[i]=[];for(let j=0;j<=gs;j++){const wx=(j-gs/2)*sp,wy=(i-gs/2)*sp,res=getDominant(wx,wy);gd[i][j]={wx,wy,...res};if(res.total>maxYat)maxYat=res.total;}}
    const wd=70/Math.max(maxYat,0.1);
    const ht=[];
    for(let i=0;i<=gs;i++){ht[i]=[];for(let j=0;j<=gs;j++){const g=gd[i][j],depth=Math.min(g.total*wd,100);ht[i][j]={wx:g.wx,wy:g.wy,depth,color:neurons[g.idx].color,intensity:Math.min(depth/70,1)};}}
    for(let i=0;i<=gs;i++){for(let j=0;j<gs;j++){const a=ht[i][j],b=ht[i][j+1],p1=project(a.wx,a.wy,a.depth),p2=project(b.wx,b.wy,b.depth),col=a.intensity>=b.intensity?a.color:b.color,int=Math.max(a.intensity,b.intensity);ctx.beginPath();ctx.moveTo(cx+p1.x,cy+p1.y);ctx.lineTo(cx+p2.x,cy+p2.y);ctx.strokeStyle=rgba(col,0.3+int*0.5);ctx.lineWidth=1;ctx.stroke();}}
    for(let j=0;j<=gs;j++){for(let i=0;i<gs;i++){const a=ht[i][j],b=ht[i+1][j],p1=project(a.wx,a.wy,a.depth),p2=project(b.wx,b.wy,b.depth),col=a.intensity>=b.intensity?a.color:b.color,int=Math.max(a.intensity,b.intensity);ctx.beginPath();ctx.moveTo(cx+p1.x,cy+p1.y);ctx.lineTo(cx+p2.x,cy+p2.y);ctx.strokeStyle=rgba(col,0.3+int*0.5);ctx.lineWidth=1;ctx.stroke();}}
    neurons.forEach((n,idx)=>{
      const dotP=n.x*n.x+n.y*n.y,nd=Math.min(Math.log(1+dotP*10)*wd,100),ns=project(n.x,n.y,nd);
      const gr=ctx.createRadialGradient(cx+ns.x,cy+ns.y,0,cx+ns.x,cy+ns.y,18);
      gr.addColorStop(0,rgba(n.color,0.9));gr.addColorStop(0.5,rgba(n.color,0.3));gr.addColorStop(1,'transparent');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx+ns.x,cy+ns.y,18,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx+ns.x,cy+ns.y,4,0,Math.PI*2);ctx.fillStyle=n.color;ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font='8px monospace';ctx.fillStyle=rgba(n.color,0.8);ctx.textAlign='center';ctx.fillText('w'+(idx+1),cx+ns.x,cy+ns.y+14);
    });
    ctx.font='9px monospace';ctx.fillStyle='rgba(79,249,117,0.6)';ctx.textAlign='left';ctx.fillText('ⵟ = Σ (x·wᵢ)² / ||x-wᵢ||²',10,h-10);
    ctx.textAlign='right';ctx.fillText(`neurons: ${neurons.length}/5`,w-10,h-10);
    rotationAngle+=0.003;
    yatRafId = requestAnimationFrame(draw);
  }

  canvas.onclick = e => {
    e.stopPropagation();
    const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left-w/2,my=e.clientY-rect.top-h/2+10;
    const c=Math.cos(-rotationAngle),s=Math.sin(-rotationAngle),wx=mx*c-(my/tiltAngle)*s,wy=mx*s+(my/tiltAngle)*c;
    for(let i=0;i<neurons.length;i++){const dx=neurons[i].x-wx,dy=neurons[i].y-wy;if(Math.sqrt(dx*dx+dy*dy)<20&&neurons.length>1){neurons.splice(i,1);return;}}
    if(neurons.length<5)neurons.push({x:Math.max(-120,Math.min(120,wx)),y:Math.max(-120,Math.min(120,wy)),color:neuronColors[neurons.length%neuronColors.length]});
  };

  draw();
}

// ── Aether Models Animation (Slide 10) — Loan Decision Narrative ──────
function initAetherModels() {
  const canvas = document.getElementById('aether-models-canvas');
  if (!canvas) return;
  if (canvas._aetherRaf) { cancelAnimationFrame(canvas._aetherRaf); }

  const ctx = canvas.getContext('2d');
  const rectC = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = rectC.width, H = rectC.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // ── Palette ──────────────────────────────────────────────────────────
  const GREEN  = '#4ff975', CYAN = '#4deeea', RED = '#ff4455',
        ORANGE = '#f9a825', GOLD = '#f9d71c', GRAY = '#6b7f72',
        PANEL  = 'rgba(8,18,12,0.92)';

  function r(hex, a) {
    const n = parseInt(hex.replace('#',''), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  }
  function easeOut(t) { return 1-(1-Math.min(t,1))*(1-Math.min(t,1)); }
  function clamp(t,a,b) { return Math.max(a, Math.min(b, t)); }
  function w01(s,e) { return clamp((tick-s)/(e-s), 0, 1); }

  // ── Model box (left) ─────────────────────────────────────────────────
  const MS   = Math.min(H * 0.48, W * 0.26, 110);   // box size
  const MX   = MS * 0.58 + 4;                         // center x
  const MY   = H * 0.50;                              // center y
  const ROWS = 4, COLS = 4;

  function nPos(row, col) {
    const pad = MS * 0.18;
    return {
      x: MX - MS/2 + pad + col * (MS - pad*2)/(COLS-1),
      y: MY - MS/2 + pad + row * (MS - pad*2)/(ROWS-1),
    };
  }

  // ── Phase timeline (ticks) ───────────────────────────────────────────
  const P = {
    IDLE:    [0,   55],
    QUERY:   [55,  120],
    PROC:    [120, 175],
    DENY:    [175, 240],
    AUDIT:   [240, 295],
    TRAIL:   [295, 470],
    BIAS:    [470, 540],
    STEER:   [540, 600],
    REEVAL:  [600, 650],
    APPROVE: [650, 730],
    HOLD:    [730, 790],
    FADE:    [790, 830],
  };
  const LOOP = 830;
  let tick = 0;

  function phase() {
    for (const [k,[s,e]] of Object.entries(P)) if (tick>=s && tick<e) return {k, t:(tick-s)/(e-s)};
    return {k:'FADE', t:1};
  }

  // ── Right-panel layout ───────────────────────────────────────────────
  const RX = MX + MS/2 + 18;  // right panel start x
  const RW = W - RX - 6;      // right panel width

  // Terminal row items — each has a fixed Y, appears at a given tick
  const ITEMS = [
    // [showTick, y_frac, type, text, color, bold]
    [P.QUERY[0],  0.085, 'cmd',    '>> query( loan_application )',                CYAN,   false],
    [P.QUERY[0]+20, 0.175,'label', 'client: J. Doe  |  amount: $250,000',        GRAY,   false],
    [P.DENY[0],   0.295, 'result', '\u2717  DECISION: DENY',                     RED,    true ],
    [P.AUDIT[0],  0.415, 'cmd',    '>> audit_trail( decision )',                  GOLD,   false],
    [P.TRAIL[0],  0.515, 'row',    'income       $68,400   \u2192  \u2713 OK',   GREEN,  false],
    [P.TRAIL[0]+43,0.585,'row',    'credit_score 720       \u2192  \u2713 OK',   GREEN,  false],
    [P.TRAIL[0]+86,0.655,'row',    'debt_ratio   34%       \u2192  \u2713 OK',   GREEN,  false],
    [P.TRAIL[0]+129,0.725,'row',   'zip_code     10452     \u2192  \u26a0 BIAS', ORANGE, true ],
    [P.BIAS[0],   0.820, 'alert',  '\u26a0  BIAS: geographic proxy detected',    ORANGE, true ],
    [P.STEER[0],  0.915, 'cmd',    ">> steer.remove('zip_code_proxy')",           GOLD,   false],
  ];

  // ── Draw helpers ─────────────────────────────────────────────────────
  function drawBox(x, y, w, h, stroke, fill, radius) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius||3);
    ctx.fillStyle = fill;   ctx.fill();
    ctx.strokeStyle = stroke; ctx.stroke();
  }

  function drawCorners(x, y, s, col) {
    const ca = 7;
    ctx.strokeStyle = r(col, 0.9); ctx.lineWidth = 1.8;
    [[x,y],[x+s,y],[x,y+s],[x+s,y+s]].forEach(([cx,cy],i) => {
      const sx=i%2===0?1:-1, sy=i<2?1:-1;
      ctx.beginPath(); ctx.moveTo(cx+sx*ca,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+sy*ca); ctx.stroke();
    });
  }

  // ── Draw model glass box ─────────────────────────────────────────────
  function drawModel() {
    const {k} = phase();
    // Color based on narrative state
    let col = CYAN;
    if (k==='DENY'||k==='AUDIT'||k==='TRAIL'||k==='BIAS') col = RED;
    else if (k==='STEER'||k==='REEVAL') col = ORANGE;
    else if (k==='APPROVE'||k==='HOLD'||k==='FADE') col = GREEN;

    const pulse = 0.65 + 0.35*Math.sin(tick*0.05);
    const x = MX-MS/2, y = MY-MS/2;

    ctx.lineWidth = 1.5;
    drawBox(x, y, MS, MS, r(col, 0.45*pulse), PANEL, 4);
    drawCorners(x, y, MS, col);

    // Neurons + connections
    for (let row=0; row<ROWS; row++) {
      for (let col2=0; col2<COLS; col2++) {
        const np = nPos(row,col2);
        const isBias = row===2 && col2===1;

        // Connections to right neighbor
        if (col2<COLS-1) {
          const np2 = nPos(row,col2+1);
          let la = 0.10;
          if (k==='PROC'||k==='REEVAL') la = 0.10+0.35*Math.max(0,Math.sin(tick*0.14+row+col2));
          if (isBias && (k==='TRAIL'||k==='BIAS')) la = 0.5+0.4*Math.sin(tick*0.22);
          ctx.beginPath(); ctx.moveTo(np.x,np.y); ctx.lineTo(np2.x,np2.y);
          ctx.strokeStyle = r(isBias&&(k==='TRAIL'||k==='BIAS')?ORANGE:col, la);
          ctx.lineWidth = 0.8; ctx.stroke();
        }
        // Connections to bottom neighbor
        if (row<ROWS-1) {
          const np2 = nPos(row+1,col2);
          let la = 0.10;
          if (k==='PROC'||k==='REEVAL') la = 0.10+0.35*Math.max(0,Math.sin(tick*0.14+row+col2+2));
          ctx.beginPath(); ctx.moveTo(np.x,np.y); ctx.lineTo(np2.x,np2.y);
          ctx.strokeStyle = r(col, la); ctx.lineWidth = 0.8; ctx.stroke();
        }

        // Neuron dot
        let nc=col, na=0.28;
        if (isBias) {
          if (k==='TRAIL'||k==='BIAS')   { nc=ORANGE; na=0.5+0.45*Math.sin(tick*0.28); }
          else if (k==='STEER')          { nc=RED;    na=(1-phase().t)*0.6; }
          else if (k==='REEVAL'||k==='APPROVE'||k==='HOLD') { na=0.04; }
        } else if (k==='PROC'||k==='REEVAL') {
          na = 0.15+0.75*Math.max(0,Math.sin(tick*0.12+row*0.9+col2*0.6));
        } else if (k==='APPROVE'||k==='HOLD') {
          na = 0.28+0.18*Math.sin(tick*0.06+row+col2);
        }
        ctx.beginPath(); ctx.arc(np.x,np.y,2.2,0,Math.PI*2);
        ctx.fillStyle=r(nc,na); ctx.fill();
      }
    }

    // API port line
    ctx.setLineDash([3,3]);
    ctx.strokeStyle = r(col, 0.4); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(MX+MS/2,MY); ctx.lineTo(MX+MS/2+10,MY); ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = `bold 8.5px 'IBM Plex Mono',monospace`;
    ctx.fillStyle = r(col, 0.9); ctx.textAlign='center';
    ctx.fillText('AETHER·M', MX, y+MS+12);
    ctx.font = `7px 'IBM Plex Mono',monospace`;
    ctx.fillStyle = r(GRAY, 0.6);
    ctx.fillText('FINANCIAL API', MX, y+MS+22);
  }

  // ── Draw arrow from model to right or right to model ─────────────────
  function drawArrow(fromModel, startTick, endTick, yFrac, col) {
    const prog = easeOut(w01(startTick, endTick));
    if (prog<=0) return;
    const aY = H*yFrac;
    const modelEdge = MX+MS/2+10;
    const panelEdge = RX+4;
    if (fromModel) {
      const ex = panelEdge + (RW*0.2)*prog;
      ctx.strokeStyle = r(col, 0.45); ctx.lineWidth=1.2; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.moveTo(modelEdge,aY); ctx.lineTo(ex,aY); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const sx = panelEdge + RW*0.5 - (RW*0.5)*prog;
      ctx.strokeStyle = r(col, 0.45); ctx.lineWidth=1.2; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.moveTo(sx,aY); ctx.lineTo(modelEdge,aY); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── Draw all right-panel items ────────────────────────────────────────
  function drawItems() {
    const {k} = phase();
    // Fade out DENY when APPROVE arrives
    const denyFade = k==='APPROVE'||k==='HOLD'||k==='FADE' ? 1-clamp(w01(P.APPROVE[0],P.APPROVE[0]+35),0,1) : 1;

    ITEMS.forEach(([showAt, yFrac, type, text, col, bold]) => {
      const alpha = easeOut(w01(showAt, showAt+30));
      if (alpha<=0) return;

      // DENY row fades when APPROVE comes in
      const isResult = type==='result' && col===RED;
      const fa = isResult ? alpha * denyFade : alpha;
      if (fa<=0) return;

      const iy = H * yFrac;
      ctx.font = `${bold?'bold ':''} 8.5px 'IBM Plex Mono',monospace`;
      const tw = ctx.measureText(text).width;
      const pad=8, bh=18, bw=Math.max(tw+pad*2, RW*0.92);

      if (type==='cmd') {
        drawBox(RX, iy-bh/2, bw, bh, r(col,0.30*fa), r(col,0.05*fa), 3);
        ctx.fillStyle=r(col,0.9*fa); ctx.textAlign='left';
        ctx.fillText(text, RX+pad, iy+3.5);
      } else if (type==='label') {
        ctx.fillStyle=r(GRAY,0.65*fa); ctx.textAlign='left';
        ctx.fillText(text, RX+pad, iy+3.5);
      } else if (type==='result') {
        const pulse = 0.8+0.2*Math.sin(tick*0.18);
        drawBox(RX, iy-bh/2, bw, bh, r(col,0.7*fa*pulse), r(col,0.12*fa), 3);
        ctx.fillStyle=r(col,fa*pulse); ctx.textAlign='left';
        ctx.fillText(text, RX+pad, iy+3.5);
      } else if (type==='row') {
        const isBiasRow = col===ORANGE;
        const bpulse = isBiasRow && (k==='BIAS'||k==='STEER') ? 0.75+0.25*Math.sin(tick*0.22) : 1;
        drawBox(RX, iy-bh/2, bw, bh, r(col,0.22*fa*bpulse), r(col,0.04*fa), 2);
        ctx.fillStyle=r(GRAY,0.8*fa); ctx.textAlign='left';
        // left part
        const parts = text.split('\u2192');
        ctx.fillText(parts[0], RX+pad, iy+3.5);
        // right part (result)
        ctx.fillStyle=r(col,fa*bpulse); ctx.textAlign='right';
        ctx.fillText('\u2192'+parts[1], RX+bw-pad, iy+3.5);
        ctx.textAlign='left';
      } else if (type==='alert') {
        const ap = 0.7+0.3*Math.sin(tick*0.2);
        drawBox(RX, iy-bh/2, bw, bh, r(col,0.85*fa*ap), r(col,0.16*fa), 3);
        ctx.fillStyle=r(col,fa*ap); ctx.textAlign='left';
        ctx.fillText(text, RX+pad, iy+3.5);
      }
    });

    // APPROVE — appears after DENY fades
    if (tick >= P.APPROVE[0]) {
      const fa = easeOut(w01(P.APPROVE[0], P.APPROVE[0]+40));
      const iy = H * 0.295;
      const bh = 18;
      const pulse = 0.82+0.18*Math.sin(tick*0.1);
      const bw = RW*0.92;
      ctx.font = `bold 8.5px 'IBM Plex Mono',monospace`;
      drawBox(RX, iy-bh/2, bw, bh, r(GREEN,0.8*fa*pulse), r(GREEN,0.14*fa), 3);
      ctx.fillStyle = r(GREEN, fa*pulse); ctx.textAlign='left';
      ctx.fillText('\u2713  DECISION: APPROVE', RX+8, iy+3.5);
    }
  }

  // ── Directional arrows ────────────────────────────────────────────────
  function drawArrows() {
    drawArrow(false, P.QUERY[0],   P.QUERY[0]+40,  0.130, CYAN);   // query → model
    drawArrow(true,  P.DENY[0],    P.DENY[0]+35,   0.295, RED);    // model → deny
    drawArrow(false, P.AUDIT[0],   P.AUDIT[0]+35,  0.415, GOLD);   // audit cmd → model
    drawArrow(true,  P.TRAIL[0],   P.TRAIL[0]+50,  0.515, CYAN);   // model → trail
    drawArrow(false, P.STEER[0],   P.STEER[0]+40,  0.915, GOLD);   // steer → model
    drawArrow(true,  P.APPROVE[0], P.APPROVE[0]+35,0.295, GREEN);  // model → approve
  }

  // ── Phase label (top-left corner) ────────────────────────────────────
  const PLABELS = {
    IDLE:'READY', QUERY:'QUERYING', PROC:'PROCESSING', DENY:'RESPONSE',
    AUDIT:'AUDIT REQUEST', TRAIL:'DECISION PATH', BIAS:'BIAS DETECTED',
    STEER:'STEERING MODEL', REEVAL:'RE-EVALUATING', APPROVE:'CORRECTED',
    HOLD:'CORRECTED', FADE:'CORRECTED',
  };

  // ── Main loop ─────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const ph = phase();
    const masterAlpha = ph.k==='FADE' ? 1-easeOut(ph.t) : 1;
    ctx.globalAlpha = masterAlpha;

    // Divider
    ctx.strokeStyle = r(GRAY, 0.18); ctx.lineWidth=1; ctx.setLineDash([4,6]);
    ctx.beginPath(); ctx.moveTo(RX-6,8); ctx.lineTo(RX-6,H-8); ctx.stroke();
    ctx.setLineDash([]);

    drawArrows();
    drawModel();
    drawItems();

    // Phase label
    ctx.font = `7px 'IBM Plex Mono',monospace`;
    ctx.fillStyle = r(GRAY, 0.45); ctx.textAlign='left';
    ctx.fillText(PLABELS[ph.k]||'', 4, H-6);

    ctx.globalAlpha = 1;
    tick++;
    if (tick >= LOOP) tick = 0;
    canvas._aetherRaf = requestAnimationFrame(draw);
  }

  draw();
}

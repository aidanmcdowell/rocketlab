/* =====================================================================
   ORCA ENGINE — orca-engine.js
   Tactical C5ISR Simulation State & Radar Rendering
   SPA | SLA Division | ORCA Group
===================================================================== */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const SIM_TICK_MS   = 33;   // ~30 ticks/second base
const CANVAS_PAD    = 20;
const RANGE_NM      = { '25': 25, '50': 50, '100': 100 };
const PK_SM6        = 0.84;  // Pk per shot, SM-6
const PK_EWM        = 0.96;  // Pk per shot, Evolved SeaSparrow

const ENTITY_COLORS = {
  friendly: '#3b82f6',
  hostile:  '#ef4444',
  neutral:  '#22c55e',
  ghost:    '#a855f7'
};

const SUBTYPE_LABELS = {
  DDG: 'Guided Missile Destroyer', CVN: 'Aircraft Carrier',
  MPA: 'Maritime Patrol Aircraft', SSK: 'Attack Submarine',
  ASCM: 'Anti-Ship Cruise Missile', USV: 'Unmanned Surface Vessel',
  HGV: 'Hypersonic Glide Vehicle', DECOY: 'Probable Decoy',
  GHOST: 'Ghost Track (EW Artifact)', CARGO: 'Commercial Vessel',
  SUB: 'Submarine Contact'
};

/* ─────────────────────────────────────────────────────────────────
   SIMULATION STATE
───────────────────────────────────────────────────────────────── */
const SIM = {
  running:         false,
  speedMultiplier: 1,
  tick:            0,
  entities:        [],    // live entity objects
  engagements:     {},    // trackId -> { shots, pk_total, engaged }
  weapons:         { sm6: 24, ewm: 4 },
  selectedId:      null,
  activeScenario:  null,
  noiseActive:     false,
  eventLog:        [],
  lastFrameTime:   0,
  fps:             0,
  animFrameId:     null,
  rangeNm:         50,
  noiseTracks:     [],    // temporary injected ghost tracks
};

/* ─────────────────────────────────────────────────────────────────
   DOM REFERENCES
───────────────────────────────────────────────────────────────── */
let canvas, ctx;

function initDOMRefs() {
  canvas = document.getElementById('radarCanvas');
  ctx    = canvas ? canvas.getContext('2d') : null;
}

/* ─────────────────────────────────────────────────────────────────
   ENTITY HELPERS
───────────────────────────────────────────────────────────────── */
function deepCloneEntities(entityDefs) {
  return entityDefs.map(e => Object.assign({}, e, {
    weapons: e.weapons ? Object.assign({}, e.weapons) : undefined,
    neutralized: false,
    age: 0,
  }));
}

function getHostileEntities() {
  return SIM.entities.filter(e => e.type === 'hostile' && !e.neutralized);
}

function getFriendlyWithWeapons() {
  return SIM.entities.filter(e => e.type === 'friendly' && e.weapons);
}

/* ─────────────────────────────────────────────────────────────────
   SCENARIO LOADER
───────────────────────────────────────────────────────────────── */
function loadScenario(scenarioKey) {
  const scenario = ORCA_SCENARIOS[scenarioKey];
  if (!scenario) return;

  // Stop current loop
  if (SIM.animFrameId) cancelAnimationFrame(SIM.animFrameId);
  SIM.running = false;

  // Reset state
  SIM.entities       = deepCloneEntities(scenario.entities);
  SIM.engagements    = {};
  SIM.weapons        = { sm6: 24, ewm: 4 };
  SIM.selectedId     = null;
  SIM.activeScenario = scenarioKey;
  SIM.noiseActive    = false;
  SIM.noiseTracks    = [];
  SIM.tick           = 0;
  SIM.eventLog       = [];

  // Aggregate weapon counts from friendly platforms
  SIM.entities.forEach(e => {
    if (e.weapons) {
      SIM.weapons.sm6 += (e.weapons.sm6 || 0);
      SIM.weapons.ewm += (e.weapons.ewm || 0);
    }
  });
  // normalize to reasonable counts
  SIM.weapons.sm6 = Math.min(SIM.weapons.sm6, 32);
  SIM.weapons.ewm = Math.min(SIM.weapons.ewm, 8);

  // Update sensor feed UI
  updateSensorFeed(scenario.sensorStates);

  // Log
  logEvent('system', `[ SCENARIO ] ${scenario.name} — ${scenario.threat} THREAT`);
  logEvent('system', scenario.briefing.substring(0, 80) + '…');

  // Update UI
  updateTrackList();
  updateThreatPanel();
  updateWeaponMagazines();
  updateInspector();

  // Highlight active scenario button
  document.querySelectorAll('.scenario-inj-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scenario === scenarioKey);
  });

  // Start simulation
  SIM.running = true;
  setSimSpeed(1);
  startLoop();
}

/* ─────────────────────────────────────────────────────────────────
   MAIN SIMULATION LOOP
───────────────────────────────────────────────────────────────── */
function startLoop() {
  if (SIM.animFrameId) cancelAnimationFrame(SIM.animFrameId);

  function tick(timestamp) {
    // FPS calculation
    if (SIM.lastFrameTime) {
      const delta = timestamp - SIM.lastFrameTime;
      SIM.fps = Math.round(1000 / delta);
    }
    SIM.lastFrameTime = timestamp;

    if (SIM.running) {
      const dt = (SIM_TICK_MS / 1000) * SIM.speedMultiplier;
      updateEntities(dt);
      SIM.tick++;

      // Periodic UI refresh (every 6 ticks ~200ms)
      if (SIM.tick % 6 === 0) {
        updateTrackList();
        updateThreatPanel();
        updateWeaponMagazines();
        if (SIM.selectedId) updateInspector();
        document.getElementById('orcaFpsCounter').textContent =
          `${SIM.fps} FPS · TICK ${SIM.tick}`;
      }
    }

    renderRadar();
    SIM.animFrameId = requestAnimationFrame(tick);
  }

  SIM.animFrameId = requestAnimationFrame(tick);
}

/* ─────────────────────────────────────────────────────────────────
   ENTITY KINEMATICS
───────────────────────────────────────────────────────────────── */
function updateEntities(dt) {
  SIM.entities.forEach(entity => {
    if (entity.neutralized) return;
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
    entity.age = (entity.age || 0) + dt;

    // Wrap canvas boundary (keep entities on screen)
    entity.x = Math.max(0.02, Math.min(0.98, entity.x));
    entity.y = Math.max(0.02, Math.min(0.98, entity.y));

    // TTI decrements for hostile tracks
    if (entity.type === 'hostile' && entity.tti > 0) {
      entity.tti = Math.max(0, entity.tti - dt);
    }
  });

  // Noise tracks age out
  SIM.noiseTracks = SIM.noiseTracks.filter(n => {
    n.tti -= dt;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    return n.tti > 0;
  });

  // Check if any threat reaches impact (tti === 0)
  SIM.entities.forEach(entity => {
    if (entity.type === 'hostile' && entity.tti <= 0.1 && entity.tti > 0 && !entity.neutralized) {
      entity.neutralized = true;
      logEvent('hostile', `[ IMPACT ] ${entity.id} reached terminal point — no intercept.`);
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   CANVAS RADAR RENDERING — PPI SWEEP
───────────────────────────────────────────────────────────────── */
function resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;
  canvas.width  = parent.clientWidth;
  canvas.height = parent.clientHeight;
}

function renderRadar() {
  if (!ctx || !canvas) return;
  resizeCanvas();

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R  = Math.min(W, H) / 2 - CANVAS_PAD;
  const t  = SIM.tick;

  ctx.clearRect(0, 0, W, H);

  // ── Background ──
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  bgGrad.addColorStop(0, 'rgba(0,20,40,0.95)');
  bgGrad.addColorStop(1, 'rgba(2,9,18,1)');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // ── Range rings ──
  const ringCount = 4;
  ctx.strokeStyle = 'rgba(0,163,224,0.18)';
  ctx.setLineDash([4, 4]);
  for (let i = 1; i <= ringCount; i++) {
    const r = (R / ringCount) * i;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Range labels
    const nm = Math.round((SIM.rangeNm / ringCount) * i);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,163,224,0.45)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`${nm}NM`, cx + r + 3, cy - 3);
    ctx.setLineDash([4, 4]);
  }
  ctx.setLineDash([]);

  // ── Crosshairs ──
  ctx.strokeStyle = 'rgba(0,163,224,0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

  // ── Diagonal grid ──
  ctx.strokeStyle = 'rgba(0,163,224,0.07)';
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = (angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
    ctx.stroke();
  }

  // ── Radar sweep ──
  const sweepAngle = ((t * 2.5) % 360) * (Math.PI / 180);
  const sweepGrad = ctx.createConicalGradient
    ? null
    : null;
  // Filled sweep sector
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, sweepAngle - 1.2, sweepAngle, false);
  ctx.closePath();
  const swG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  swG.addColorStop(0, 'rgba(0,163,224,0.0)');
  swG.addColorStop(0.7, 'rgba(0,163,224,0.06)');
  swG.addColorStop(1, 'rgba(0,163,224,0.18)');
  ctx.fillStyle = swG;
  ctx.fill();
  // Sweep line
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R * Math.cos(sweepAngle), cy + R * Math.sin(sweepAngle));
  ctx.strokeStyle = 'rgba(0,163,224,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── Clip entities to radar circle ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // ── Render all entities ──
  const allEntities = [
    ...SIM.entities,
    ...SIM.noiseTracks.map(n => ({ ...n, type: 'hostile', subtype: 'GHOST' }))
  ];

  allEntities.forEach(entity => {
    if (entity.neutralized && entity.type !== 'friendly') return;
    drawEntity(entity, cx, cy, R, t);
  });

  ctx.restore();

  // ── Radar border ring ──
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,163,224,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Center pip ──
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#00a3e0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,163,224,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawEntity(entity, cx, cy, R, tick) {
  const px = cx + (entity.x - 0.5) * 2 * R;
  const py = cy + (entity.y - 0.5) * 2 * R;

  if (px < cx - R || px > cx + R || py < cy - R || py > cy + R) return;

  const isSelected = entity.id === SIM.selectedId;
  const isGhost    = entity.subtype === 'GHOST';

  let color = ENTITY_COLORS[entity.type] || '#fff';
  if (isGhost) color = ENTITY_COLORS.ghost;

  // Engagement indicator
  const engaged = SIM.engagements[entity.id]?.engaged;

  // ── Selection ring ──
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // ── Engagement ring ──
  if (engaged) {
    ctx.beginPath();
    ctx.arc(px, py, 10 + Math.sin(tick * 0.15) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Velocity vector line ──
  if (Math.abs(entity.vx) > 0.0001 || Math.abs(entity.vy) > 0.0001) {
    const vecLen = 28;
    const mag = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    const vxN = entity.vx / mag;
    const vyN = entity.vy / mag;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + vxN * vecLen, py + vyN * vecLen);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Entity symbol ──
  ctx.save();
  ctx.translate(px, py);

  const sz = isSelected ? 7 : 6;

  if (entity.type === 'friendly') {
    // Friendly: filled circle with blue
    ctx.beginPath();
    ctx.arc(0, 0, sz, 0, Math.PI * 2);
    ctx.fillStyle = entity.neutralized ? 'rgba(59,130,246,0.3)' : color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else if (entity.type === 'hostile') {
    // Hostile: diamond
    ctx.beginPath();
    ctx.moveTo(0, -sz - 2);
    ctx.lineTo(sz + 2, 0);
    ctx.lineTo(0, sz + 2);
    ctx.lineTo(-sz - 2, 0);
    ctx.closePath();
    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5 + Math.sin(tick * 0.1) * 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = entity.neutralized ? 'rgba(239,68,68,0.2)' : color;
      ctx.fill();
      ctx.strokeStyle = entity.neutralized ? 'rgba(239,68,68,0.4)' : '#fff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  } else {
    // Neutral: square
    ctx.beginPath();
    ctx.rect(-sz, -sz, sz * 2, sz * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.restore();

  // ── ID label ──
  ctx.fillStyle = entity.neutralized ? 'rgba(255,255,255,0.3)' : color;
  ctx.font = 'bold 9px JetBrains Mono, monospace';
  ctx.fillText(entity.id, px + 10, py - 8);

  // ── TTI label for hostile ──
  if (entity.type === 'hostile' && entity.tti > 0 && !entity.neutralized) {
    const ttiStr = entity.tti < 60
      ? `T-${Math.round(entity.tti)}s`
      : `T-${Math.round(entity.tti / 60)}m`;
    ctx.fillStyle = entity.tti < 60 ? '#ef4444' : '#f59e0b';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillText(ttiStr, px + 10, py + 0);
  }
}

/* ─────────────────────────────────────────────────────────────────
   CANVAS CLICK — TRACK SELECTION
───────────────────────────────────────────────────────────────── */
function handleRadarClick(event) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mx   = event.clientX - rect.left;
  const my   = event.clientY - rect.top;
  const W    = canvas.width;
  const H    = canvas.height;
  const cx   = W / 2;
  const cy   = H / 2;
  const R    = Math.min(W, H) / 2 - CANVAS_PAD;

  let closestId   = null;
  let closestDist = Infinity;
  const HIT_RADIUS = 18;

  SIM.entities.forEach(entity => {
    const px = cx + (entity.x - 0.5) * 2 * R;
    const py = cy + (entity.y - 0.5) * 2 * R;
    const d  = Math.hypot(mx - px, my - py);
    if (d < HIT_RADIUS && d < closestDist) {
      closestDist = d;
      closestId   = entity.id;
    }
  });

  SIM.selectedId = closestId;
  updateInspector();
  updateTrackList();
}

/* ─────────────────────────────────────────────────────────────────
   SIM CONTROLS
───────────────────────────────────────────────────────────────── */
function setSimSpeed(mult) {
  SIM.speedMultiplier = mult;
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    const btnMult = btn.dataset.speed === 'pause' ? 0 : parseFloat(btn.dataset.speed);
    btn.classList.toggle('active', mult === btnMult && mult > 0);
    btn.classList.toggle('sim-paused', btn.dataset.speed === 'pause' && mult === 0);
  });
  SIM.running = mult > 0;
  if (!SIM.running) {
    const pb = document.querySelector('[data-speed="pause"]');
    if (pb) pb.classList.add('sim-paused', 'active');
  }
}

function togglePause() {
  if (SIM.running) {
    setSimSpeed(0);
  } else {
    setSimSpeed(1);
  }
}

function setRangeNm(nm) {
  SIM.rangeNm = nm;
  document.querySelectorAll('.radar-range-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.range) === nm);
  });
}

/* ─────────────────────────────────────────────────────────────────
   ENGAGEMENT
───────────────────────────────────────────────────────────────── */
function engageTrack(trackId) {
  const entity = SIM.entities.find(e => e.id === trackId);
  if (!entity || entity.neutralized || entity.type !== 'hostile') return;

  if (SIM.weapons.sm6 <= 0) {
    logEvent('system', `[ WINCHESTER ] SM-6 magazine empty — no engagement possible.`);
    return;
  }

  const shotsToFire = entity.subtype === 'HGV' ? 3 : 2;
  const actualShots = Math.min(shotsToFire, SIM.weapons.sm6);
  SIM.weapons.sm6  -= actualShots;

  const pkTotal = 1 - Math.pow(1 - PK_SM6, actualShots);
  const roll    = Math.random();
  const success = roll <= pkTotal;

  SIM.engagements[trackId] = { shots: actualShots, pk_total: pkTotal, engaged: true };

  logEvent('friendly', `[ ENGAGE ] SM-6 × ${actualShots} → ${trackId} | Pk=${(pkTotal * 100).toFixed(1)}%`);

  setTimeout(() => {
    if (success) {
      entity.neutralized = true;
      logEvent('neutral', `[ SPLASH ] ${trackId} neutralized. Shots: ${actualShots}.`);
      if (SIM.engagements[trackId]) SIM.engagements[trackId].engaged = false;
      updateThreatPanel();
    } else {
      logEvent('hostile', `[ MISS ] ${trackId} survived intercept. Re-engage?`);
      if (SIM.engagements[trackId]) SIM.engagements[trackId].engaged = false;
    }
    updateWeaponMagazines();
  }, 2500);

  updateWeaponMagazines();
  updateThreatPanel();
}

function launchInterceptorSM6() {
  // Fire at highest-priority un-engaged hostile
  const targets = SIM.entities
    .filter(e => e.type === 'hostile' && !e.neutralized && !SIM.engagements[e.id]?.engaged && e.tti > 0)
    .sort((a, b) => a.tti - b.tti);

  if (targets.length === 0) {
    logEvent('system', `[ NO TARGETS ] No valid targets for intercept.`);
    return;
  }
  engageTrack(targets[0].id);
}

/* ─────────────────────────────────────────────────────────────────
   SPAWN SWARM (manual inject)
───────────────────────────────────────────────────────────────── */
function spawnSwarm() {
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const side = Math.random() < 0.5 ? 1 : -1;
    const newEntity = {
      id: `USV-S${String(SIM.entities.filter(e => e.subtype === 'USV').length + i + 1).padStart(2,'0')}`,
      type: 'hostile', subtype: 'USV', symbol: '◇',
      x: side > 0 ? 0.88 + Math.random() * 0.08 : 0.04 + Math.random() * 0.08,
      y: 0.3 + Math.random() * 0.4,
      vx: side > 0 ? -(0.0006 + Math.random() * 0.0004) : (0.0006 + Math.random() * 0.0004),
      vy: (Math.random() - 0.5) * 0.0004,
      speed: 30 + Math.floor(Math.random() * 15),
      heading: side > 0 ? 200 : 350,
      alt: 0, label: 'Swarm USV',
      tti: 160 + Math.floor(Math.random() * 80),
      neutralized: false, age: 0,
    };
    SIM.entities.push(newEntity);
  }
  logEvent('hostile', `[ SWARM ] ${count} USV contacts injected on divergent bearings.`);
  updateTrackList();
  updateThreatPanel();
}

/* ─────────────────────────────────────────────────────────────────
   NOISE INJECTION
───────────────────────────────────────────────────────────────── */
function injectNoise() {
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    SIM.noiseTracks.push({
      id:  `GHOST-${Date.now() % 10000}-${i}`,
      type: 'hostile', subtype: 'GHOST',
      x:   0.2 + Math.random() * 0.6,
      y:   0.2 + Math.random() * 0.6,
      vx:  (Math.random() - 0.5) * 0.0008,
      vy:  (Math.random() - 0.5) * 0.0008,
      tti: 8 + Math.random() * 15,   // ghost tracks fade out
    });
  }
  SIM.noiseActive = true;
  logEvent('system', `[ EW ] ${count} ghost tracks injected by radar noise.`);
  setTimeout(() => { SIM.noiseActive = false; }, 12000);
}

/* ─────────────────────────────────────────────────────────────────
   THREAT EVALUATOR (JavaScript equivalent of Java PriorityQueue)
───────────────────────────────────────────────────────────────── */
function getTopKThreats(k = 4) {
  const hostiles = SIM.entities
    .filter(e => e.type === 'hostile' && !e.neutralized && e.tti > 0)
    .sort((a, b) => a.tti - b.tti);  // ascending TTI = highest threat first
  return hostiles.slice(0, k);
}

function computePk(shots, pkSingle) {
  return 1 - Math.pow(1 - pkSingle, shots);
}

/* ─────────────────────────────────────────────────────────────────
   UI UPDATE FUNCTIONS
───────────────────────────────────────────────────────────────── */
function updateTrackList() {
  const list  = document.getElementById('trackList');
  const count = document.getElementById('trackCount');
  if (!list) return;

  const all = SIM.entities.filter(e => !e.neutralized || e.type === 'friendly');

  if (count) count.textContent = `${all.length} TRACKS`;

  list.innerHTML = all.map(entity => {
    const isSelected = entity.id === SIM.selectedId;
    const ttiClass   = entity.tti < 60 ? 'critical' : entity.tti < 120 ? 'warning' : 'safe';
    const ttiStr     = entity.type === 'hostile' && entity.tti > 0
      ? (entity.tti < 60 ? `T-${Math.round(entity.tti)}s` : `T-${Math.round(entity.tti/60)}m`)
      : (entity.type === 'friendly' ? 'FRND' : '—');
    const neutralTag = entity.neutralized ? ' (SPLASH)' : '';

    return `<div class="track-item ${entity.type} ${isSelected ? 'selected' : ''}" 
                onclick="selectTrack('${entity.id}')">
      <div class="track-sym">${entity.type === 'friendly' ? '◆' : entity.type === 'hostile' ? '◇' : '□'}</div>
      <div class="track-info">
        <div class="track-id">${entity.id}${neutralTag}</div>
        <div class="track-meta">${SUBTYPE_LABELS[entity.subtype] || entity.subtype} · ${Math.round(entity.speed)} kt</div>
      </div>
      <div class="track-tti ${entity.type === 'hostile' && !entity.neutralized ? ttiClass : ''}">${ttiStr}</div>
    </div>`;
  }).join('');
}

function updateThreatPanel() {
  const panel = document.getElementById('threatEvaluatorList');
  if (!panel) return;

  const threats = getTopKThreats(5);

  if (threats.length === 0) {
    panel.innerHTML = '<div class="insp-none" style="padding:10px">No active threats detected</div>';
    return;
  }

  panel.innerHTML = threats.map((t, i) => {
    const tier     = i === 0 ? 't1' : i === 1 ? 't2' : 't3';
    const tierLabel= i === 0 ? 'T1 CRITICAL' : i === 1 ? 'T2 WARNING' : 'T3 MONITOR';
    const cardCls  = i === 0 ? 'critical' : i === 1 ? 'warning' : '';
    const pk       = computePk(2, PK_SM6);
    const pkPct    = Math.round(pk * 100);
    const pkCls    = pkPct >= 75 ? 'high' : pkPct >= 50 ? 'med' : 'low';
    const ttiStr   = t.tti < 60 ? `${Math.round(t.tti)}s` : `${Math.round(t.tti/60)}m ${Math.round(t.tti%60)}s`;
    const engaged  = SIM.engagements[t.id]?.engaged;
    const ttiValCls= t.tti < 60 ? 'red' : t.tti < 120 ? 'amber' : 'green';

    return `
    <div class="threat-card ${cardCls}" id="tc-${t.id}">
      <div class="threat-card-header">
        <div class="threat-tier ${tier}">${tierLabel}</div>
        <div class="threat-card-id">${t.id}</div>
        <div class="threat-card-type">${SUBTYPE_LABELS[t.subtype] || t.subtype}</div>
      </div>
      <div class="threat-stats">
        <div class="threat-stat">
          <div class="stat-label">TTI</div>
          <div class="stat-value ${ttiValCls}">${ttiStr}</div>
        </div>
        <div class="threat-stat">
          <div class="stat-label">Speed</div>
          <div class="stat-value blue">${Math.round(t.speed)} kt</div>
        </div>
        <div class="threat-stat">
          <div class="stat-label">Bearing</div>
          <div class="stat-value">${Math.round(t.heading)}°</div>
        </div>
        <div class="threat-stat">
          <div class="stat-label">Alt/Depth</div>
          <div class="stat-value">${t.alt > 0 ? t.alt + ' ft' : t.alt < 0 ? Math.abs(t.alt) + ' ft↓' : 'SFC'}</div>
        </div>
        <div class="pk-bar-wrap">
          <div class="pk-bar-label">
            <span>Pk (SM-6 × 2)</span>
            <span>${pkPct}%</span>
          </div>
          <div class="pk-bar-bg">
            <div class="pk-bar-fill ${pkCls}" style="width:${pkPct}%"></div>
          </div>
        </div>
      </div>
      <button class="engage-btn ${engaged ? 'engaged' : ''}" 
              onclick="engageTrack('${t.id}')" 
              ${engaged ? 'disabled' : ''}>
        ${engaged ? '⚡ INTERCEPT IN FLIGHT' : '⚡ ENGAGE — SM-6'}
      </button>
    </div>`;
  }).join('');
}

function updateWeaponMagazines() {
  const sm6Mag = document.getElementById('magSM6');
  const ewmMag = document.getElementById('magEWM');

  if (sm6Mag) {
    sm6Mag.innerHTML = Array.from({ length: 32 }, (_, i) =>
      `<div class="mag-cell ${i < SIM.weapons.sm6 ? 'loaded' : 'expended'}"></div>`
    ).join('');
  }
  if (ewmMag) {
    ewmMag.innerHTML = Array.from({ length: 8 }, (_, i) =>
      `<div class="mag-cell ${i < SIM.weapons.ewm ? 'loaded' : 'expended'}"></div>`
    ).join('');
  }
}

function updateInspector() {
  const inspId   = document.getElementById('inspectorId');
  const inspGrid = document.getElementById('inspectorGrid');
  if (!inspId || !inspGrid) return;

  const entity = SIM.selectedId
    ? SIM.entities.find(e => e.id === SIM.selectedId)
    : null;

  if (!entity) {
    inspId.textContent   = '—';
    inspGrid.innerHTML   = '<div class="insp-none">Click a radar contact to inspect</div>';
    return;
  }

  inspId.textContent = entity.id;
  const pk = computePk(2, PK_SM6);
  const ttiStr = entity.type === 'hostile' && entity.tti > 0
    ? (entity.tti < 60 ? `${Math.round(entity.tti)}s` : `${Math.round(entity.tti/60)}m`)
    : '—';

  inspGrid.innerHTML = `
    <div class="insp-field"><div class="insp-label">Classification</div><div class="insp-val" style="color:${ENTITY_COLORS[entity.type]}">${entity.type.toUpperCase()}</div></div>
    <div class="insp-field"><div class="insp-label">Subtype</div><div class="insp-val">${SUBTYPE_LABELS[entity.subtype] || entity.subtype}</div></div>
    <div class="insp-field"><div class="insp-label">Speed</div><div class="insp-val">${Math.round(entity.speed)} kt</div></div>
    <div class="insp-field"><div class="insp-label">Heading</div><div class="insp-val">${Math.round(entity.heading)}°</div></div>
    <div class="insp-field"><div class="insp-label">Altitude</div><div class="insp-val">${entity.alt > 0 ? entity.alt + ' ft' : entity.alt < 0 ? Math.abs(entity.alt) + ' ft (D)' : 'Surface'}</div></div>
    <div class="insp-field"><div class="insp-label">TTI</div><div class="insp-val" style="color:${entity.tti < 60 ? '#ef4444' : '#f59e0b'}">${ttiStr}</div></div>
    <div class="insp-field"><div class="insp-label">Pk (SM-6×2)</div><div class="insp-val" style="color:#22c55e">${Math.round(pk * 100)}%</div></div>
    <div class="insp-field"><div class="insp-label">Status</div><div class="insp-val" style="color:${entity.neutralized ? '#22c55e' : '#ef4444'}">${entity.neutralized ? 'NEUTRALIZED' : 'ACTIVE'}</div></div>
  `;
}

function updateSensorFeed(states) {
  const sensors = ['radar', 'sonar', 'esm', 'ais'];
  sensors.forEach(s => {
    const dot    = document.getElementById(`sensor-dot-${s}`);
    const status = document.getElementById(`sensor-status-${s}`);
    if (!dot || !status) return;
    const state = states ? states[s] : 'online';
    dot.className    = `sensor-dot ${state}`;
    status.textContent = state.toUpperCase();
  });
}

function selectTrack(id) {
  SIM.selectedId = (SIM.selectedId === id) ? null : id;
  updateInspector();
  updateTrackList();
}

/* ─────────────────────────────────────────────────────────────────
   EVENT LOG
───────────────────────────────────────────────────────────────── */
function logEvent(type, message) {
  SIM.eventLog.unshift({ type, message, time: new Date() });
  if (SIM.eventLog.length > 80) SIM.eventLog.pop();

  const log = document.getElementById('eventLogList');
  if (!log) return;
  const div = document.createElement('div');
  div.className = `event-line ${type}`;
  const ts = new Date().toISOString().substr(11, 8);
  div.textContent = `[${ts}Z] ${message}`;
  log.insertBefore(div, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

/* ─────────────────────────────────────────────────────────────────
   ZULU CLOCK
───────────────────────────────────────────────────────────────── */
function startZuluClock() {
  const el = document.getElementById('orcaZuluTime');
  if (!el) return;
  function tick() {
    el.textContent = new Date().toISOString().substr(11, 8) + 'Z';
    setTimeout(tick, 1000);
  }
  tick();
}

/* ─────────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────────── */
function initORCA() {
  initDOMRefs();

  if (canvas) {
    canvas.addEventListener('click', handleRadarClick);
    window.addEventListener('resize', resizeCanvas);
  }

  startZuluClock();

  // Wire simulation speed buttons
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = btn.dataset.speed;
      if (s === 'pause') {
        setSimSpeed(0);
      } else {
        setSimSpeed(parseFloat(s));
      }
    });
  });

  // Wire range buttons
  document.querySelectorAll('.radar-range-btn').forEach(btn => {
    btn.addEventListener('click', () => setRangeNm(parseInt(btn.dataset.range)));
  });

  // Wire scenario buttons
  document.querySelectorAll('.scenario-inj-btn').forEach(btn => {
    btn.addEventListener('click', () => loadScenario(btn.dataset.scenario));
  });

  // Wire radar action buttons
  const spawnBtn     = document.getElementById('btnSpawnSwarm');
  const interceptBtn = document.getElementById('btnInterceptSM6');
  const noiseBtn     = document.getElementById('btnInjectNoise');
  if (spawnBtn)     spawnBtn.addEventListener('click', spawnSwarm);
  if (interceptBtn) interceptBtn.addEventListener('click', launchInterceptorSM6);
  if (noiseBtn)     noiseBtn.addEventListener('click', injectNoise);

  // Wire whiteboard run + solution
  const wbRun = document.getElementById('wbRunBtn');
  const wbSol = document.getElementById('wbSolBtn');
  if (wbRun) wbRun.addEventListener('click', () => {
    if (window.whiteboardController) window.whiteboardController.runTests();
  });
  if (wbSol) wbSol.addEventListener('click', () => {
    if (window.whiteboardController) window.whiteboardController.toggleSolution();
  });

  // Default scenario
  loadScenario('redSeaSwarm');

  // Initialize whiteboard
  window.whiteboardController = new WhiteboardController();

  logEvent('system', '[ ORCA ] System initialized. UNCLASSIFIED // M&S DEMO.');
  logEvent('system', '[ SYSTEM ] All subsystems nominal.');
}

// Expose for HTML onclick handlers
window.selectTrack   = selectTrack;
window.engageTrack   = engageTrack;
window.loadScenario  = loadScenario;
window.spawnSwarm    = spawnSwarm;
window.injectNoise   = injectNoise;
window.setSimSpeed   = setSimSpeed;
window.setRangeNm    = setRangeNm;

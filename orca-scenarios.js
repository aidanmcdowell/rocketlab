/* =====================================================================
   ORCA SCENARIOS — orca-scenarios.js
   Four preset Operations Research vignettes aligned with
   realistic defense modeling whiteboard problem archetypes
===================================================================== */

const ORCA_SCENARIOS = {

  // ── SCENARIO 1 (40% Probability on Whiteboard): Island Chain ASW ──
  aswIslandChain: {
    id: 'aswIslandChain',
    name: 'Island Chain ASW (Track Correlator & Eviction)',
    icon: '🌊',
    probBadge: '40% ODDS',
    desc: 'Multi-sensor track correlation & stale track eviction (Euclidean dX/dY)',
    classification: 'UNCLASS // M&S',
    threat: 'BRAVO',
    briefing: 'SONAR BUOY CLUSTER: Intermittent sonobuoy datums detecting contacts with spatial jitter. TrackManager must correlate duplicate pings within distance threshold (dX, dY) and evict stale contacts that have lost line-of-sight.',
    sensorStates: {
      radar: 'online', sonar: 'online', esm: 'online', ais: 'online'
    },
    entities: [
      { id: 'DDG-72', type: 'friendly', subtype: 'DDG', symbol: '◆', x: 0.45, y: 0.48, vx: 0.0001, vy: 0.0000, speed: 12, heading: 90,  alt: 0,     label: 'USS Mahan', weapons: { sm6: 28, ewm: 4 } },
      { id: 'P8-02',  type: 'friendly', subtype: 'MPA', symbol: '▲', x: 0.40, y: 0.40, vx: 0.0003, vy: 0.0002, speed: 390, heading: 45,  alt: 18000, label: 'P-8 ASW' },
      { id: 'SSK-A',  type: 'hostile', subtype: 'SUB', symbol: '◇', x: 0.62, y: 0.55, vx:-0.0003, vy:-0.0001, speed: 8,   heading: 240, alt: -300,  label: 'SSK Contact Alpha', tti: 420 },
      { id: 'SSK-B',  type: 'hostile', subtype: 'SUB', symbol: '◇', x: 0.65, y: 0.58, vx:-0.0002, vy:-0.0002, speed: 6,   heading: 225, alt: -400,  label: 'SSK Probable Datum', tti: 480 },
      { id: 'MV-AP01',type: 'neutral', subtype: 'CARGO', symbol: '□', x: 0.70, y: 0.32, vx:-0.0001, vy: 0.0001, speed: 12, heading: 135, alt: 0,     label: 'AP Fishing Vessel' },
      { id: 'MV-AP02',type: 'neutral', subtype: 'CARGO', symbol: '□', x: 0.30, y: 0.60, vx: 0.0002, vy: 0.0000, speed: 10, heading: 90,  alt: 0,     label: 'Commercial Tanker' },
    ]
  },

  // ── SCENARIO 2 (30% Probability on Whiteboard): Discrete-Event Sim Loop ──
  desTimeline: {
    id: 'desTimeline',
    name: 'Discrete-Event Sim Loop (Timeline Engine)',
    icon: '⏱️',
    probBadge: '30% ODDS',
    desc: 'PriorityQueue<SimEvent> monotonic execution without temporal paradoxes',
    classification: 'UNCLASS // M&S',
    threat: 'BRAVO',
    briefing: 'DES ENGINE: Warfighting theater timeline tracking scheduled radar sweeps (t=2.0s), missile booster separations (t=5.4s), and kinetic intercepts. SimulationEngine must process events monotonically in strict chronological order.',
    sensorStates: {
      radar: 'online', sonar: 'online', esm: 'online', ais: 'online'
    },
    entities: [
      { id: 'DDG-79', type: 'friendly', subtype: 'DDG', symbol: '◆', x: 0.50, y: 0.50, vx: 0.0000, vy: 0.0000, speed: 0,   heading: 0,   alt: 0,     label: 'USS Oscar Austin', weapons: { sm6: 24, ewm: 4 } },
      { id: 'T-EV01', type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.80, y: 0.28, vx:-0.0016, vy: 0.0009, speed: 520, heading: 215, alt: 60,    label: 'Scheduled Event t=4.2s', tti: 52 },
      { id: 'T-EV02', type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.75, y: 0.22, vx:-0.0015, vy: 0.0010, speed: 500, heading: 220, alt: 55,    label: 'Scheduled Event t=7.8s', tti: 68 },
      { id: 'T-EV03', type: 'hostile', subtype: 'USV',  symbol: '◇', x: 0.70, y: 0.65, vx:-0.0006, vy:-0.0004, speed: 38,  heading: 200, alt: 0,     label: 'Scheduled Event t=14.0s', tti: 140 },
      { id: 'P8-DES', type: 'friendly', subtype: 'MPA', symbol: '▲', x: 0.48, y: 0.35, vx: 0.0004, vy: 0.0001, speed: 450, heading: 85,  alt: 22000, label: 'Sweep Event t=2.0s' },
    ]
  },

  // ── SCENARIO 3 (20% Probability on Whiteboard): Red Sea Saturation ──
  redSeaSwarm: {
    id: 'redSeaSwarm',
    name: 'Red Sea Saturation (Threat Allocator)',
    icon: '⚔️',
    probBadge: '20% ODDS',
    desc: 'PriorityQueue threat ranking by closure velocity & magazine limits',
    classification: 'UNCLASS // M&S',
    threat: 'ALPHA',
    briefing: 'SATURATION DEFENSE: 12x low-cost USV surface drones and 4x anti-ship cruise missiles on divergent bearings. ThreatEvaluator must prioritize targets by ascending Time-To-Impact and respect finite interceptor magazine caps.',
    sensorStates: {
      radar: 'online', sonar: 'online', esm: 'online', ais: 'degraded'
    },
    entities: [
      // Friendlies
      { id: 'DDG-79', type: 'friendly', subtype: 'DDG', symbol: '◆', x: 0.50, y: 0.50, vx: 0.0000, vy: 0.0000, speed: 0,   heading: 0,   alt: 0,    label: 'USS Oscar Austin', weapons: { sm6: 24, ewm: 4 } },
      { id: 'P8-01',  type: 'friendly', subtype: 'MPA', symbol: '▲', x: 0.52, y: 0.38, vx: 0.0004, vy: 0.0001, speed: 490, heading: 80,  alt: 25000, label: 'P-8 Poseidon ISR' },
      // Hostile ASCMs
      { id: 'T-H01', type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.85, y: 0.30, vx:-0.0018, vy: 0.0008, speed: 510, heading: 210, alt: 50,    label: 'Anti-Ship CM', tti: 48 },
      { id: 'T-H02', type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.82, y: 0.25, vx:-0.0017, vy: 0.0009, speed: 510, heading: 215, alt: 50,    label: 'Anti-Ship CM', tti: 51 },
      { id: 'T-H03', type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.20, y: 0.22, vx: 0.0012, vy: 0.0014, speed: 490, heading: 135, alt: 30,    label: 'Anti-Ship CM', tti: 62 },
      { id: 'T-H04', type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.18, y: 0.26, vx: 0.0013, vy: 0.0013, speed: 490, heading: 140, alt: 30,    label: 'Anti-Ship CM', tti: 65 },
      // Hostile USV Swarm
      { id: 'USV-01', type: 'hostile', subtype: 'USV', symbol: '◇', x: 0.78, y: 0.65, vx:-0.0008, vy:-0.0004, speed: 35, heading: 195, alt: 0,     label: 'Unmanned SV', tti: 180 },
      { id: 'USV-02', type: 'hostile', subtype: 'USV', symbol: '◇', x: 0.80, y: 0.68, vx:-0.0008, vy:-0.0003, speed: 35, heading: 200, alt: 0,     label: 'Unmanned SV', tti: 185 },
      { id: 'USV-03', type: 'hostile', subtype: 'USV', symbol: '◇', x: 0.76, y: 0.70, vx:-0.0007, vy:-0.0004, speed: 35, heading: 198, alt: 0,     label: 'Unmanned SV', tti: 192 },
      { id: 'USV-04', type: 'hostile', subtype: 'USV', symbol: '◇', x: 0.28, y: 0.75, vx: 0.0007, vy:-0.0005, speed: 32, heading: 15,  alt: 0,     label: 'Unmanned SV', tti: 210 },
      { id: 'USV-05', type: 'hostile', subtype: 'USV', symbol: '◇', x: 0.26, y: 0.78, vx: 0.0008, vy:-0.0004, speed: 32, heading: 18,  alt: 0,     label: 'Unmanned SV', tti: 218 },
      // Neutral
      { id: 'MV-COSCO', type: 'neutral', subtype: 'CARGO', symbol: '□', x: 0.60, y: 0.35, vx: 0.0001, vy: 0.0002, speed: 14, heading: 90,  alt: 0, label: 'Commercial Cargo' },
    ]
  },

  // ── SCENARIO 4 (10% Probability on Whiteboard): Polymorphic C5ISR Sensor Stream ──
  degradedC5ISR: {
    id: 'degradedC5ISR',
    name: 'Polymorphic C5ISR (Factory & Parser)',
    icon: '📡',
    probBadge: '10% ODDS',
    desc: 'Heterogeneous sensor message ingestion via abstract SensorParser factory',
    classification: 'UNCLASS // M&S',
    threat: 'CHARLIE',
    briefing: 'C5ISR HETEROGENEOUS INGESTION: Incoming byte packets from radar, active sonar, and ESM suites. Refactor fragile if/else parser to an extensible SensorParser interface and registry to honor the Open/Closed Principle.',
    sensorStates: {
      radar: 'online', sonar: 'online', esm: 'degraded', ais: 'online'
    },
    entities: [
      { id: 'DDG-79', type: 'friendly', subtype: 'DDG', symbol: '◆', x: 0.50, y: 0.50, vx: 0.0000, vy: 0.0000, speed: 0,   heading: 0, alt: 0,    label: 'USS Oscar Austin', weapons: { sm6: 18, ewm: 3 } },
      { id: 'T-R01',  type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.78, y: 0.30, vx:-0.0016, vy: 0.0012, speed: 480, heading: 210, alt: 50,  label: 'ASCM (Radar Feed)', tti: 58 },
      { id: 'T-S01',  type: 'hostile', subtype: 'SUB',  symbol: '◇', x: 0.60, y: 0.45, vx: 0.0002, vy: 0.0001, speed: 12,  heading: 180, alt:-200, label: 'Sub (Sonar Feed)', tti: 310 },
      { id: 'T-E01',  type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.30, y: 0.40, vx:-0.0002, vy: 0.0005, speed: 520, heading: 170, alt: 80,  label: 'Emitter (ESM Feed)', tti: 95 },
      { id: 'MV-N01', type: 'neutral', subtype: 'CARGO', symbol: '□', x: 0.55, y: 0.35, vx: 0.0001, vy: 0.0001, speed: 12, heading: 90,  alt: 0,   label: 'Merchant Vessel (AIS)' },
    ]
  }
};

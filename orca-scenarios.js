/* =====================================================================
   ORCA SCENARIOS — orca-scenarios.js
   Four preset Operations Research vignettes
===================================================================== */

const ORCA_SCENARIOS = {

  // ── SCENARIO 1: Red Sea Multi-Axis Drone Swarm ─────────────────────
  redSeaSwarm: {
    id: 'redSeaSwarm',
    name: 'Red Sea Drone Swarm',
    icon: '🌊',
    desc: 'Multi-axis USV + cruise missile saturation',
    classification: 'UNCLASS // M&S',
    threat: 'ALPHA',
    briefing: 'INBOUND: 12x low-cost USV surface drones and 4x anti-ship cruise missiles on divergent bearings. Interceptor magazine count is limited. Priority queue management and shot economy are critical.',
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

  // ── SCENARIO 2: First Island Chain ASW ─────────────────────────────
  aswIslandChain: {
    id: 'aswIslandChain',
    name: 'Island Chain ASW',
    icon: '🌊',
    desc: 'Subsurface contact via noisy sonobuoy data',
    classification: 'UNCLASS // M&S',
    threat: 'BRAVO',
    briefing: 'SONAR CONTACT: intermittent sonobuoy datum suggests SSK-class submarine transiting between Okinawa and Miyako. Track correlation noisy. P-8 dropping additional sonobuoys. Confirm classification before engagement.',
    sensorStates: {
      radar: 'online', sonar: 'degraded', esm: 'online', ais: 'online'
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

  // ── SCENARIO 3: Hypersonic Glide Vehicle Defense ────────────────────
  hypersonicDefense: {
    id: 'hypersonicDefense',
    name: 'HGV Defense',
    icon: '⚡',
    desc: 'Mach 6+ HGV — extreme TTI constraint',
    classification: 'UNCLASS // M&S',
    threat: 'CRITICAL',
    briefing: 'CRITICAL: Hypersonic Glide Vehicle detected at Mach 6.2 on terminal trajectory. SBIRS cueing confirmed. Engagement window: 18 seconds. Automated allocation engaged. SM-6 Block IB salvo authorized.',
    sensorStates: {
      radar: 'online', sonar: 'online', esm: 'degraded', ais: 'online'
    },
    entities: [
      { id: 'CSG-CORE', type: 'friendly', subtype: 'CVN', symbol: '◆', x: 0.48, y: 0.52, vx: 0.0000, vy: 0.0000, speed: 0,   heading: 0,   alt: 0,     label: 'CVN-73 George Washington', weapons: { sm6: 30, ewm: 8 } },
      { id: 'DDG-91',   type: 'friendly', subtype: 'DDG', symbol: '◆', x: 0.44, y: 0.48, vx: 0.0000, vy: 0.0000, speed: 0,   heading: 0,   alt: 0,     label: 'USS Pinckney (Escort)', weapons: { sm6: 24, ewm: 4 } },
      { id: 'HGV-01',   type: 'hostile', subtype: 'HGV', symbol: '◇', x: 0.92, y: 0.08, vx:-0.0055, vy: 0.0045, speed: 4100, heading: 225, alt: 35000, label: 'HGV Terminal Phase', tti: 18 },
      { id: 'DECOY-01', type: 'hostile', subtype: 'DECOY', symbol: '◇', x: 0.89, y: 0.11, vx:-0.0040, vy: 0.0036, speed: 3200, heading: 228, alt: 30000, label: 'Possible Decoy', tti: 24 },
    ]
  },

  // ── SCENARIO 4: Degraded C5ISR / EW Jamming ─────────────────────────
  degradedC5ISR: {
    id: 'degradedC5ISR',
    name: 'Degraded C5ISR / EW',
    icon: '📡',
    desc: 'Cyber + EW jamming — filter ghost tracks',
    classification: 'UNCLASS // M&S',
    threat: 'CHARLIE',
    briefing: 'EW ALERT: Adversary electronic jamming detected. Radar processing injecting 30% false-positive ghost tracks. Comms to higher degraded. Filter software must discriminate ghost contacts from real threats.',
    sensorStates: {
      radar: 'degraded', sonar: 'online', esm: 'offline', ais: 'degraded'
    },
    entities: [
      { id: 'DDG-79', type: 'friendly', subtype: 'DDG', symbol: '◆', x: 0.50, y: 0.50, vx: 0.0000, vy: 0.0000, speed: 0,   heading: 0, alt: 0,    label: 'USS Oscar Austin', weapons: { sm6: 18, ewm: 3 } },
      { id: 'T-R01',  type: 'hostile', subtype: 'ASCM', symbol: '◇', x: 0.78, y: 0.30, vx:-0.0016, vy: 0.0012, speed: 480, heading: 210, alt: 50,  label: 'ASCM (Confirmed)', tti: 58 },
      { id: 'GHOST-1',type: 'hostile', subtype: 'GHOST', symbol: '◇', x: 0.60, y: 0.25, vx: 0.0004, vy: 0.0008, speed: 120, heading: 180, alt: 100, label: 'Ghost Track?', tti: 0 },
      { id: 'GHOST-2',type: 'hostile', subtype: 'GHOST', symbol: '◇', x: 0.30, y: 0.40, vx:-0.0002, vy: 0.0005, speed: 80,  heading: 170, alt: 80,  label: 'Ghost Track?', tti: 0 },
      { id: 'GHOST-3',type: 'hostile', subtype: 'GHOST', symbol: '◇', x: 0.65, y: 0.65, vx: 0.0001, vy:-0.0003, speed: 45,  heading: 90,  alt: 60,  label: 'Ghost Track?', tti: 0 },
      { id: 'MV-N01', type: 'neutral', subtype: 'CARGO', symbol: '□', x: 0.55, y: 0.35, vx: 0.0001, vy: 0.0001, speed: 12, heading: 90,  alt: 0,   label: 'Merchant Vessel' },
    ]
  }
};

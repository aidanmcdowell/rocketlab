/* ====================================================
   ROCKET LAB INTERVIEW SIMULATOR — app.js
   Pyodide-powered, with timed interruptions & rubric
   ==================================================== */

/* ========== GLOBAL STATE ========== */
const State = {
  selectedScenario: null,
  candidateName: "Aidan",
  phase: -1,
  startTime: null,
  timerInterval: null,
  totalSeconds: 30 * 60,
  chatHistory: [],
  hintLevel: 0,
  hintUsed: false,
  testsPassed: 0,
  testsTotal: 0,
  allTestsPassed: false,
  curvballAsked: false,
  communicationScore: 0,
  candidateMessages: [],
  codeRunCount: 0,
  sessionStart: null,
  pyodideReady: false,
  pyodideInstance: null,
  interruptionsFired: {},
  firstCodeEditTime: null,
  firstChatTime: null,
  planningQuestionsAsked: false,
  codeSnapshots: [],
};

const PHASES = [
  { id: 0, name: "Introduction & Problem Reveal", startMin: 0,  endMin: 5  },
  { id: 1, name: "Clarification & Planning",       startMin: 5,  endMin: 8  },
  { id: 2, name: "Active Live Coding",             startMin: 8,  endMin: 22 },
  { id: 3, name: "Test Execution & Edge Cases",    startMin: 22, endMin: 26 },
  { id: 4, name: "Q&A & Final Evaluation",         startMin: 26, endMin: 30 },
];

/* ========== PYODIDE INITIALIZATION ========== */
async function initPyodide() {
  const statusEl = document.getElementById("pyodideStatus");
  const badgeEl = document.getElementById("pyodideBadge");
  const statusHudEl = document.getElementById("statusPyodide");
  try {
    if (statusEl) statusEl.textContent = "Downloading Python runtime…";
    State.pyodideInstance = await loadPyodide();
    State.pyodideReady = true;
    if (statusEl) statusEl.textContent = "Ready!";
    if (badgeEl) {
      badgeEl.textContent = "Pyodide ✓";
      badgeEl.classList.add("pyodide-ready");
    }
    if (statusHudEl) {
      statusHudEl.textContent = "PYODIDE ✓";
      statusHudEl.classList.add("status-ok");
    }
    console.log("[Pyodide] Ready");
  } catch (err) {
    console.warn("[Pyodide] Failed to load:", err);
    if (statusEl) statusEl.textContent = "Failed — using heuristic fallback";
    if (badgeEl) {
      badgeEl.textContent = "Fallback";
      badgeEl.classList.add("pyodide-fallback");
    }
    if (statusHudEl) {
      statusHudEl.textContent = "PYODIDE ✗";
      statusHudEl.classList.add("status-warn");
    }
  }
}

async function runCandidatePython(candidateCode, testHarness) {
  if (!State.pyodideReady || !State.pyodideInstance) {
    return { success: false, message: "Pyodide not loaded — using heuristic test runner." };
  }
  const pyodide = State.pyodideInstance;
  try {
    // Reset stdout capture
    await pyodide.runPythonAsync(`
import sys, io
_captured_output = io.StringIO()
sys.stdout = _captured_output
sys.stderr = _captured_output
`);
    // Run candidate code + test harness
    await pyodide.runPythonAsync(candidateCode + "\n\n" + testHarness);
    const output = await pyodide.runPythonAsync("_captured_output.getvalue()");
    // Reset stdout
    await pyodide.runPythonAsync("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");
    return { success: true, message: output };
  } catch (err) {
    try {
      await pyodide.runPythonAsync("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");
    } catch (_) {}
    return { success: false, message: err.toString() };
  }
}

/* ========== STARS ANIMATION ========== */
function initStars() {
  const field = document.getElementById("starField");
  if (!field) return;
  for (let i = 0; i < 120; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = "left:"+Math.random()*100+"%;top:"+Math.random()*100+"%;width:"+size+"px;height:"+size+"px;--dur:"+(Math.random()*4+2).toFixed(1)+"s;--max-op:"+(Math.random()*0.6+0.2).toFixed(2)+";animation-delay:"+(Math.random()*5).toFixed(1)+"s;";
    field.appendChild(s);
  }
}

/* ========== LANDING SCREEN ========== */
function initLanding() {
  initStars();
  const grid = document.getElementById("scenarioGrid");
  grid.innerHTML = "";
  Object.values(SCENARIOS).forEach(sc => {
    const card = document.createElement("div");
    card.className = "scenario-card";
    card.id = "card-" + sc.id;
    card.onclick = () => selectScenario(sc.id);
    card.innerHTML = "<div class='card-icon'>"+sc.icon+"</div><div class='card-label'>"+sc.label+"</div><div class='card-title'>"+sc.title+"</div><div class='card-tags'>"+sc.tags.map(t=>"<span class='card-tag'>"+t+"</span>").join("")+"</div><div class='card-difficulty diff-"+sc.difficulty.toLowerCase()+"'>"+sc.difficulty+"</div>";
    grid.appendChild(card);
  });
  if (!document.getElementById("btnStartWrap")) {
    const wrap = document.createElement("div");
    wrap.className = "btn-start-wrap";
    wrap.id = "btnStartWrap";
    wrap.innerHTML = "<button class='btn-start' id='btnStart' onclick='startInterview()' disabled>Begin Interview &rarr;</button><span class='start-note'>Select a scenario to unlock</span>";
    document.querySelector(".candidate-setup").after(wrap);
  }
}

function selectScenario(id) {
  document.querySelectorAll(".scenario-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("card-" + id).classList.add("selected");
  State.selectedScenario = id;
  const btn = document.getElementById("btnStart");
  if (btn) btn.disabled = false;
}

function selectRandom() {
  const keys = Object.keys(SCENARIOS);
  selectScenario(keys[Math.floor(Math.random() * keys.length)]);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ========== INTERVIEW START ========== */
function startInterview() {
  if (!State.selectedScenario) return;
  State.candidateName = document.getElementById("candidateName").value.trim() || "Candidate";
  State.chatHistory = [];
  State.hintLevel = 0;
  State.hintUsed = false;
  State.testsPassed = 0;
  State.testsTotal = 0;
  State.allTestsPassed = false;
  State.curvballAsked = false;
  State.communicationScore = 0;
  State.candidateMessages = [];
  State.codeRunCount = 0;
  State.phase = -1;
  State.interruptionsFired = {};
  State.firstCodeEditTime = null;
  State.firstChatTime = null;
  State.planningQuestionsAsked = false;
  State.codeSnapshots = [];

  const sc = SCENARIOS[State.selectedScenario];
  document.getElementById("hudScenarioBadge").textContent = sc.label + ": " + sc.title;
  document.getElementById("editorFilename").textContent = "solution_" + sc.id.split("_")[1] + ".py";

  // Update interviewer name
  const nameEl = document.getElementById("interviewerName");
  const roleEl = document.getElementById("interviewerRole");
  if (nameEl) nameEl.textContent = sc.interviewer || "Anh Thai";
  if (roleEl) roleEl.textContent = (sc.interviewerRole || "Ground Software Engineer") + " · Rocket Lab";

  // Set prompt panel
  const promptText = document.getElementById("promptText");
  if (promptText) {
    const promptContent = sc.openingPrompt.replace(State.candidateName, "").trim();
    promptText.textContent = promptContent;
  }

  const editor = document.getElementById("codeEditor");
  editor.value = sc.starterCode;
  updateLineNumbers();

  document.getElementById("terminalOutput").innerHTML =
    "<div class='term-line term-sys'>[ SYSTEM ] Sandbox ready. Python execution via Pyodide " + (State.pyodideReady ? "✓" : "(loading…)") + "</div>";
  document.getElementById("chatMessages").innerHTML = "";

  showScreen("screen-interview");
  State.sessionStart = new Date();
  State.startTime = Date.now();
  startTimer();
  transitionPhase(0);

  // Load Pyodide in background if not ready
  if (!State.pyodideReady) {
    initPyodide();
  }
}

/* ========== TIMER ========== */
function startTimer() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  State.timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  const elapsed = Math.floor((Date.now() - State.startTime) / 1000);
  const remaining = Math.max(0, State.totalSeconds - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = document.getElementById("timerDisplay");
  display.textContent = String(mins).padStart(2,"0") + ":" + String(secs).padStart(2,"0");
  display.classList.remove("warn","critical");
  if (remaining <= 120) display.classList.add("critical");
  else if (remaining <= 300) display.classList.add("warn");

  const progressPct = (elapsed / State.totalSeconds) * 100;
  document.getElementById("phaseBar").style.width = Math.min(progressPct,100) + "%";

  // Phases are now checkpoint-driven (see checkPhaseCheckpoints), not time-driven
  const elapsedMin = elapsed / 60;

  // Check for timed interruptions
  checkInterruptions(elapsedMin);

  if (remaining === 0) { clearInterval(State.timerInterval); endInterview(); }
}

/* ========== CHECKPOINT-DRIVEN PHASES ========== */
// Phase 0: Interview starts (auto)
// Phase 1: User begins editing code (first keystroke in editor)
// Phase 2: User sends a chat message OR writes 3+ new lines
// Phase 3: User clicks Run Tests
// Phase 4: All tests pass
function checkPhaseCheckpoint(trigger) {
  if (State.phase === 0 && (trigger === 'edit' || trigger === 'chat')) {
    transitionPhase(1);
  } else if (State.phase === 1 && (trigger === 'chat' || trigger === 'substantial-edit')) {
    transitionPhase(2);
  } else if (State.phase === 2 && trigger === 'run-tests') {
    transitionPhase(3);
  } else if (State.phase === 3 && trigger === 'all-passed') {
    transitionPhase(4);
  }
}

/* ========== TIMED INTERRUPTIONS ========== */
function checkInterruptions(elapsedMin) {
  const sc = SCENARIOS[State.selectedScenario];
  if (!sc || !sc.interruptions) return;

  sc.interruptions.forEach(function(intr, idx) {
    const key = "intr_" + idx;
    if (State.interruptionsFired[key]) return;
    if (elapsedMin >= intr.triggerMinute) {
      State.interruptionsFired[key] = true;
      // Inject interruption after small delay for realism
      setTimeout(function() {
        addSystemMessage("⚡ INTERVIEWER INTERRUPTION — " + (intr.type === "edge-case" ? "Edge Case Check" : "Performance Question"));
        sendInterviewerMessage(intr.message, "msg-interruption");
      }, 500);
    }
  });
}

function sendInterviewerMessage(text, extraClass) {
  const sc = SCENARIOS[State.selectedScenario];
  const msgs = document.getElementById("chatMessages");
  const typingEl = document.createElement("div");
  typingEl.className = "msg msg-marcus";
  const initial = (sc && sc.interviewer) ? sc.interviewer[0].toUpperCase() : "A";
  typingEl.innerHTML = "<div class='msg-avatar msg-avatar-marcus'>" + initial + "</div><div class='typing-indicator'><div class='typing-dot'></div><div class='typing-dot'></div><div class='typing-dot'></div></div>";
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;
  const delay = Math.min(Math.max(text.length * 15, 600), 2200);
  setTimeout(function() {
    typingEl.remove();
    appendMessage("marcus", text, extraClass || "");
  }, delay);
}

/* ========== PHASE TRANSITIONS ========== */
function transitionPhase(phaseId) {
  const prev = State.phase;
  State.phase = phaseId;
  const ph = PHASES[phaseId];
  document.getElementById("phaseLabel").textContent = "Phase " + phaseId + ": " + ph.name;
  document.getElementById("statusPhase").textContent = "PHASE " + phaseId + "/4";
  document.getElementById("btnRun").disabled = false;

  const sc = SCENARIOS[State.selectedScenario];
  const interviewer = (sc && sc.interviewer) || "Anh";

  if (prev >= 0) showPhaseTransition(ph);
  else {
    // Replace placeholder name in opening prompt
    let prompt = sc.openingPrompt;
    if (prompt.includes('${""}')) {
      prompt = prompt.replace('${""}', State.candidateName);
    }
    setTimeout(() => sendMarcusMessage(prompt), 800);
  }

  if (phaseId === 1 && prev === 0)
    setTimeout(() => sendMarcusMessage("Time to plan. Before writing code — walk me through your approach. What will your function signature look like? What data structure will you use for the output? Any edge cases you're already thinking about?"), 1200);

  if (phaseId === 2 && prev === 1)
    setTimeout(() => sendMarcusMessage("Good. Let's see it built. Start coding — talk through what you're doing as you go. Run the test harness with the Run Tests button once you have something runnable."), 1200);

  if (phaseId === 3 && prev === 2) {
    setTimeout(() => {
      sendMarcusMessage("Phase 3 — time to stress-test. Run the automated suite if you haven't already. Then I've got a curveball for you based on a real scenario we hit in production.");
      setTimeout(() => {
        addSystemMessage("CURVEBALL INJECTED — Edge case scenario incoming");
        sendMarcusCurveball();
      }, 3000);
    }, 1000);
  }

  if (phaseId === 4 && prev === 3) {
    setTimeout(() => sendMarcusMessage("Alright — final stretch. Do you have any questions about the role, our ground software stack, or how we handle mission-critical systems at Rocket Lab? I'll share my full feedback shortly."), 1200);
    const remaining = Math.max(0, State.totalSeconds - Math.floor((Date.now()-State.startTime)/1000));
    setTimeout(() => endInterview(), remaining * 1000 - 500);
  }
}

function showPhaseTransition(ph) {
  const overlay = document.createElement("div");
  overlay.className = "phase-transition";
  overlay.innerHTML = "<div class='phase-transition-content'><div class='phase-trans-label'>Phase " + ph.id + " of 4</div><div class='phase-trans-title'>" + ph.name + "</div><div class='phase-trans-sub'>" + ph.startMin + ":00 — " + ph.endMin + ":00</div></div>";
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
  setTimeout(() => { overlay.classList.remove("show"); setTimeout(() => overlay.remove(), 300); }, 2000);
}

/* ========== CHAT SYSTEM ========== */
function sendMarcusMessage(text, isCurveball) {
  const sc = SCENARIOS[State.selectedScenario];
  const msgs = document.getElementById("chatMessages");
  const typingEl = document.createElement("div");
  typingEl.className = "msg msg-marcus";
  typingEl.id = "typing-indicator";
  const initial = (sc && sc.interviewer) ? sc.interviewer[0].toUpperCase() : "A";
  typingEl.innerHTML = "<div class='msg-avatar msg-avatar-marcus'>" + initial + "</div><div class='typing-indicator'><div class='typing-dot'></div><div class='typing-dot'></div><div class='typing-dot'></div></div>";
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;
  const delay = Math.min(Math.max(text.length * 18, 800), 2800);
  setTimeout(() => {
    typingEl.remove();
    appendMessage("marcus", text, isCurveball ? "msg-curveball" : "");
  }, delay);
}

function appendMessage(sender, text, extraClass) {
  extraClass = extraClass || "";
  const sc = SCENARIOS[State.selectedScenario];
  const msgs = document.getElementById("chatMessages");
  const isSystem = sender === "system";
  const div = document.createElement("div");
  if (isSystem) {
    div.className = "msg msg-system";
    div.innerHTML = "<div class='msg-bubble'>" + text + "</div>";
  } else {
    const cls = sender === "marcus" ? "msg-marcus" : "msg-candidate";
    const avatarCls = sender === "marcus" ? "msg-avatar-marcus" : "msg-avatar-candidate";
    const initial = sender === "marcus"
      ? ((sc && sc.interviewer) ? sc.interviewer[0].toUpperCase() : "A")
      : State.candidateName[0].toUpperCase();
    div.className = "msg " + cls + " " + extraClass;
    div.innerHTML = "<div class='msg-avatar " + avatarCls + "'>" + initial + "</div><div class='msg-bubble'>" + escapeHtml(text) + "</div>";
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  State.chatHistory.push({ sender: sender, text: text });
}

function addSystemMessage(text) { appendMessage("system", text); }

function sendMarcusCurveball() {
  State.curvballAsked = true;
  const sc = SCENARIOS[State.selectedScenario];
  const msgs = document.getElementById("chatMessages");
  const typingEl = document.createElement("div");
  typingEl.className = "msg msg-marcus";
  const initial = (sc && sc.interviewer) ? sc.interviewer[0].toUpperCase() : "A";
  typingEl.innerHTML = "<div class='msg-avatar msg-avatar-marcus'>" + initial + "</div><div class='typing-indicator'><div class='typing-dot'></div><div class='typing-dot'></div><div class='typing-dot'></div></div>";
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => { typingEl.remove(); appendMessage("marcus", sc.curveball, "msg-curveball"); }, 2200);
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  // Track first chat time for rubric
  if (!State.firstChatTime) {
    State.firstChatTime = Date.now();
    const elapsedSec = (State.firstChatTime - State.startTime) / 1000;
    if (elapsedSec <= 180) State.planningQuestionsAsked = true;
  }
  checkPhaseCheckpoint('chat');

  appendMessage("candidate", text);
  State.candidateMessages.push(text);
  input.value = "";
  const lower = text.toLowerCase();
  const clarifyWords = ["what","how","should","if","does","can","edge","format","return","assume","handle","expect","null","none","empty"];
  if (clarifyWords.some(w => lower.includes(w))) State.communicationScore = Math.min(State.communicationScore + 12, 100);
  if (lower.length > 60) State.communicationScore = Math.min(State.communicationScore + 5, 100);
  setTimeout(() => getMarcusResponse(text), 400);
}

function getMarcusResponse(userText) {
  const phase = State.phase;
  const lower = userText.toLowerCase();
  const sc = SCENARIOS[State.selectedScenario];
  let response = "";

  if (phase === 0 || phase === 1) {
    if (lower.includes("none") || lower.includes("null") || lower.includes("corrupt") || lower.includes("invalid"))
      response = "Good catch on the None/corrupt case — that's exactly the defensive thinking I'm looking for. Yes, filter those out silently. What about a packet where a key is missing entirely?";
    else if (lower.includes("output") || lower.includes("format") || lower.includes("return"))
      response = "The output format is up to you — but think about what makes it easy for the caller. If I call result['battery']['max'], what type should result be? Make sure you can justify your data structure choice.";
    else if (lower.includes("threshold") || lower.includes("alert") || lower.includes("flag"))
      response = "Good question. The threshold for flagging is specified in the prompt. What happens if a subsystem has only corrupt readings — does it get flagged?";
    else if (lower.includes("generator") || lower.includes("stream") || lower.includes("memory"))
      response = "Interesting — we'll get to scale in Phase 3. For now assume batch list input. But keep that generator thought in mind.";
    else if (lower.includes("sort") || lower.includes("order") || lower.includes("sorted"))
      response = "Good instinct. What does sorting buy you here? Think about the algorithmic consequence.";
    else {
      const opts = [
        "Makes sense. What's your next step? Walk me through how you'll start the implementation.",
        "Good thinking. What edge case are you most worried about?",
        "Before coding — can you name the two most important defensive checks this function needs?",
        "How do you plan to structure the output? What keys will each entry have?",
        "Good. The key thing is robustness — you'll see corner cases in the test harness. Go ahead and code."
      ];
      response = opts[Math.floor(Math.random() * opts.length)];
    }
  } else if (phase === 2) {
    if (lower.includes("error") || lower.includes("crash") || lower.includes("bug") || lower.includes("not working"))
      response = "Don't panic. Read the error message carefully — what does the traceback say?";
    else if (lower.includes("done") || lower.includes("finished") || lower.includes("ready"))
      response = "Hit Run Tests and let's see what the harness says. Get it passing first before optimizing.";
    else if (lower.includes("hint") || lower.includes("stuck") || lower.includes("help"))
      response = "Try the Hint button — I'll guide you without giving away the answer.";
    else {
      const opts = [
        "Keep going. Narrate what you're doing so I can follow along.",
        "What's the current state of your implementation? What does each step do?",
        "Remember to handle the case where a key might not exist at all.",
        "What does your function return if I pass in an empty list?",
        "Think about whether you need to store all values, or just maintain a running aggregate."
      ];
      response = opts[Math.floor(Math.random() * opts.length)];
    }
  } else if (phase === 3) {
    if (State.allTestsPassed)
      response = "All tests green. Now think about the curveball I asked. What actually needs to change in your code? Walk me through the modification.";
    else if (lower.includes("fail") || lower.includes("test"))
      response = "Look at which test is failing. The assertion message tells you exactly what was expected vs what you returned. Fix that specific case first.";
    else {
      const opts = [
        "What happens if the input is empty? Does it crash or return something sensible?",
        "Run the tests. Let's see actual output before we theorize.",
        "The curveball I described — what's the minimum change to handle it without rewriting?"
      ];
      response = opts[Math.floor(Math.random() * opts.length)];
    }
  } else if (phase === 4) {
    const opts = [
      "At Rocket Lab, our ground software stack runs on Linux-hardened systems with real-time constraints. Python for data processing pipelines, C++ for latency-critical telemetry ingest. Reliability over elegance.",
      "We're a small but very senior team. Everyone owns their piece end-to-end — from protocol parsers to operator UI. Expect to be on-call during mission-critical periods.",
      "The biggest challenge is building software that has to work perfectly the first time, for a vehicle that can't be rebooted mid-flight. That context shapes every design decision.",
      "We value engineers who think about failure modes before they code the happy path. That's what sets ground software apart from typical software engineering."
    ];
    response = opts[Math.floor(Math.random() * opts.length)];
  }
  if (response) sendMarcusMessage(response);
}

function requestHint() {
  const sc = SCENARIOS[State.selectedScenario];
  if (State.hintLevel >= sc.hints.length) {
    sendMarcusMessage("I've given you all the hints I can. You have everything you need — trust your instincts and keep going.");
    return;
  }
  State.hintUsed = true;
  const hint = sc.hints[State.hintLevel++];
  sendMarcusMessage("[Hint " + State.hintLevel + "/" + sc.hints.length + "] " + hint);
}

/* ========== PROMPT PANEL ========== */
function togglePrompt() {
  const body = document.getElementById("promptBody");
  const btn = document.querySelector(".btn-collapse");
  if (body.classList.contains("collapsed")) {
    body.classList.remove("collapsed");
    btn.textContent = "▼";
  } else {
    body.classList.add("collapsed");
    btn.textContent = "▶";
  }
}

/* ========== UNICODE SANITIZER ========== */
// Nuclear approach: instead of whitelisting specific Unicode chars, we catch ALL non-ASCII
// and replace known operator substitutions, then strip anything else that doesn't belong.
// This covers every possible IME/OS substitution at once.
var UNICODE_TO_ASCII = {};
// Operators
UNICODE_TO_ASCII['\u2264'] = '<=';   // ≤
UNICODE_TO_ASCII['\u2265'] = '>=';   // ≥
UNICODE_TO_ASCII['\u2260'] = '!=';   // ≠
UNICODE_TO_ASCII['\u2192'] = '->';   // →
UNICODE_TO_ASCII['\u2190'] = '<-';   // ←
UNICODE_TO_ASCII['\u21D0'] = '<=';   // ⇐
UNICODE_TO_ASCII['\u21D2'] = '=>';   // ⇒
UNICODE_TO_ASCII['\u27F8'] = '<=';   // ⟸
UNICODE_TO_ASCII['\u27F9'] = '=>';   // ⟹
UNICODE_TO_ASCII['\u2A7D'] = '<=';   // ⩽
UNICODE_TO_ASCII['\u2A7E'] = '>=';   // ⩾
UNICODE_TO_ASCII['\u2266'] = '<=';   // ≦
UNICODE_TO_ASCII['\u2267'] = '>=';   // ≧
// Math
UNICODE_TO_ASCII['\u00D7'] = '*';    // ×
UNICODE_TO_ASCII['\u00F7'] = '/';    // ÷
UNICODE_TO_ASCII['\u2212'] = '-';    // − (minus sign)
UNICODE_TO_ASCII['\u2026'] = '...';  // …
// Quotes
UNICODE_TO_ASCII['\u201C'] = '"';    // "
UNICODE_TO_ASCII['\u201D'] = '"';    // "
UNICODE_TO_ASCII['\u2018'] = "'";    // '
UNICODE_TO_ASCII['\u2019'] = "'";    // '
// Angle brackets
UNICODE_TO_ASCII['\u2039'] = '<';    // ‹
UNICODE_TO_ASCII['\u203A'] = '>';    // ›
UNICODE_TO_ASCII['\u00AB'] = '<<';   // «
UNICODE_TO_ASCII['\u00BB'] = '>>';   // »

function sanitizeUnicode(ta) {
  var val = ta.value;
  var sCursor = ta.selectionStart;
  var eCursor = ta.selectionEnd;
  var out = '';
  var changed = false;

  for (var i = 0; i < val.length; i++) {
    var ch = val[i];
    var code = ch.charCodeAt(0);

    // Allow printable ASCII (space through ~), tab, newline, carriage return
    if ((code >= 0x20 && code <= 0x7E) || code === 0x09 || code === 0x0A || code === 0x0D) {
      out += ch;
      continue;
    }

    // Known substitution — replace with ASCII equivalent
    if (UNICODE_TO_ASCII[ch]) {
      var replacement = UNICODE_TO_ASCII[ch];
      out += replacement;
      var diff = replacement.length - 1; // how many extra chars we added
      if (i < sCursor) sCursor += diff;
      if (i < eCursor) eCursor += diff;
      changed = true;
      continue;
    }

    // Unknown non-ASCII — strip it entirely
    if (i < sCursor) sCursor -= 1;
    if (i < eCursor) eCursor -= 1;
    changed = true;
  }

  if (changed) {
    ta.value = out;
    ta.selectionStart = Math.max(0, sCursor);
    ta.selectionEnd = Math.max(0, eCursor);
  }
  return changed;
}

/* ========== AUTOCOMPLETE ========== */
var PY_KW = [
  'def','class','return','if','elif','else','for','while','in','not','and','or',
  'is','None','True','False','import','from','as','with','try','except','finally',
  'raise','pass','break','continue','lambda','yield','global','nonlocal','del','assert',
  'isinstance','len','range','enumerate','sorted','reversed','sum','max','min',
  'print','list','dict','set','tuple','str','int','float','bool','type','super','self',
  'abs','round','zip','map','filter','any','all','hash',
  'append','extend','pop','popleft','get','items','keys','values','update',
  'split','join','strip','replace','format','lower','upper','find','count',
  'subsystems','packets','packet','voltage','status','intervals','merged',
  'deque','collections','prev_start','prev_end','current_start','current_end',
  'process_bus_telemetry','merge_passes','CommandLimiter','validate_sequence',
  'allow_command','VALID_TRANSITIONS','timestamps','window_sec','max_cmds',
];

var AC = { visible: false, items: [], sel: 0, token: '', tokenStart: 0, justAccepted: false };
var acEl = null;

function initAC() {
  acEl = document.createElement('div');
  acEl.id = 'acDropdown';
  acEl.style.cssText = 'position:fixed;z-index:99999;display:none;background:#111d2e;' +
    'border:1px solid rgba(0,212,255,0.4);border-radius:6px;' +
    'box-shadow:0 8px 28px rgba(0,0,0,0.7);min-width:190px;max-width:300px;' +
    'max-height:200px;overflow-y:auto;font-family:"JetBrains Mono",monospace;' +
    'font-size:12.5px;padding:4px 0;';
  document.body.appendChild(acEl);
}

function acCandidates(token) {
  if (!token || token.length < 2) return [];
  var editor = document.getElementById('codeEditor');
  var extra = editor ? (editor.value.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []) : [];
  var all = PY_KW.slice();
  extra.forEach(function(w) {
    // Skip Title-Case words from docstrings (e.g. Returns, Args, List, Dict)
    // unless they're already in the keyword list
    if (PY_KW.indexOf(w) !== -1) return; // already in list
    if (/^[A-Z]/.test(w)) return;        // skip Title-Case
    if (all.indexOf(w) === -1) all.push(w);
  });
  var lo = token.toLowerCase();
  return all
    .filter(function(w) { return w.toLowerCase().indexOf(lo) === 0 && w !== token; })
    .sort(function(a, b) {
      var ak = PY_KW.indexOf(a) !== -1, bk = PY_KW.indexOf(b) !== -1;
      return ak !== bk ? (ak ? -1 : 1) : a.length - b.length;
    })
    .slice(0, 10);
}

function showAC(editor) {
  // Suppress the re-trigger that fires immediately after accepting a completion
  if (AC.justAccepted) { AC.justAccepted = false; hideAC(); return; }

  var pos = editor.selectionStart;
  var before = editor.value.substring(0, pos);
  var m = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
  if (!m) { hideAC(); return; }

  var token = m[0];
  var tokenStart = pos - token.length;

  // Don't trigger after a dot — that's a method call, not a name lookup
  if (tokenStart > 0 && editor.value[tokenStart - 1] === '.') { hideAC(); return; }

  // Need at least 2 chars and token must not already be an exact keyword
  if (token.length < 2) { hideAC(); return; }

  var items = acCandidates(token);
  if (!items.length) { hideAC(); return; }
  AC.visible = true; AC.items = items; AC.sel = 0;
  AC.token = token; AC.tokenStart = tokenStart;
  renderAC(editor);
}

function renderAC(editor) {
  if (!acEl) return;
  var rect = editor.getBoundingClientRect();
  var cs = window.getComputedStyle(editor);
  var lh = parseFloat(cs.lineHeight) || 20;
  var fs = parseFloat(cs.fontSize) || 13.6;
  var cw = fs * 0.601;
  var before = editor.value.substring(0, editor.selectionStart);
  var lines = before.split('\n');
  var lineIdx = lines.length - 1;
  var col = lines[lineIdx].length - AC.token.length;
  var x = rect.left + parseFloat(cs.paddingLeft) + col * cw;
  var y = rect.top + parseFloat(cs.paddingTop) + (lineIdx + 1) * lh - editor.scrollTop;
  acEl.innerHTML = '';
  AC.items.forEach(function(item, i) {
    var el = document.createElement('div');
    var isSel = i === AC.sel;
    el.textContent = item;
    el.style.cssText = 'padding:5px 14px;cursor:pointer;white-space:nowrap;' +
      'color:' + (isSel ? '#060c1a' : '#c8d8f0') + ';' +
      'background:' + (isSel ? '#00d4ff' : 'transparent') + ';' +
      'border-left:3px solid ' + (isSel ? '#00d4ff' : 'transparent') + ';';
    el.onmousedown = function(e) { e.preventDefault(); AC.sel = i; acceptAC(editor); };
    el.onmouseover = function() { AC.sel = i; renderAC(editor); };
    acEl.appendChild(el);
  });
  var left = Math.min(x, window.innerWidth - 210);
  var dropH = Math.min(AC.items.length * 28, 200);
  var top = (y + dropH > window.innerHeight) ? (y - dropH - lh) : y;
  acEl.style.left = left + 'px';
  acEl.style.top = top + 'px';
  acEl.style.display = 'block';
}

function acceptAC(editor) {
  if (!AC.visible || !AC.items.length) return;
  var word = AC.items[AC.sel];
  var before = editor.value.substring(0, AC.tokenStart);
  var after  = editor.value.substring(editor.selectionStart);
  AC.justAccepted = true;  // suppress the input event re-trigger
  editor.value = before + word + after;
  editor.selectionStart = editor.selectionEnd = AC.tokenStart + word.length;
  updateLineNumbers();
  hideAC();
}

function hideAC() {
  AC.visible = false;
  if (acEl) acEl.style.display = 'none';
}

/* ========== EDITOR ========== */
document.addEventListener('DOMContentLoaded', function() {
  initAC();
  var editor = document.getElementById('codeEditor');
  if (editor) {
    // LAYER 1: beforeinput — cancel Unicode substitutions before they hit the DOM
    editor.addEventListener('beforeinput', function(e) {
      var data = e.data;
      if (!data || !e.cancelable) return;
      var hasNonAscii = false;
      for (var i = 0; i < data.length; i++) {
        if (data.charCodeAt(i) > 0x7E) { hasNonAscii = true; break; }
      }
      if (!hasNonAscii) return;
      e.preventDefault();
      var fixed = '';
      for (var j = 0; j < data.length; j++) {
        var ch = data[j];
        if (UNICODE_TO_ASCII[ch]) fixed += UNICODE_TO_ASCII[ch];
        else if (ch.charCodeAt(0) <= 0x7E) fixed += ch;
        // else: strip unknown non-ASCII
      }
      var s = editor.selectionStart, en = editor.selectionEnd;
      editor.value = editor.value.substring(0, s) + fixed + editor.value.substring(en);
      editor.selectionStart = editor.selectionEnd = s + fixed.length;
      updateLineNumbers();
    });

    // LAYER 2: input event — sanitize after the fact (catches IME that bypasses beforeinput)
    editor.addEventListener('input', function() {
      sanitizeUnicode(editor);
      updateLineNumbers();
      if (!State.firstCodeEditTime && State.startTime) {
        State.firstCodeEditTime = Date.now();
        checkPhaseCheckpoint('edit');
      }
      // Check if user has written 3+ lines beyond starter code
      var sc = SCENARIOS[State.selectedScenario];
      if (sc && editor.value.split('\n').length > sc.starterCode.split('\n').length + 3) {
        checkPhaseCheckpoint('substantial-edit');
      }
      showAC(editor);
    });

    // LAYER 2b: compositionend — fires after IME commits a character
    editor.addEventListener('compositionend', function() {
      sanitizeUnicode(editor);
      updateLineNumbers();
    });

    // LAYER 3: periodic sweep — nuclear fallback for anything that slips past both events
    setInterval(function() {
      if (document.activeElement === editor) {
        if (sanitizeUnicode(editor)) updateLineNumbers();
      }
    }, 300);

    editor.addEventListener('keydown', function(e) {
      // Tab: accept autocomplete OR insert 4 spaces
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        if (AC.visible && AC.items.length) { acceptAC(editor); }
        else {
          var s = editor.selectionStart, en = editor.selectionEnd;
          editor.value = editor.value.substring(0, s) + '    ' + editor.value.substring(en);
          editor.selectionStart = editor.selectionEnd = s + 4;
          updateLineNumbers();
        }
        return;
      }
      // Shift+Tab: remove 4 spaces (back-tab)
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        var s = editor.selectionStart;
        var before = editor.value.substring(0, s);
        var lineStart = before.lastIndexOf('\n') + 1;
        var linePrefix = editor.value.substring(lineStart, s);
        var spacesToRemove = 0;
        for (var si = 0; si < 4 && si < linePrefix.length; si++) {
          if (linePrefix[si] === ' ') spacesToRemove++;
          else break;
        }
        if (spacesToRemove > 0) {
          editor.value = editor.value.substring(0, lineStart) + editor.value.substring(lineStart + spacesToRemove);
          editor.selectionStart = editor.selectionEnd = s - spacesToRemove;
          updateLineNumbers();
        }
        return;
      }
      // Backspace: if previous 4 chars are all spaces, delete all 4 (back-tab on backspace)
      if (e.key === 'Backspace') {
        var s = editor.selectionStart;
        if (s >= 4 && editor.selectionStart === editor.selectionEnd) {
          var prev4 = editor.value.substring(s - 4, s);
          if (prev4 === '    ') {
            e.preventDefault();
            editor.value = editor.value.substring(0, s - 4) + editor.value.substring(s);
            editor.selectionStart = editor.selectionEnd = s - 4;
            updateLineNumbers();
            return;
          }
        }
      }
      // Enter: auto-indent (match current line indent, +4 after colon)
      if (e.key === 'Enter' && !AC.visible) {
        e.preventDefault();
        var s = editor.selectionStart;
        var before = editor.value.substring(0, s);
        var lineStart = before.lastIndexOf('\n') + 1;
        var currentLine = before.substring(lineStart);
        var indent = currentLine.match(/^(\s*)/)[1];  // current line's leading whitespace
        var trimmed = currentLine.trimEnd();
        // Extra indent after lines ending with : (def, if, for, while, else, elif, with, try, except, class)
        if (trimmed.endsWith(':')) indent += '    ';
        editor.value = before + '\n' + indent + editor.value.substring(s);
        editor.selectionStart = editor.selectionEnd = s + 1 + indent.length;
        updateLineNumbers();
        return;
      }
      if (AC.visible) {
        if (e.key === 'ArrowDown')  { e.preventDefault(); AC.sel=(AC.sel+1)%AC.items.length; renderAC(editor); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); AC.sel=(AC.sel-1+AC.items.length)%AC.items.length; renderAC(editor); return; }
        if (e.key === 'Enter')      { e.preventDefault(); acceptAC(editor); return; }
        if (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') { hideAC(); return; }
        if (e.key === ' ' || e.key === '(' || e.key === ')' || e.key === ':' || e.key === '=') { hideAC(); }
      }
    });
    editor.addEventListener('scroll', syncScroll);
    editor.addEventListener('blur',   function() { setTimeout(hideAC, 150); });
    editor.addEventListener('click',  function() { showAC(editor); });
  }
  initLanding();
  document.getElementById('chatInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  if (typeof loadPyodide !== 'undefined') initPyodide();
});

function updateLineNumbers() {
  const editor = document.getElementById("codeEditor");
  const lineNums = document.getElementById("lineNumbers");
  const lines = (editor.value.match(/\n/g) || []).length + 1;
  lineNums.textContent = Array.from({length: lines}, function(_, i) { return i + 1; }).join("\n");
}

function syncScroll() {
  document.getElementById("lineNumbers").scrollTop = document.getElementById("codeEditor").scrollTop;
}

function handleTabKey(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 4;
    updateLineNumbers();
  }
}

function copyCode() {
  navigator.clipboard.writeText(document.getElementById("codeEditor").value).then(function() {
    const btn = document.querySelector(".btn-copy");
    btn.textContent = "Copied!";
    setTimeout(function() { btn.textContent = "⧉ Copy"; }, 2000);
  });
}

function clearTerminal() {
  document.getElementById("terminalOutput").innerHTML = "<div class='term-line term-sys'>[ CLEAR ] Terminal cleared.</div>";
}

/* ========== TEST EXECUTION ========== */
async function runTests() {
  checkPhaseCheckpoint('run-tests');
  const code = document.getElementById("codeEditor").value.trim();
  State.codeRunCount++;
  const terminal = document.getElementById("terminalOutput");
  terminal.innerHTML = "";
  addTerminalLine("[ RUN ] Executing candidate solution against test harness...", "term-sys");

  const sc = SCENARIOS[State.selectedScenario];

  if (!code || code === sc.starterCode) {
    setTimeout(function() { simulateFailedRun("NotImplementedError: Function not implemented — stub returned None"); }, 400);
    return;
  }

  // Save snapshot for rubric analysis
  State.codeSnapshots.push({ time: Date.now(), code: code });

  if (State.pyodideReady) {
    addTerminalLine("[ SYS ] Engine: Pyodide (CPython 3.11 in WebAssembly)", "term-sys");
    addTerminalLine("", "term-sys");

    const result = await runCandidatePython(code, sc.testHarness);

    if (result.success) {
      const lines = result.message.split("\n").filter(l => l.trim());
      let passed = 0;
      let total = 0;
      lines.forEach(function(line) {
        if (line.startsWith("[PASS]")) {
          addTerminalLine(line, "term-pass");
          passed++;
          total++;
        } else if (line.startsWith("[FAIL]")) {
          addTerminalLine(line, "term-fail");
          total++;
        } else if (line.startsWith("SCORE:")) {
          addTerminalLine("", "term-sys");
          addTerminalLine("=".repeat(42), "term-sys");
          addTerminalLine(line, "term-score");
        } else if (line === "ALL_TESTS_PASSED") {
          addTerminalLine(line, "term-pass");
        } else {
          addTerminalLine(line, "term-info");
        }
      });
      State.testsPassed = passed;
      State.testsTotal = total || passed;
      State.allTestsPassed = result.message.includes("ALL_TESTS_PASSED");

      if (State.allTestsPassed) {
        checkPhaseCheckpoint('all-passed');
        setTimeout(function() {
          sendMarcusMessage("Tests all green! Your solution handles the baseline cases. " + (State.hintUsed ? "You needed some hints — that's fine. " : "") + "Now the curveball: how would you change this for the scenario I described?");
        }, 1000);
      } else {
        var failCount = total - passed;
        setTimeout(function() {
          sendMarcusMessage(failCount + " test(s) failing. Read each failure carefully. What specific case is the first failing test checking? Fix that one before moving on.");
        }, 1000);
      }
    } else {
      // Python error
      addTerminalLine("", "term-sys");
      const errorLines = result.message.split("\n");
      errorLines.forEach(function(line) {
        if (line.includes("Error") || line.includes("Traceback")) {
          addTerminalLine(line, "term-error");
        } else if (line.includes("assert")) {
          addTerminalLine(line, "term-fail");
        } else {
          addTerminalLine(line, "term-error");
        }
      });
      addTerminalLine("", "term-sys");
      addTerminalLine("SCORE: 0/? tests passed (runtime error)", "term-score");
      setTimeout(function() {
        sendMarcusMessage("Runtime error. Read the traceback carefully — what line is it pointing to? The error type tells you exactly what went wrong.");
      }, 1000);
    }
  } else {
    // Fallback: heuristic test runner (same as original)
    addTerminalLine("[ SYS ] Engine: Heuristic (Pyodide unavailable)", "term-sys");
    addTerminalLine("", "term-sys");
    setTimeout(function() { simulateTestRun(code); }, 500);
  }
}

function simulateFailedRun(msg) {
  addTerminalLine("Traceback (most recent call last):", "term-error");
  addTerminalLine("  File '<sandbox>', line 1, in <module>", "term-error");
  addTerminalLine("" + msg, "term-fail");
  addTerminalLine("", "term-sys");
  addTerminalLine("SCORE: 0/" + (State.testsTotal || 4) + " tests passed", "term-score");
  sendMarcusMessage("Looks like the function isn't implemented yet — it's returning None. Start with the function body. Even a rough loop that prints each packet is a better starting point than a pass statement.");
}

function simulateTestRun(code) {
  const sc = SCENARIOS[State.selectedScenario];
  const hasLoop = /for\s+\w/.test(code);
  const hasIf = /if\s+/.test(code);
  const hasReturn = /return/.test(code);
  const hasDict = /\{/.test(code) || /dict\(/.test(code);
  const hasGet = /\.get\(/.test(code);
  const hasNoneCheck = /None|is None|not.*value/.test(code);
  const hasTry = /try:/.test(code);
  const codeClean = code.replace(/\s|#.*$/mg, "");
  const sizeOk = codeClean.length > 100;

  var testResults = [];

  if (sc.id === "scenario_a") {
    testResults = [
      { name: "Test 1 (Basic filtering & metrics)", pass: hasLoop && hasReturn && sizeOk && hasDict },
      { name: "Test 2 (All-corrupt packets)", pass: hasNoneCheck || hasGet },
      { name: "Test 3 (Missing subsystem key)", pass: hasGet || hasTry },
      { name: "Test 4 (Empty input)", pass: hasReturn && (code.includes("{}") || hasLoop) },
    ];
  } else if (sc.id === "scenario_b") {
    const hasSort = /sort/.test(code);
    const hasMax = /max\(/.test(code);
    testResults = [
      { name: "Test 1 (Basic overlapping merge)", pass: hasSort && hasReturn && sizeOk },
      { name: "Test 2 (Empty input)", pass: hasReturn && /\[\]/.test(code) },
      { name: "Test 3 (Adjacent non-overlapping)", pass: hasSort && hasIf },
      { name: "Test 4 (Unsorted with multiple merges)", pass: hasSort && hasMax },
      { name: "Test 5 (Single interval)", pass: hasReturn },
    ];
  } else if (sc.id === "scenario_c") {
    const hasDeque = /deque/.test(code);
    const hasPopleft = /popleft/.test(code);
    testResults = [
      { name: "Test 1 (Basic rate limiting)", pass: hasReturn && sizeOk },
      { name: "Test 2 (Window expiry)", pass: hasDeque || hasPopleft || /while/.test(code) },
      { name: "Test 3 (Burst then wait)", pass: hasDeque && hasReturn },
      { name: "Test 4 (Single command window)", pass: hasReturn && hasIf },
    ];
  } else if (sc.id === "scenario_d") {
    const hasTransitions = /VALID_TRANSITIONS|transitions|allowed/.test(code);
    testResults = [
      { name: "Test 1 (Valid full sequence)", pass: hasTransitions && hasReturn && sizeOk },
      { name: "Test 2 (Invalid transition detected)", pass: hasTransitions && hasIf },
      { name: "Test 3 (Invalid starting state)", pass: hasIf && /PRE_LAUNCH/.test(code) },
      { name: "Test 4 (Empty event list)", pass: hasReturn && hasIf },
      { name: "Test 5 (Unknown state name)", pass: hasGet || hasTransitions },
    ];
  }

  testResults.forEach(function(r, i) {
    setTimeout(function() {
      const icon = r.pass ? "PASS" : "FAIL";
      const cls = r.pass ? "term-pass" : "term-fail";
      addTerminalLine("[" + icon + "] " + r.name, cls);
      if (i === testResults.length - 1) finishTestRun(testResults);
    }, i * 200 + 200);
  });
}

function finishTestRun(testResults) {
  const passed = testResults.filter(function(r) { return r.pass; }).length;
  State.testsPassed = passed;
  State.testsTotal = testResults.length;
  State.allTestsPassed = passed === testResults.length;
  addTerminalLine("", "term-sys");
  addTerminalLine("=".repeat(42), "term-sys");
  addTerminalLine("SCORE: " + passed + "/" + testResults.length + " tests passed", passed === testResults.length ? "term-pass term-score" : "term-score");
  if (passed === testResults.length) {
    addTerminalLine("ALL_TESTS_PASSED", "term-pass");
    setTimeout(function() {
      sendMarcusMessage("Tests all green. Your solution handles the baseline cases. " + (State.hintUsed ? "You needed some hints — that's fine. " : "") + "Now the curveball: how would you change this for the scenario I described?");
    }, 1000);
  } else {
    var failCount = testResults.length - passed;
    addTerminalLine(failCount + " test(s) failing.", "term-fail");
    setTimeout(function() {
      sendMarcusMessage(failCount + " test(s) failing. Read each failure carefully. What specific case is the first failing test checking? Fix that one before moving on.");
    }, 1000);
  }
}

function addTerminalLine(text, cssClass) {
  cssClass = cssClass || "term-sys";
  const terminal = document.getElementById("terminalOutput");
  const line = document.createElement("div");
  line.className = "term-line " + cssClass;
  line.textContent = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

/* ========== END INTERVIEW & SCORECARD ========== */
function endInterview() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  addSystemMessage("TIME IS UP — Generating evaluation scorecard...");
  setTimeout(buildScorecard, 1500);
}

function buildScorecard() {
  const sc = SCENARIOS[State.selectedScenario];
  const code = document.getElementById("codeEditor").value;
  const elapsed = Math.floor((Date.now() - State.startTime) / 1000 / 60);
  const startStr = State.sessionStart ? State.sessionStart.toLocaleTimeString() : "—";

  const scores = computeScores(sc, code);
  const total = Math.round(scores.defensive.score * 0.30 + scores.domain.score * 0.25 + scores.pythonic.score * 0.25 + scores.comm.score * 0.20);

  document.getElementById("scorecardMeta").textContent = State.candidateName + " • " + sc.label + ": " + sc.title + " • " + (elapsed || "30") + " min • " + startStr;

  const ring = document.getElementById("scoreRingCircle");
  const dashOffset = 314 - (total / 100) * 314;
  const ringColor = total >= 80 ? "#00ff94" : total >= 60 ? "#00d4ff" : total >= 40 ? "#ff7b2e" : "#ff3a5c";
  ring.style.stroke = ringColor;
  setTimeout(function() { ring.style.strokeDashoffset = dashOffset; }, 100);
  animateNumber(document.getElementById("scoreTotalValue"), 0, total, 1400);

  const vd = getVerdict(total);
  document.getElementById("scoreVerdict").textContent = vd.verdict;
  var tagEl = document.getElementById("scoreTag");
  tagEl.textContent = vd.tag;
  tagEl.className = "score-tag " + vd.tagClass;

  const breakdown = document.getElementById("scoreBreakdown");
  breakdown.innerHTML = "";

  // Add behavioral rubric section first
  const behavioralCard = buildBehavioralRubric(code);
  breakdown.appendChild(behavioralCard);

  const dims = [
    { name: "Defensive Ingestion",           weight: "30%", data: scores.defensive },
    { name: "Spacecraft Domain Logic",       weight: "25%", data: scores.domain    },
    { name: "Code Quality & Pythonic Style", weight: "25%", data: scores.pythonic  },
    { name: "Communication & Clarification", weight: "20%", data: scores.comm      },
  ];
  dims.forEach(function(d) {
    const barColor = d.data.score >= 75 ? "#00ff94" : d.data.score >= 50 ? "#00d4ff" : "#ff7b2e";
    const checks = d.data.checks.map(function(c) {
      return "<span class='check-item " + (c.pass ? "check-pass" : "check-fail") + "'>" + (c.pass ? "✓" : "✗") + " " + c.name + "</span>";
    }).join("");
    const div = document.createElement("div");
    div.className = "breakdown-item";
    div.innerHTML = "<div class='breakdown-header'><div class='breakdown-name'>" + d.name + "</div><div><span class='breakdown-weight'>" + d.weight + " weight</span>&nbsp;<span class='breakdown-score' style='color:" + barColor + "'>" + d.data.score + "/100</span></div></div><div class='breakdown-bar-wrap'><div class='breakdown-bar' style='background:" + barColor + "' data-target='" + d.data.score + "'></div></div><div class='breakdown-checks'>" + checks + "</div>";
    breakdown.appendChild(div);
    setTimeout(function() { div.querySelector(".breakdown-bar").style.width = d.data.score + "%"; }, 200);
  });

  document.getElementById("scorecardFeedback").innerHTML = "<div class='feedback-title'>Anh's Final Assessment</div><div class='feedback-text'>" + escapeHtml(generateFeedback(scores, total, sc)) + "</div>";
  showScreen("screen-scorecard");
}

/* ========== BEHAVIORAL RUBRIC CARD ========== */
function buildBehavioralRubric(code) {
  const div = document.createElement("div");
  div.className = "breakdown-item breakdown-behavioral";

  const checks = [];

  // 1. Did you speak during the first 3 minutes?
  const spokeEarly = State.planningQuestionsAsked;
  checks.push({
    name: "Spoke/asked questions in first 3 minutes",
    pass: spokeEarly,
    detail: spokeEarly ? "You asked clarifying questions before coding — strong signal." : "No questions asked before coding began. Always plan first."
  });

  // 2. Defensive guards in code
  const hasDefensiveGuards = /if not /.test(code) || /\.get\(/.test(code) || /is None/.test(code) || /if.*packet/.test(code) || /if.*not.*packet/.test(code);
  checks.push({
    name: "Defensive guards (if not, .get(), None checks)",
    pass: hasDefensiveGuards,
    detail: hasDefensiveGuards ? "Code includes defensive input validation." : "Missing defensive guards — always check for None, missing keys, and invalid inputs."
  });

  // 3. Empty input handling
  const handlesEmpty = /\[\]/.test(code) || /if not /.test(code) || /len\(/.test(code) || /if.*packets/.test(code);
  checks.push({
    name: "Handles empty input [] without crash",
    pass: handlesEmpty,
    detail: handlesEmpty ? "Empty input case is guarded." : "No explicit empty-input guard. Pass [] and verify no ZeroDivisionError."
  });

  // 4. Tests were run
  const ranTests = State.codeRunCount > 0;
  checks.push({
    name: "Ran test harness at least once",
    pass: ranTests,
    detail: ranTests ? "Tests executed " + State.codeRunCount + " time(s)." : "Never ran the test harness — always verify your code."
  });

  // 5. Communication volume
  const goodComm = State.candidateMessages.length >= 3;
  checks.push({
    name: "Communicated during implementation (≥3 messages)",
    pass: goodComm,
    detail: goodComm ? "Sent " + State.candidateMessages.length + " messages — good narration." : "Only " + State.candidateMessages.length + " message(s). Narrate as you code."
  });

  const passedCount = checks.filter(c => c.pass).length;
  const totalChecks = checks.length;

  const checksHtml = checks.map(function(c) {
    return "<div class='behavioral-check " + (c.pass ? "bcheck-pass" : "bcheck-fail") + "'>" +
      "<div class='bcheck-icon'>" + (c.pass ? "✓" : "✗") + "</div>" +
      "<div class='bcheck-content'>" +
        "<div class='bcheck-name'>" + c.name + "</div>" +
        "<div class='bcheck-detail'>" + c.detail + "</div>" +
      "</div>" +
    "</div>";
  }).join("");

  div.innerHTML = "<div class='breakdown-header'>" +
    "<div class='breakdown-name'>🎯 Interview Behavior Rubric</div>" +
    "<div><span class='breakdown-weight'>Behavioral</span>&nbsp;<span class='breakdown-score' style='color:" + (passedCount >= 4 ? "#00ff94" : passedCount >= 3 ? "#00d4ff" : "#ff7b2e") + "'>" + passedCount + "/" + totalChecks + "</span></div>" +
    "</div>" +
    "<div class='behavioral-checks'>" + checksHtml + "</div>";

  return div;
}

/* ========== SCORING LOGIC ========== */
function computeScores(sc, code) {
  const rubric = sc.evaluationRubric;
  const defensiveChecks = [
    { name: rubric.defensive[0], pass: /None|is None|not.*value/.test(code) },
    { name: rubric.defensive[1], pass: /\.get\(/.test(code) },
    { name: rubric.defensive[2], pass: /\[\]|len\(|not.*packet|if.*packet|if not /.test(code) },
    { name: rubric.defensive[3], pass: State.testsPassed >= 3 || code.length > 400 },
  ];
  const defScore = Math.round(defensiveChecks.filter(function(c){return c.pass;}).length / defensiveChecks.length * 100);

  const domainChecks = [
    { name: rubric.domain[0], pass: /for\s+\w+\s+in/.test(code) && /\{/.test(code) },
    { name: rubric.domain[1], pass: State.testsPassed >= 2 },
    { name: rubric.domain[2], pass: /alert|threshold|exceed|flag|merge|deque|transition|valid/i.test(code) || State.allTestsPassed },
    { name: rubric.domain[3], pass: State.curvballAsked && State.candidateMessages.some(function(m){return /generator|stream|memory|iter|yield|constant|O\(1\)|O\(n\)|buffer|complex|sort|deque/i.test(m);}) },
  ];
  const domScore = Math.round(domainChecks.filter(function(c){return c.pass;}).length / domainChecks.length * 100);

  const pythonicChecks = [
    { name: rubric.pythonic[0], pass: /\.get\(/.test(code) || /deque/.test(code) || /sorted/.test(code) },
    { name: rubric.pythonic[1], pass: /\[.*for.*in.*\]/.test(code) || /dict\(/.test(code) || /\.sort\(/.test(code) },
    { name: rubric.pythonic[2], pass: !/for.*in.*for.*in.*for/.test(code) },
    { name: rubric.pythonic[3], pass: code.split("\n").filter(function(l){return l.trim();}).length > 8 && code.length < 3000 },
  ];
  const pytScore = Math.round(pythonicChecks.filter(function(c){return c.pass;}).length / pythonicChecks.length * 100);

  const commScore = Math.min(State.communicationScore, 100);
  const commChecks = [
    { name: rubric.communication[0], pass: commScore >= 20 },
    { name: rubric.communication[1], pass: commScore >= 40 },
    { name: rubric.communication[2], pass: State.candidateMessages.length >= 3 },
    { name: rubric.communication[3], pass: State.candidateMessages.length >= 5 },
  ];
  const commFinalScore = Math.round(commChecks.filter(function(c){return c.pass;}).length / commChecks.length * 100);

  return {
    defensive: { score: defScore, checks: defensiveChecks },
    domain:    { score: domScore, checks: domainChecks    },
    pythonic:  { score: pytScore, checks: pythonicChecks  },
    comm:      { score: commFinalScore, checks: commChecks },
  };
}

function getVerdict(score) {
  if (score >= 85) return { verdict: "Strong Hire", tag: "Exceeds Expectations", tagClass: "tag-strong" };
  if (score >= 70) return { verdict: "Hire",        tag: "Meets Expectations",   tagClass: "tag-good"   };
  if (score >= 50) return { verdict: "Borderline",  tag: "Needs More Practice",  tagClass: "tag-ok"     };
  return              { verdict: "No Hire",      tag: "Significant Gaps",     tagClass: "tag-poor"   };
}

function generateFeedback(scores, total, sc) {
  const name = State.candidateName;
  const interviewer = sc.interviewer || "Anh";
  const lines = [name + ", here's my honest assessment after 30 minutes:", ""];

  // Behavioral observations
  if (State.planningQuestionsAsked) {
    lines.push("You asked clarifying questions before coding — that's exactly what I look for. In ground software, assumptions kill missions.");
  } else {
    lines.push("You jumped straight to code without asking questions. In this role, the first 3 minutes should be spent understanding the problem. Ask about edge cases, output format, and constraints before writing a single line.");
  }

  if (scores.defensive.score >= 75)
    lines.push("\nDefensive coding was solid — you thought about None checks and missing keys before they became runtime errors. That's the mindset we need parsing live telemetry from a vehicle that can't be rebooted.");
  else
    lines.push("\nDefensive coding needs work. An unhandled KeyError or NoneType during a pass can mean losing minutes of mission data. Always guard inputs first, before the happy path.");

  if (scores.domain.score >= 75)
    lines.push("\nYou showed good domain understanding — thinking about the streaming/memory tradeoff is a real constraint we hit at scale. That's not a trivial observation.");
  else
    lines.push("\nDomain fluency is an area to develop. Understanding why we care about memory, ordering, and failure modes in telemetry processing — read up on spacecraft data protocols. CCSDS is a good start.");

  if (scores.pythonic.score >= 75)
    lines.push("\nYour Python was clean and idiomatic. Right tools for the job, no overengineering. That's valued here — we need reliability, not cleverness.");
  else
    lines.push("\nCode quality could be more idiomatic. Practice .get() for safe dict access, list comprehensions for filtering, and built-ins like max() and sum() instead of manual loops.");

  if (scores.comm.score >= 75)
    lines.push("\nCommunication was a real strength — you asked the right clarifying questions and narrated your reasoning as you coded. In mission-critical environments, that transparency is essential.");
  else
    lines.push("\nCommunication is the area with most room for growth. Before writing a single line, map out edge cases verbally. Interviewers and teammates need to follow your thinking.");

  lines.push("");
  if (total >= 70)
    lines.push("Overall: " + total + "/100. I'd recommend moving forward. Come back with the curveball implemented and we'll go deeper on system design.");
  else
    lines.push("Overall: " + total + "/100. Not there yet, but the foundation is visible. Practice all four scenarios until the defensive patterns are automatic. These instincts are drilled, not innate.");
  return lines.join("\n");
}

/* ========== UTILITIES ========== */
function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function restartApp() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  showScreen("screen-landing");
  initLanding();
}

function reviewSession() {
  const msgs = State.chatHistory;
  const sc = SCENARIOS[State.selectedScenario];
  const interviewer = (sc && sc.interviewer) || "Anh Thai";
  const win = window.open("", "_blank");
  var html = "<html><head><title>Session Review</title><style>body{background:#060c1a;color:#e8f0ff;font-family:'JetBrains Mono',monospace;padding:40px;max-width:800px;margin:0 auto;line-height:1.7}h1{color:#00d4ff;margin-bottom:4px}h2{color:#7a9abf;font-size:.9rem;margin-bottom:32px}.msg{margin-bottom:20px;padding:14px 16px;border-radius:8px;border-left:3px solid}.marcus{border-color:#006eff;background:rgba(0,110,255,0.06)}.candidate{border-color:#7b2fff;background:rgba(123,47,255,0.06)}.sender{font-size:.72rem;color:#7a9abf;margin-bottom:6px;letter-spacing:.1em;text-transform:uppercase}</style></head><body><h1>Rocket Lab Interview Session Review</h1><h2>" + State.candidateName + " — " + (sc ? sc.title : "") + "</h2>";
  msgs.forEach(function(m) {
    if (m.sender === "system") return;
    var cls = m.sender === "marcus" ? "marcus" : "candidate";
    var sender = m.sender === "marcus" ? interviewer + " (Interviewer)" : State.candidateName + " (Candidate)";
    html += "<div class='msg " + cls + "'><div class='sender'>" + sender + "</div>" + m.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>") + "</div>";
  });
  html += "</body></html>";
  win.document.write(html);
}

function escapeHtml(text) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

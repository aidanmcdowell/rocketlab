/* ====================================================
   ROCKET LAB INTERVIEW SIMULATOR — app.js
   ==================================================== */

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
};

const PHASES = [
  { id: 0, name: "Introduction & Problem Reveal", startMin: 0,  endMin: 5  },
  { id: 1, name: "Clarification & Planning",       startMin: 5,  endMin: 8  },
  { id: 2, name: "Active Live Coding",             startMin: 8,  endMin: 22 },
  { id: 3, name: "Test Execution & Edge Cases",    startMin: 22, endMin: 26 },
  { id: 4, name: "Q&A & Final Evaluation",         startMin: 26, endMin: 30 },
];

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

  const sc = SCENARIOS[State.selectedScenario];
  document.getElementById("hudScenarioBadge").textContent = sc.label + ": " + sc.title;
  document.getElementById("editorFilename").textContent = "solution_" + sc.id.split("_")[1] + ".py";

  const editor = document.getElementById("codeEditor");
  editor.value = sc.starterCode;
  updateLineNumbers();

  document.getElementById("terminalOutput").innerHTML =
    "<div class='term-line term-sys'>[ SYSTEM ] Sandbox ready. Code execution unlocks in Phase 2.</div>";
  document.getElementById("chatMessages").innerHTML = "";

  showScreen("screen-interview");
  State.sessionStart = new Date();
  State.startTime = Date.now();
  startTimer();
  transitionPhase(0);
}

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

  const elapsedMin = elapsed / 60;
  let newPhase = 0;
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (elapsedMin >= PHASES[i].startMin) { newPhase = i; break; }
  }
  if (newPhase !== State.phase) transitionPhase(newPhase);
  if (remaining === 0) { clearInterval(State.timerInterval); endInterview(); }
}

function transitionPhase(phaseId) {
  const prev = State.phase;
  State.phase = phaseId;
  const ph = PHASES[phaseId];
  document.getElementById("phaseLabel").textContent = "Phase " + phaseId + ": " + ph.name;
  document.getElementById("statusPhase").textContent = "PHASE " + phaseId + "/4";
  document.getElementById("btnRun").disabled = phaseId < 2;

  if (prev >= 0) showPhaseTransition(ph);
  else setTimeout(() => sendMarcusMessage(SCENARIOS[State.selectedScenario].openingPrompt), 800);

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

function sendMarcusMessage(text, isCurveball) {
  const msgs = document.getElementById("chatMessages");
  const typingEl = document.createElement("div");
  typingEl.className = "msg msg-marcus";
  typingEl.id = "typing-indicator";
  typingEl.innerHTML = "<div class='msg-avatar msg-avatar-marcus'>M</div><div class='typing-indicator'><div class='typing-dot'></div><div class='typing-dot'></div><div class='typing-dot'></div></div>";
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
  const msgs = document.getElementById("chatMessages");
  const isSystem = sender === "system";
  const div = document.createElement("div");
  if (isSystem) {
    div.className = "msg msg-system";
    div.innerHTML = "<div class='msg-bubble'>" + text + "</div>";
  } else {
    const cls = sender === "marcus" ? "msg-marcus" : "msg-candidate";
    const avatarCls = sender === "marcus" ? "msg-avatar-marcus" : "msg-avatar-candidate";
    const avatarText = sender === "marcus" ? "M" : State.candidateName[0].toUpperCase();
    div.className = "msg " + cls + " " + extraClass;
    div.innerHTML = "<div class='msg-avatar " + avatarCls + "'>" + avatarText + "</div><div class='msg-bubble'>" + escapeHtml(text) + "</div>";
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
  typingEl.innerHTML = "<div class='msg-avatar msg-avatar-marcus'>M</div><div class='typing-indicator'><div class='typing-dot'></div><div class='typing-dot'></div><div class='typing-dot'></div></div>";
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => { typingEl.remove(); appendMessage("marcus", sc.curveball, "msg-curveball"); }, 2200);
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
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
  let response = "";
  if (phase === 0 || phase === 1) {
    if (lower.includes("none") || lower.includes("null") || lower.includes("corrupt") || lower.includes("invalid"))
      response = "Good catch on the None/corrupt packet case — that's exactly the defensive thinking I'm looking for. Yes, filter those out silently. What about a packet where the subsystem key is missing entirely?";
    else if (lower.includes("output") || lower.includes("format") || lower.includes("return"))
      response = "The output format is up to you — but if I call result['battery']['max'], what does that imply about the nesting? Make sure you can justify your data structure choice.";
    else if (lower.includes("threshold") || lower.includes("alert") || lower.includes("flag"))
      response = "If any single reading exceeds the threshold, flag the whole subsystem. What if a subsystem appears in packets but not in the threshold dict?";
    else if (lower.includes("generator") || lower.includes("stream") || lower.includes("memory"))
      response = "Interesting — we'll get to scale in Phase 3. For now assume batch list input. But keep that generator thought in mind.";
    else {
      const opts = [
        "Makes sense. What's your next step? Walk me through how you'll start the implementation.",
        "Good thinking. What edge case are you most worried about?",
        "Before coding — can you name the two most important defensive checks this function needs?",
        "How do you plan to structure the output dictionary? What keys will each subsystem entry have?",
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
        "What's the current state of your loop? What does each iteration do?",
        "Remember to handle the case where the packet's value key might not exist at all.",
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
        "What happens if the input list has zero packets? Does it crash or return something sensible?",
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

document.addEventListener("DOMContentLoaded", function() {
  const editor = document.getElementById("codeEditor");
  if (editor) {
    editor.addEventListener("input", updateLineNumbers);
    editor.addEventListener("keydown", handleTabKey);
    editor.addEventListener("scroll", syncScroll);
  }
  initLanding();
  document.getElementById("chatInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
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
    setTimeout(function() { btn.textContent = "Copy"; }, 2000);
  });
}

function clearTerminal() {
  document.getElementById("terminalOutput").innerHTML = "<div class='term-line term-sys'>[ CLEAR ] Terminal cleared.</div>";
}

function runTests() {
  if (State.phase < 2) { addTerminalLine("[ BLOCKED ] Test execution available from Phase 2 onwards.", "term-warn"); return; }
  const code = document.getElementById("codeEditor").value.trim();
  State.codeRunCount++;
  const terminal = document.getElementById("terminalOutput");
  terminal.innerHTML = "";
  addTerminalLine("[ RUN ] Executing candidate solution against test harness...", "term-sys");
  addTerminalLine("[ SYS ] Sandbox: Python 3.11 — subprocess timeout: 5s", "term-sys");
  addTerminalLine("", "term-sys");
  if (!code || code === SCENARIOS[State.selectedScenario].starterCode) {
    setTimeout(function() { simulateFailedRun("NotImplementedError: Function not implemented — stub returned None"); }, 400);
    return;
  }
  setTimeout(function() { simulateTestRun(code); }, 500);
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
  const codeClean = code.replace(/\s|#.*$/mg, "");
  const hasLoop = /for\s+\w/.test(code);
  const hasIf = /if\s+/.test(code);
  const hasReturn = /return/.test(code);
  const hasDict = /\{/.test(code) || /dict\(/.test(code);
  const hasGet = /\.get\(/.test(code);
  const hasNoneCheck = /None|status.*OK|ERROR|status\b/.test(code);
  const hasTry = /try:/.test(code);
  const sizeOk = codeClean.length > 150;
  const completeness = [hasLoop, hasIf, hasReturn, hasDict].filter(Boolean).length / 4;
  const quality = [hasGet, hasNoneCheck, hasTry].filter(Boolean).length;

  var testResults = [];
  if (sc.id === "scenario_a") {
    const hasMax = /max\s*[=(]|'max'/.test(code);
    const hasAvg = /avg|average|sum\s*\/|total\s*\//.test(code);
    const hasAlert = /alert|threshold|exceed/.test(code);
    testResults = [
      { name: "Test 1 (Basic filtering & metrics)", pass: hasLoop && hasReturn && sizeOk && hasDict },
      { name: "Test 2 (All-corrupt packets)", pass: hasNoneCheck || hasGet },
      { name: "Test 3 (Unknown subsystem)", pass: hasGet },
      { name: "Test 4 (Empty input)", pass: hasReturn && (code.includes("{}") || hasLoop) },
    ];
  } else if (sc.id === "scenario_b") {
    const hasStruct = /struct\.unpack/.test(code);
    const hasSyncCheck = /0xDEAD|DEAD|57005/.test(code);
    const hasLenCheck = /len\(/.test(code);
    testResults = [
      { name: "Test 1 (Valid frame decode)", pass: hasStruct && hasReturn && sizeOk },
      { name: "Test 2 (Bad sync header)", pass: hasSyncCheck },
      { name: "Test 3 (Corrupted checksum)", pass: /xor|checksum|\^|XOR/.test(code.toLowerCase()) || /\^/.test(code) },
      { name: "Test 4 (Truncated frame)", pass: hasLenCheck },
      { name: "Test 5 (Empty input)", pass: hasLenCheck || hasTry },
    ];
  } else if (sc.id === "scenario_c") {
    const hasHeap = /heapq/.test(code);
    const hasAsync = /async\s+def/.test(code) || /await/.test(code);
    const hasRetry = /range.*retri|retry|attempt|max_retri/.test(code);
    const hasBackoff = /sleep|backoff|2\s*\*\*/.test(code);
    testResults = [
      { name: "Test 1 (Priority ordering)", pass: hasHeap && hasReturn },
      { name: "Test 2 (Retry + failure logging)", pass: hasRetry && hasTry },
      { name: "Test 3 (Success logging)", pass: hasAsync && hasReturn },
    ];
  } else if (sc.id === "scenario_d") {
    const hasFfill = /last_|prev_|None/.test(code);
    const hasRange = /range\(/.test(code);
    testResults = [
      { name: "Test 1 (Basic forward fill)", pass: hasLoop && hasReturn && hasDict && hasRange },
      { name: "Test 2 (Silent sensor forward-fill)", pass: hasFfill },
      { name: "Test 3 (None before first reading)", pass: hasNoneCheck || /is None/.test(code) },
      { name: "Test 4 (Empty streams)", pass: hasReturn && hasLoop },
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
  const dims = [
    { name: "Defensive Ingestion",          weight: "30%", data: scores.defensive },
    { name: "Spacecraft Domain Logic",      weight: "25%", data: scores.domain    },
    { name: "Code Quality & Pythonic Style",weight: "25%", data: scores.pythonic  },
    { name: "Communication & Clarification",weight: "20%", data: scores.comm      },
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

  document.getElementById("scorecardFeedback").innerHTML = "<div class='feedback-title'>Marcus's Final Assessment</div><div class='feedback-text'>" + escapeHtml(generateFeedback(scores, total, sc)) + "</div>";
  showScreen("screen-scorecard");
}

function computeScores(sc, code) {
  const rubric = sc.evaluationRubric;
  const defensiveChecks = [
    { name: rubric.defensive[0], pass: /None|is None|not.*value/.test(code) },
    { name: rubric.defensive[1], pass: /\.get\(/.test(code) },
    { name: rubric.defensive[2], pass: /\[\]|len\(|not.*packet|if.*packet/.test(code) },
    { name: rubric.defensive[3], pass: State.testsPassed >= 3 || code.length > 400 },
  ];
  const defScore = Math.round(defensiveChecks.filter(function(c){return c.pass;}).length / defensiveChecks.length * 100);

  const domainChecks = [
    { name: rubric.domain[0], pass: /for\s+\w+\s+in/.test(code) && /\{/.test(code) },
    { name: rubric.domain[1], pass: State.testsPassed >= 2 },
    { name: rubric.domain[2], pass: /alert|threshold|exceed|flag/.test(code) || State.allTestsPassed },
    { name: rubric.domain[3], pass: State.curvballAsked && State.candidateMessages.some(function(m){return /generator|stream|memory|iter|yield|constant|O\(1\)|buffer/.test(m.toLowerCase());}) },
  ];
  const domScore = Math.round(domainChecks.filter(function(c){return c.pass;}).length / domainChecks.length * 100);

  const pythonicChecks = [
    { name: rubric.pythonic[0], pass: /\.get\(/.test(code) },
    { name: rubric.pythonic[1], pass: /\[.*for.*in.*\]/.test(code) || /dict\(/.test(code) },
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
  const lines = [name + ", here's my honest assessment after 30 minutes:", ""];
  if (scores.defensive.score >= 75)
    lines.push("Defensive coding was solid — you thought about None checks and missing keys before they became runtime errors. That's the mindset we need parsing live telemetry from a vehicle that can't be rebooted.");
  else
    lines.push("Defensive coding needs work. An unhandled KeyError or NoneType during a pass can mean losing minutes of mission data. Always guard inputs first, before the happy path.");
  if (scores.domain.score >= 75)
    lines.push("\nYou showed good domain understanding — thinking about the streaming/memory tradeoff is a real constraint we hit at scale. That's not a trivial observation.");
  else
    lines.push("\nDomain fluency is an area to develop. Why we use generators over lists, why out-of-order timestamps matter in telemetry — read up on spacecraft data protocols. CCSDS is a good start.");
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
  const win = window.open("", "_blank");
  var html = "<html><head><title>Session Review</title><style>body{background:#060c1a;color:#e8f0ff;font-family:'JetBrains Mono',monospace;padding:40px;max-width:800px;margin:0 auto;line-height:1.7}h1{color:#00d4ff;margin-bottom:4px}h2{color:#7a9abf;font-size:.9rem;margin-bottom:32px}.msg{margin-bottom:20px;padding:14px 16px;border-radius:8px;border-left:3px solid}.marcus{border-color:#006eff;background:rgba(0,110,255,0.06)}.candidate{border-color:#7b2fff;background:rgba(123,47,255,0.06)}.sender{font-size:.72rem;color:#7a9abf;margin-bottom:6px;letter-spacing:.1em;text-transform:uppercase}</style></head><body><h1>Rocket Lab Interview Session Review</h1><h2>" + State.candidateName + " — " + (sc ? sc.title : "") + "</h2>";
  msgs.forEach(function(m) {
    if (m.sender === "system") return;
    var cls = m.sender === "marcus" ? "marcus" : "candidate";
    var sender = m.sender === "marcus" ? "Marcus (Interviewer)" : State.candidateName + " (Candidate)";
    html += "<div class='msg " + cls + "'><div class='sender'>" + sender + "</div>" + m.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>") + "</div>";
  });
  html += "</body></html>";
  win.document.write(html);
}

function escapeHtml(text) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

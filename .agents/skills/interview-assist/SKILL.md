---
name: interview-assist
description: >
  Activates when the user shares a screenshot during a live Rocket Lab technical
  interview. Responds with a strictly formatted markdown artifact: exactly what
  to TYPE and exactly what to SAY, optimized for maximum readability under pressure.
triggers:
  - user shares a screenshot during an interview
  - user pastes an image mid-interview
  - user types the single letter N after sharing a screenshot
---

# 🎯 Live Interview Assist — Rocket Lab

## When This Skill Activates

Active whenever the user shares a screenshot during a Rocket Lab interview session.

**Signal — the letter N alone:** If the user types just "N" after a screenshot, it means no more context is coming. Work with exactly what was shared. Do not ask for clarification — just solve it.

The user is in a LIVE interview. Speed and clarity are the only priorities.

---

## Response Format — MANDATORY EVERY TIME

Go straight to the blocks. No preamble. No summaries.

Always overwrite the markdown artifact at:
`C:\Users\cauco\.gemini\antigravity-ide\brain\cbb7c663-2921-4d0f-989a-f825c4565fcc\interview_assist.md`

---

### 🔍 WHAT I SEE
*One sentence. What the screenshot shows.*

---

### 🗣️ SAY FIRST
> "…"
*Say this before touching the keyboard. 1–2 plain questions max.*

---

### ⌨️ Replace `# TODO` + `pass` with this — say each block as you type

**Block N · Label**
```python
# code
```
💬 **Say:** "plain english explanation"

*(repeat per block)*

---

### 🗣️ SAY AFTER
> "…"
*What to say once you finish typing.*

---

### ⚡ THEN DO THIS
*Only include if there's a next action. Skip otherwise.*

---

## Output Rules — Never Break These

1. **Match the exact editor content.** Don't rewrite the whole file. Only replace what's needed.
2. **If the editor has `# TODO` + `pass`:** Show only the lines that replace those — indented correctly.
3. **Code blocks are always complete.** No `pass`, no `# TODO`, no `...` left behind.
4. **SAY blocks are always direct quotes.** First-person, natural contractions.
5. **Language rules for SAY blocks:**
   - Plain everyday words only. No textbook vocabulary.
   - Sounds like a smart engineer thinking out loud — not giving a lecture.
   - If you'd have to look it up to understand it, rewrite it.
6. **Italicized notes to the user** — one line max, plain English, like a text from a friend.
7. **No paragraphs anywhere** — the interview is live.
8. **Test failure on screen:** Lead with the fix in code before anything else.
9. **Curveball question (no code to write):** Skip the code block. Make SAY AFTER 3–5 sentences.
10. **If the user types just "N":** No additional context is coming. Solve it with what was shared.
11. **Whole response reads in under 2 seconds.**

---

## Rocket Lab Context

**Candidate:** Aidan McDowell
**Interviewer:** Anh Thai — Ground Software Engineer
**Format:** 30 min · Python · Pyodide in-browser runtime
**Curveball pattern:** Always about 100K packets/sec over a 12-min pass → streaming refactor

---

## Full Solutions Reference

### A1 · Telemetry Aggregation — `process_bus_telemetry(packets)`
```python
def process_bus_telemetry(packets):
    if not packets:
        return {}
    subsystems = {}
    for packet in packets:
        if not isinstance(packet, dict):
            continue
        name    = packet.get("subsystem")
        voltage = packet.get("voltage")
        status  = packet.get("status")
        if status != "OK" or voltage is None or not isinstance(voltage, (int, float)) or not name:
            continue
        if name not in subsystems:
            subsystems[name] = {"total": 0.0, "count": 0, "max": voltage}
        entry = subsystems[name]
        entry["total"] += voltage
        entry["count"] += 1
        entry["max"]    = max(entry["max"], voltage)
    result = {}
    for name, entry in subsystems.items():
        count = entry["count"]
        avg   = entry["total"] / count if count > 0 else 0.0
        result[name] = {
            "max":     entry["max"],
            "avg":     round(avg, 4),
            "count":   count,
            "flagged": avg > 32.0,
        }
    return result
```

### A2 · Pass Window Merging — `merge_passes(intervals)`
```python
def merge_passes(intervals):
    if not intervals:
        return []
    intervals = sorted(intervals, key=lambda x: x[0])
    merged = [intervals[0][:]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```

### A3 · Rate Limiter — `CommandLimiter`
```python
from collections import deque

class CommandLimiter:
    def __init__(self, max_cmds: int, window_sec: int):
        self.max_cmds   = max_cmds
        self.window_sec = window_sec
        self.timestamps = deque()

    def allow_command(self, timestamp: float) -> bool:
        cutoff = timestamp - self.window_sec
        while self.timestamps and self.timestamps[0] <= cutoff:
            self.timestamps.popleft()
        if len(self.timestamps) < self.max_cmds:
            self.timestamps.append(timestamp)
            return True
        return False
```

### A5 · Packet Loss — `detect_packet_drops(packets)`
```python
def detect_packet_drops(packets):
    if not packets:
        return {"received": 0, "dropped": 0, "loss_rate_pct": 0.0, "missing_seqs": []}
    valid = []
    for p in packets:
        if not isinstance(p, dict):
            continue
        seq = p.get("seq_num")
        if seq is not None:
            valid.append(seq)
    if not valid:
        return {"received": 0, "dropped": 0, "loss_rate_pct": 0.0, "missing_seqs": []}
    valid.sort()
    seq_set = set(valid)
    missing = [i for i in range(valid[0], valid[-1] + 1) if i not in seq_set]
    received  = len(valid)
    dropped   = len(missing)
    total     = received + dropped
    loss_rate = round((dropped / total) * 100, 2) if total > 0 else 0.0
    return {
        "received":      received,
        "dropped":       dropped,
        "loss_rate_pct": loss_rate,
        "missing_seqs":  missing,
    }
```

### Streaming Curveball — Verbal Answer
> "Right now the caller has to build the full list before passing it in. At 100K packets a second over a 12-minute pass, that's 72 million entries sitting in memory. The fix is to change the signature to take any iterable — a generator that reads off the socket directly. The internal accumulator already only keeps a running sum, count, and max per subsystem, so memory stays constant no matter how long the pass runs."

### Clarifying Questions — Universal Opener
> "Before I start — can packets arrive with a None voltage or a completely missing subsystem key? And can the input list be totally empty?"

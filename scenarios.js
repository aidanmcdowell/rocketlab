const SCENARIOS = {
  scenario_a: {
    id: "scenario_a",
    label: "Scenario 1",
    title: "Telemetry Anomaly & Aggregation Filter",
    icon: "📡",
    difficulty: "Medium",
    tags: ["Data Parsing", "Edge Cases", "Statistics"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hi ${""}, great to meet you. I'm Anh — Ground Software Engineer here at Rocket Lab. Thanks for coming in.\n\nWe'll be working through a problem directly from our satellite pass processing pipeline. I want you to write a Python function called process_bus_telemetry(packets).\n\nContext: during a ground station pass, our receivers ingest batches of raw sensor packets from the vehicle's 2nd stage avionics bus:\n\n  packets = [\n    {"subsystem": "avionics", "voltage": 28.4, "status": "OK"},\n    {"subsystem": "avionics", "voltage": None, "status": "ERROR"},\n    {"subsystem": "payload", "voltage": 33.1, "status": "OK"},\n    {"subsystem": "avionics", "voltage": 28.6, "status": "OK"}\n  ]\n\nYour function should:\n  1. Skip corrupt/missing records (None voltage or status != "OK")\n  2. Calculate the maximum and average voltage per subsystem\n  3. Flag any subsystem whose average exceeds 32.0V\n\nBefore you start typing — take a moment. What questions do you have about the input format, the output structure, or edge cases I'd want handled?`,
    starterCode: `def process_bus_telemetry(packets):
    """
    Process telemetry packets from the 2nd stage avionics bus.
    
    Args:
        packets: List of dicts with keys: subsystem, voltage, status
    
    Returns:
        Dict keyed by subsystem with: max, avg, count, flagged
        Flag subsystems whose average voltage exceeds 32.0V.
    """
    # TODO: Implement parsing, filtering, and metric calculation
    pass


# Test your implementation:
data = [
    {"subsystem": "avionics", "voltage": 28.4, "status": "OK"},
    {"subsystem": "avionics", "voltage": None, "status": "ERROR"},
    {"subsystem": "payload", "voltage": 33.1, "status": "OK"},
    {"subsystem": "avionics", "voltage": 28.6, "status": "OK"}
]
result = process_bus_telemetry(data)
print(result)`,
    testHarness: `import traceback

def run_tests():
    results = []
    # Test 1: Basic filtering & metrics
    try:
        data = [
            {"subsystem": "avionics", "voltage": 28.4, "status": "OK"},
            {"subsystem": "avionics", "voltage": None, "status": "ERROR"},
            {"subsystem": "payload", "voltage": 33.1, "status": "OK"},
            {"subsystem": "avionics", "voltage": 28.6, "status": "OK"}
        ]
        result = process_bus_telemetry(data)
        assert result["avionics"]["max"] == 28.6, f"Expected max 28.6, got {result['avionics']['max']}"
        assert abs(result["avionics"]["avg"] - 28.5) < 0.01, f"Expected avg ~28.5, got {result['avionics']['avg']}"
        assert result["avionics"]["flagged"] == False, "avionics should not be flagged"
        assert result["payload"]["flagged"] == True, "payload avg 33.1 > 32.0, should be flagged"
        results.append(("Test 1 (Basic filtering & metrics)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Basic filtering & metrics)", False, str(e)))

    # Test 2: All-corrupt packets
    try:
        data = [
            {"subsystem": "avionics", "voltage": None, "status": "ERROR"},
            {"subsystem": "avionics", "voltage": None, "status": "ERROR"}
        ]
        result = process_bus_telemetry(data)
        assert isinstance(result, dict), "Should return a dict"
        # Either avionics not present or has count 0
        if "avionics" in result:
            assert result["avionics"].get("count", 0) == 0
        results.append(("Test 2 (All-corrupt packets)", True, ""))
    except Exception as e:
        results.append(("Test 2 (All-corrupt packets)", False, str(e)))

    # Test 3: Missing subsystem key in packet
    try:
        data = [
            {"voltage": 28.0, "status": "OK"},
            {"subsystem": "avionics", "voltage": 28.0, "status": "OK"}
        ]
        result = process_bus_telemetry(data)
        assert isinstance(result, dict), "Should handle missing keys gracefully"
        results.append(("Test 3 (Missing subsystem key)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Missing subsystem key)", False, str(e)))

    # Test 4: Empty input
    try:
        result = process_bus_telemetry([])
        assert isinstance(result, dict), "Should return empty dict for empty input"
        assert len(result) == 0, f"Expected empty dict, got {result}"
        results.append(("Test 4 (Empty input)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Empty input)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Nice work — that passes the baseline. Real-world constraint: this data is now streaming at 100,000 packets per second over a 12-minute orbital pass. If you're storing all packets in a list before processing, what happens after 72 million entries? How would you restructure this so memory stays constant regardless of pass duration?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'Quick check before you finish — what happens if one of those voltage values arrives as a string instead of a number? Like \"28.4\" as a string?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'That works for our sample data. If this stream scales to 100,000 packets per second, what would be the bottleneck in your current approach?'",
        type: "performance"
      }
    ],
    hints: [
      "Before the loop — what does the output structure need to look like? If I call result['avionics']['max'], what type should result be?",
      "Corrupted packets: what two things can make a packet invalid? The status field and the voltage field. How do you safely check both without a KeyError?",
      "Start with: for packet in packets: — filter out anything where status != 'OK' or voltage is None. Get that working before aggregation.",
      "For rolling max and avg: you don't need to store all values. Just running sum, count, and current max. Three variables per subsystem."
    ],
    evaluationRubric: {
      defensive: ["Handles None voltage values", "Uses .get() for safe key access", "Handles empty packet list", "Handles missing subsystem key"],
      domain: ["Groups metrics by subsystem", "Computes max and avg correctly", "Flags threshold violations", "Addresses streaming/memory concern"],
      pythonic: ["Uses .get() for safe key access", "Dict comprehension or clean grouping", "No unnecessary nested loops", "Clean function structure"],
      communication: ["Asked about output format", "Asked about error handling", "Explained approach before coding", "Talked through logic during implementation"]
    }
  },

  scenario_b: {
    id: "scenario_b",
    label: "Scenario 2",
    title: "Ground Station Pass Window Merging",
    icon: "🌍",
    difficulty: "Medium",
    tags: ["Intervals", "Sorting", "Merging"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hi, I'm Anh — Ground Software Engineer at Rocket Lab. Good to meet you.\n\nToday's problem comes straight from our ground station scheduling system. We operate tracking antennas in New Zealand, Wallops Island, and Long Beach. During a satellite pass, we get overlapping visibility windows from different antennas.\n\nI want you to write a function merge_passes(intervals) that takes a list of [start, end] UTC minute integers and merges all overlapping contact windows into continuous blocks.\n\nExample:\n  Input:  [[10, 14], [12, 18], [20, 25]]\n  Output: [[10, 18], [20, 25]]\n\nThe intervals might arrive unsorted, and could be empty. Adjacent intervals like [1, 5] and [6, 10] are NOT overlapping — they're separate passes.\n\nBefore you code — what questions do you have about the format, edge cases, or expected behavior?`,
    starterCode: `def merge_passes(intervals):
    """
    Merge overlapping ground station contact windows.
    
    Args:
        intervals: List of [start, end] UTC minute integers
    
    Returns:
        List of merged [start, end] intervals, sorted by start time.
        Adjacent but non-overlapping intervals remain separate.
    """
    # TODO: Implement interval merging
    pass


# Test your implementation:
print(merge_passes([[10, 14], [12, 18], [20, 25]]))  # [[10, 18], [20, 25]]
print(merge_passes([]))                                # []
print(merge_passes([[1, 5], [6, 10]]))                 # [[1, 5], [6, 10]]`,
    testHarness: `def run_tests():
    results = []

    # Test 1: Basic overlapping merge
    try:
        result = merge_passes([[10, 14], [12, 18], [20, 25]])
        assert result == [[10, 18], [20, 25]], f"Expected [[10, 18], [20, 25]], got {result}"
        results.append(("Test 1 (Basic overlapping merge)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Basic overlapping merge)", False, str(e)))

    # Test 2: Empty input
    try:
        result = merge_passes([])
        assert result == [], f"Expected [], got {result}"
        results.append(("Test 2 (Empty input)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Empty input)", False, str(e)))

    # Test 3: Adjacent but non-overlapping
    try:
        result = merge_passes([[1, 5], [6, 10]])
        assert result == [[1, 5], [6, 10]], f"Expected [[1, 5], [6, 10]], got {result}"
        results.append(("Test 3 (Adjacent non-overlapping)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Adjacent non-overlapping)", False, str(e)))

    # Test 4: Unsorted input with multiple merges
    try:
        result = merge_passes([[20, 25], [1, 3], [2, 7], [15, 22]])
        assert result == [[1, 7], [15, 25]], f"Expected [[1, 7], [15, 25]], got {result}"
        results.append(("Test 4 (Unsorted with multiple merges)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Unsorted with multiple merges)", False, str(e)))

    # Test 5: Single interval
    try:
        result = merge_passes([[5, 10]])
        assert result == [[5, 10]], f"Expected [[5, 10]], got {result}"
        results.append(("Test 5 (Single interval)", True, ""))
    except Exception as e:
        results.append(("Test 5 (Single interval)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Good — that handles the sorted case. Real scenario: what if the input contains windows where the end time is before the start time (corrupted data from an antenna controller reboot)? And what if two windows share the exact same start and end? How does your code handle those?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'Quick check — what happens if one of those interval values arrives as a string instead of an integer? Like [\"10\", 14]?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'That works for our sample data. If we're merging 50,000 contact windows across a constellation of 300 satellites, what's the time complexity of your approach?'",
        type: "performance"
      }
    ],
    hints: [
      "First step: sort the intervals by start time. In Python: intervals.sort() or sorted(intervals). Why does sorting matter here?",
      "Initialize a result list with the first interval. Then loop through the rest: if the current interval overlaps with the last merged one, extend the end. Otherwise, append a new interval.",
      "Overlap condition: current_start <= previous_end. If true, merge by updating previous_end = max(previous_end, current_end).",
      "Don't forget to handle the empty list case at the top — return [] immediately."
    ],
    evaluationRubric: {
      defensive: ["Handles empty input list", "Handles unsorted input", "Handles single interval", "Handles duplicate/identical intervals"],
      domain: ["Sorts by start time first", "Correct overlap detection", "Uses max() for end time merge", "Addresses scaling concern"],
      pythonic: ["Uses sorted() or .sort()", "Clean loop structure", "Avoids unnecessary copies", "Clear variable naming"],
      communication: ["Asked about sort guarantee", "Asked about overlap definition", "Explained merge strategy", "Discussed time complexity"]
    }
  },

  scenario_c: {
    id: "scenario_c",
    label: "Scenario 3",
    title: "Uplink Command Rate Limiter",
    icon: "⚡",
    difficulty: "Medium",
    tags: ["Sliding Window", "Deque", "OOP"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hey, I'm Anh. Good to have you in.\n\nThis is about uplink command throttling — a real constraint in our ground-to-vehicle communication system. Spacecraft transceivers can only process a limited number of commands within any time window before they overheat or drop packets.\n\nI want you to implement a class CommandLimiter with:\n  - __init__(self, max_cmds: int, window_sec: int) — configures the limiter\n  - allow_command(self, timestamp: float) -> bool — returns True if the command is permitted, False if it should be dropped\n\nThe rule: at most max_cmds commands are allowed within any rolling window of window_sec seconds.\n\nExample:\n  limiter = CommandLimiter(max_cmds=2, window_sec=5)\n  limiter.allow_command(1.0)  # True  — 1st command\n  limiter.allow_command(2.0)  # True  — 2nd command\n  limiter.allow_command(3.0)  # False — 2 commands already within [1.0, 6.0)\n  limiter.allow_command(6.5)  # True  — 1.0 has expired (6.5 - 5 = 1.5)\n\nWhat questions do you have before you start?`,
    starterCode: `class CommandLimiter:
    """
    Rate limiter for spacecraft uplink commands.
    
    Allows at most max_cmds commands within any rolling
    window of window_sec seconds.
    """
    def __init__(self, max_cmds: int, window_sec: int):
        # TODO: Initialize state
        pass

    def allow_command(self, timestamp: float) -> bool:
        """
        Check if a command at this timestamp is permitted.
        Returns True if allowed, False if rate-limited.
        """
        # TODO: Implement sliding window check
        pass


# Test your implementation:
limiter = CommandLimiter(max_cmds=2, window_sec=5)
print(limiter.allow_command(1.0))   # True
print(limiter.allow_command(2.0))   # True
print(limiter.allow_command(3.0))   # False
print(limiter.allow_command(6.5))   # True`,
    testHarness: `from collections import deque

def run_tests():
    results = []

    # Test 1: Basic rate limiting
    try:
        limiter = CommandLimiter(max_cmds=2, window_sec=5)
        assert limiter.allow_command(1.0) == True, "1st command should be allowed"
        assert limiter.allow_command(2.0) == True, "2nd command should be allowed"
        assert limiter.allow_command(3.0) == False, "3rd command within window should be blocked"
        results.append(("Test 1 (Basic rate limiting)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Basic rate limiting)", False, str(e)))

    # Test 2: Window expiry
    try:
        limiter = CommandLimiter(max_cmds=2, window_sec=5)
        limiter.allow_command(1.0)
        limiter.allow_command(2.0)
        assert limiter.allow_command(6.5) == True, "1.0 expired (6.5 - 5 = 1.5), should allow"
        results.append(("Test 2 (Window expiry)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Window expiry)", False, str(e)))

    # Test 3: Burst then wait
    try:
        limiter = CommandLimiter(max_cmds=3, window_sec=10)
        assert limiter.allow_command(0.0) == True
        assert limiter.allow_command(1.0) == True
        assert limiter.allow_command(2.0) == True
        assert limiter.allow_command(3.0) == False
        assert limiter.allow_command(10.5) == True, "0.0 expired at 10.5"
        results.append(("Test 3 (Burst then wait)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Burst then wait)", False, str(e)))

    # Test 4: Single command allowed
    try:
        limiter = CommandLimiter(max_cmds=1, window_sec=1)
        assert limiter.allow_command(0.0) == True
        assert limiter.allow_command(0.5) == False
        assert limiter.allow_command(1.1) == True
        results.append(("Test 4 (Single command window)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Single command window)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Solid. Wrinkle: the command queue gets flooded during an anomaly — 500 commands backed up. When the transceiver recovers, we can't blast all 500 at once or we'll saturate the RF uplink. How would you modify this to also enforce a minimum spacing between consecutive commands — say, at least 200ms apart?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'Quick check — what happens if someone calls allow_command with timestamps that aren't monotonically increasing? Like calling with 5.0 then 3.0?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'That works for our sample data. If this limiter is handling 100,000 commands per second across multiple ground stations, what's the memory usage over time? Does it grow unbounded?'",
        type: "performance"
      }
    ],
    hints: [
      "Use a collections.deque to store the timestamps of allowed commands. Why deque? O(1) popleft.",
      "When a new command arrives: first, remove all timestamps from the front of the deque that are older than (timestamp - window_sec).",
      "After pruning: if len(deque) < max_cmds, append the new timestamp and return True. Otherwise return False.",
      "Edge case: what if max_cmds is 0? What if window_sec is 0? Guard those at the top."
    ],
    evaluationRubric: {
      defensive: ["Handles edge case of max_cmds=0", "Prunes expired timestamps", "Handles non-monotonic timestamps", "Handles rapid burst correctly"],
      domain: ["Uses deque or equivalent", "Correct sliding window logic", "O(1) amortized pruning", "Addresses minimum spacing concern"],
      pythonic: ["Uses collections.deque", "Clean class structure", "Clear method signatures", "Efficient data structure choice"],
      communication: ["Asked about timestamp ordering", "Asked about edge cases", "Explained sliding window concept", "Discussed memory implications"]
    }
  },

  scenario_e: {
    id: "scenario_e",
    label: "Scenario 5",
    title: "Telemetry Packet Loss & Sequence Continuity",
    icon: "📉",
    difficulty: "Medium",
    tags: ["Sequence Counter", "RF Downlink", "Gap Detection"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hi, I'm Anh — Ground Software Engineer at Rocket Lab. Good to meet you.\n\nThis scenario comes straight from our RF downlink monitoring pipeline. During a satellite pass over Mahia or Wallops, our ground station receives telemetry packets that each carry a monotonically increasing sequence counter: seq_num = 0, 1, 2, 3…\n\nWhen RF attenuation spikes — from weather, antenna handoff, or signal fade — packets get dropped. The ground system needs to detect exactly which sequence numbers went missing and compute the loss rate in real time.\n\nI want you to write a function detect_packet_drops(packets).\n\nEach packet is a dict with:\n  - seq_num (int): the sequence counter\n  - subsystem (str): e.g. "avionics"\n  - timestamp (float): seconds since epoch\n\nYour function should return:\n  {\n    "received": <count of valid packets>,\n    "dropped": <count of missing seq nums>,\n    "loss_rate_pct": <float, rounded to 2 decimals>,\n    "missing_seqs": <list of missing seq nums in order>\n  }\n\nIf the input is empty or has no valid seq_nums, return all zeros.\n\nTake a moment — what questions do you have about the input format, edge cases, or how loss rate should be calculated?`,
    starterCode: `def detect_packet_drops(packets):
    """
    Analyzes telemetry sequence numbers to identify dropped packets.

    Args:
        packets: List of dicts with keys: seq_num (int), subsystem (str), timestamp (float)

    Returns:
        Dict with: received (int), dropped (int), loss_rate_pct (float), missing_seqs (list)
    """
    # TODO: Implement sequence continuity and drop detection
    pass


# Test your implementation:
data = [
    {"seq_num": 101, "subsystem": "avionics", "timestamp": 1.0},
    {"seq_num": 102, "subsystem": "avionics", "timestamp": 1.1},
    {"seq_num": 104, "subsystem": "avionics", "timestamp": 1.3},
    {"seq_num": 105, "subsystem": "avionics", "timestamp": 1.4}
]
result = detect_packet_drops(data)
print(result)`,
    testHarness: `import traceback

def run_tests():
    results = []

    # Test 1: Basic gap detection
    try:
        data = [
            {"seq_num": 101, "subsystem": "avionics", "timestamp": 1.0},
            {"seq_num": 102, "subsystem": "avionics", "timestamp": 1.1},
            {"seq_num": 104, "subsystem": "avionics", "timestamp": 1.3},
            {"seq_num": 105, "subsystem": "avionics", "timestamp": 1.4}
        ]
        res = detect_packet_drops(data)
        assert res["received"] == 4, f"Expected received=4, got {res['received']}"
        assert res["dropped"] == 1, f"Expected dropped=1, got {res['dropped']}"
        assert res["missing_seqs"] == [103], f"Expected [103], got {res['missing_seqs']}"
        assert res["loss_rate_pct"] == 20.0, f"Expected 20.0%, got {res['loss_rate_pct']}"
        results.append(("Test 1 (Basic gap detection)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Basic gap detection)", False, str(e)))

    # Test 2: Empty input guard
    try:
        res = detect_packet_drops([])
        assert res["received"] == 0, "Empty input: received should be 0"
        assert res["dropped"] == 0, "Empty input: dropped should be 0"
        assert res["loss_rate_pct"] == 0.0, "Empty input: loss_rate_pct should be 0.0"
        assert res["missing_seqs"] == [], "Empty input: missing_seqs should be []"
        results.append(("Test 2 (Empty input guard)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Empty input guard)", False, str(e)))

    # Test 3: No drops (perfect sequence)
    try:
        data = [
            {"seq_num": 10, "subsystem": "power", "timestamp": 0.0},
            {"seq_num": 11, "subsystem": "power", "timestamp": 0.1},
            {"seq_num": 12, "subsystem": "power", "timestamp": 0.2}
        ]
        res = detect_packet_drops(data)
        assert res["dropped"] == 0, f"Expected 0 drops, got {res['dropped']}"
        assert res["loss_rate_pct"] == 0.0, "No drops: loss should be 0.0%"
        results.append(("Test 3 (No drops — perfect sequence)", True, ""))
    except Exception as e:
        results.append(("Test 3 (No drops — perfect sequence)", False, str(e)))

    # Test 4: Corrupt packets with None seq_num
    try:
        data = [
            {"seq_num": 5, "subsystem": "avionics", "timestamp": 0.0},
            {"seq_num": None, "subsystem": "avionics", "timestamp": 0.1},
            {"seq_num": 7, "subsystem": "avionics", "timestamp": 0.2}
        ]
        res = detect_packet_drops(data)
        assert res["received"] == 2, f"Expected received=2 (skipping None), got {res['received']}"
        assert 6 in res["missing_seqs"], f"Expected 6 in missing_seqs, got {res['missing_seqs']}"
        results.append(("Test 4 (Corrupt None seq_num skipped)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Corrupt None seq_num skipped)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Good solution. Real-world twist: the seq_num counter rolls over at 65535 (it's a 16-bit unsigned integer). So after 65535, the next valid packet has seq_num = 0. How would your gap detection handle a sequence like [65534, 65535, 0, 1]? Would it falsely report 65534 dropped packets?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'Quick check — what if seq_num arrives as a string like \"104\" instead of an integer? Should that count as valid or corrupt?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'That handles the batch case. If this were streaming live at 10,000 packets per second, how would you restructure this to not require sorting the full list on every packet arrival?'",
        type: "performance"
      }
    ],
    hints: [
      "First: guard at the top — if not packets, return zeros immediately. What happens if you try valid_seqs[0] on an empty list?",
      "Extract valid seq_nums: loop packets, check isinstance(p, dict) and p.get('seq_num') is not None. Store in a sorted list.",
      "The expected span is (last_seq - first_seq) + 1. Loss rate = dropped / expected * 100, not dropped / received.",
      "To find gaps: convert valid_seqs to a set, then loop range(first_seq, last_seq + 1). If num not in the set, it's missing."
    ],
    evaluationRubric: {
      defensive: ["Guards empty input", "Skips None seq_num", "Handles non-dict packets", "Handles single packet (no drops possible)"],
      domain: ["Correct expected_count formula", "Detects missing seq IDs via set", "Loss rate uses expected not received as denominator", "Addresses rollover concern"],
      pythonic: ["Uses set() for O(1) membership check", "Uses .get() for safe access", "round() to 2 decimals", "sorted() on extracted seqs"],
      communication: ["Asked about empty input", "Asked about loss rate denominator", "Explained gap detection approach", "Discussed streaming alternative"]
    }
  },

  scenario_f: {
    id: "scenario_f",
    label: "Scenario 6",
    title: "Out-of-Limits (OOL) Telemetry Alarm Monitor",
    icon: "🚨",
    difficulty: "Medium",
    tags: ["OOL", "Flight Safety", "Limit Bands"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hi, I'm Anh — Ground Software Engineer at Rocket Lab.\n\nThis one comes from our flight safety monitoring system. Every critical sensor on Electron — turbopump RPM, helium bottle pressure, battery temperature — has a dual-band alarm system:\n\n  Yellow Limits → WARNING  (operator alert, watch closely)\n  Red Limits    → CRITICAL (abort/cut-off threshold, flight safety risk)\n\nWe call any reading outside its nominal band an OOL event — Out-Of-Limits.\n\nI want you to write a function evaluate_telemetry_limits(telemetry_points, limit_table).\n\n  telemetry_points: list of dicts — {sensor, value, timestamp}\n  limit_table: dict of sensor → {yellow_low, yellow_high, red_low, red_high}\n\nReturn a list of alarm dicts for every OOL reading:\n  {sensor, value, severity ("WARNING" | "CRITICAL"), timestamp}\n\nCritical rule: Red checks must take precedence — if a reading violates both Red and Yellow, flag it as CRITICAL only.\n\nWhat questions do you have before you start?`,
    starterCode: `def evaluate_telemetry_limits(telemetry_points, limit_table):
    """
    Evaluates telemetry readings against warning (yellow) and critical (red) limit bands.

    Args:
        telemetry_points: List of dicts with sensor (str), value (float), timestamp (float)
        limit_table: Dict of sensor bounds:
            {"battery_temp_c": {"yellow_low": 15, "yellow_high": 45, "red_low": 5, "red_high": 55}}

    Returns:
        List of alarm dicts: sensor, value, severity ("WARNING" | "CRITICAL"), timestamp
    """
    # TODO: Implement OOL limit evaluation
    pass


# Test your implementation:
limits = {
    "pressure_psi": {"yellow_low": 2800, "yellow_high": 3200, "red_low": 2500, "red_high": 3500}
}
stream = [
    {"sensor": "pressure_psi", "value": 3000, "timestamp": 10.0},
    {"sensor": "pressure_psi", "value": 3300, "timestamp": 11.0},
    {"sensor": "pressure_psi", "value": 3600, "timestamp": 12.0},
]
result = evaluate_telemetry_limits(stream, limits)
print(result)`,
    testHarness: `import traceback

def run_tests():
    results = []

    limits = {
        "pressure_psi": {"yellow_low": 2800, "yellow_high": 3200, "red_low": 2500, "red_high": 3500}
    }

    # Test 1: Nominal + warning + critical + None value
    try:
        stream = [
            {"sensor": "pressure_psi", "value": 3000, "timestamp": 10.0},
            {"sensor": "pressure_psi", "value": 3300, "timestamp": 11.0},
            {"sensor": "pressure_psi", "value": 3600, "timestamp": 12.0},
            {"sensor": "pressure_psi", "value": None, "timestamp": 13.0}
        ]
        alarms = evaluate_telemetry_limits(stream, limits)
        assert len(alarms) == 2, f"Expected 2 alarms, got {len(alarms)}"
        assert alarms[0]["severity"] == "WARNING", f"3300 psi should be WARNING, got {alarms[0]['severity']}"
        assert alarms[1]["severity"] == "CRITICAL", f"3600 psi should be CRITICAL, got {alarms[1]['severity']}"
        results.append(("Test 1 (Nominal + WARNING + CRITICAL + None skipped)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Nominal + WARNING + CRITICAL + None skipped)", False, str(e)))

    # Test 2: Empty input guard
    try:
        assert evaluate_telemetry_limits([], limits) == [], "Empty points should return []"
        results.append(("Test 2 (Empty telemetry_points guard)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Empty telemetry_points guard)", False, str(e)))

    # Test 3: None limit_table guard
    try:
        stream = [{"sensor": "pressure_psi", "value": 3600, "timestamp": 1.0}]
        assert evaluate_telemetry_limits(stream, None) == [], "None limit_table should return []"
        results.append(("Test 3 (None limit_table guard)", True, ""))
    except Exception as e:
        results.append(("Test 3 (None limit_table guard)", False, str(e)))

    # Test 4: Red check takes precedence over Yellow
    try:
        stream = [{"sensor": "pressure_psi", "value": 2400, "timestamp": 5.0}]
        alarms = evaluate_telemetry_limits(stream, limits)
        assert len(alarms) == 1, f"Expected 1 alarm for 2400 psi"
        assert alarms[0]["severity"] == "CRITICAL", f"2400 is below red_low=2500, should be CRITICAL, got {alarms[0]['severity']}"
        results.append(("Test 4 (Red precedence over Yellow)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Red precedence over Yellow)", False, str(e)))

    # Test 5: Sensor not in limit_table is skipped
    try:
        stream = [{"sensor": "unknown_sensor", "value": 9999, "timestamp": 1.0}]
        alarms = evaluate_telemetry_limits(stream, limits)
        assert alarms == [], f"Unknown sensor should produce no alarms, got {alarms}"
        results.append(("Test 5 (Unknown sensor skipped)", True, ""))
    except Exception as e:
        results.append(("Test 5 (Unknown sensor skipped)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Solid. Real ops scenario: on Electron, the same sensor can spike into CRITICAL then immediately back to nominal within 200ms — it's called a transient spike, possibly just electrical noise. Flight rules say we only alert if a sensor is OOL for 3 or more consecutive readings. How would you modify this to add a consecutive-reading counter before raising the alarm?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'What if the limit_table has a sensor with only yellow limits defined but no red limits? Like a sensor where there's no hard abort threshold — just a warning band. How does your code handle missing red_low or red_high keys?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'Good. If this is running across 200 sensors at 50Hz each — that's 10,000 evaluations per second. Is there any optimization concern with repeatedly calling limits.get() with float defaults inside a hot loop?'",
        type: "performance"
      }
    ],
    hints: [
      "Guard at the top: if not telemetry_points or not limit_table, return [] immediately.",
      "Inside the loop: check isinstance(point, dict), use .get() for sensor/value/timestamp. If sensor not in limit_table or val is None, continue.",
      "Critical first! Check Red limits before Yellow. Use float('-inf') and float('inf') as .get() defaults for missing limit keys.",
      "Only append to alarms if severity is not None — nominal readings should be silent."
    ],
    evaluationRubric: {
      defensive: ["Guards empty telemetry_points", "Guards None/empty limit_table", "Skips None values", "Skips unknown sensors"],
      domain: ["Red (CRITICAL) checked before Yellow (WARNING)", "Uses float('-inf')/float('inf') defaults", "Correct alarm dict structure", "Addresses transient spike / hysteresis concern"],
      pythonic: ["Uses .get() for safe key access", "elif for severity hierarchy", "Clean loop structure", "Descriptive variable names"],
      communication: ["Asked about missing limit keys", "Asked about alarm format", "Explained severity precedence", "Discussed consecutive-reading hysteresis"]
    }
  },

  scenario_g: {
    id: "scenario_g",
    label: "Scenario 7",
    title: "Uplink Command ACK & Timeout Tracker",
    icon: "📡",
    difficulty: "Medium",
    tags: ["Command Uplink", "ACK Matching", "Timeout"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hi, I'm Anh — Ground Software Engineer at Rocket Lab. Good to see you.\n\nThis is about ground-to-spacecraft commanding. When our Mission Control software sends a command to Electron — arm the engine, deploy the payload, fire a pyrotechnic — it starts an internal timer. The spacecraft is supposed to downlink an ACK (acknowledgment) packet confirming it received and executed the command.\n\nIf the ACK doesn't arrive before the timeout expires, we flag a COMMAND_TIMEOUT. This is critical: a missed ACK on a pyrotechnic command during MECO or stage separation is a mission-ending event.\n\nI want you to write a function verify_command_acks(commands, acks).\n\n  commands: list of dicts — {cmd_id, sent_time, timeout_sec}\n  acks:     list of dicts — {cmd_id, ack_time, status ("OK" | "REJECTED")}\n\nReturn a dict keyed by cmd_id with one of three statuses:\n  "CONFIRMED" — ACK arrived within timeout_sec\n  "TIMEOUT"   — No ACK, or ACK arrived too late\n  "REJECTED"  — Spacecraft rejected the command\n\nBefore you start — what questions do you have about the matching logic, timing, or edge cases?`,
    starterCode: `def verify_command_acks(commands, acks):
    """
    Matches ground uplink commands against spacecraft downlink ACKs.

    Args:
        commands: List of dicts with cmd_id (str), sent_time (float), timeout_sec (float)
        acks:     List of dicts with cmd_id (str), ack_time (float), status ("OK" | "REJECTED")

    Returns:
        Dict keyed by cmd_id: "CONFIRMED", "TIMEOUT", or "REJECTED"
    """
    # TODO: Build ACK index, then match each command
    pass


# Test your implementation:
commands = [
    {"cmd_id": "CMD_001", "sent_time": 100.0, "timeout_sec": 5.0},
    {"cmd_id": "CMD_002", "sent_time": 200.0, "timeout_sec": 3.0},
    {"cmd_id": "CMD_003", "sent_time": 300.0, "timeout_sec": 5.0}
]
acks = [
    {"cmd_id": "CMD_001", "ack_time": 103.0, "status": "OK"},
    {"cmd_id": "CMD_002", "ack_time": 210.0, "status": "OK"},
    {"cmd_id": "CMD_003", "ack_time": 302.0, "status": "REJECTED"}
]
result = verify_command_acks(commands, acks)
print(result)`,
    testHarness: `import traceback

def run_tests():
    results = []

    commands = [
        {"cmd_id": "CMD_001", "sent_time": 100.0, "timeout_sec": 5.0},
        {"cmd_id": "CMD_002", "sent_time": 200.0, "timeout_sec": 3.0},
        {"cmd_id": "CMD_003", "sent_time": 300.0, "timeout_sec": 5.0},
        {"cmd_id": "CMD_004", "sent_time": 400.0, "timeout_sec": 5.0}
    ]
    acks = [
        {"cmd_id": "CMD_001", "ack_time": 103.0, "status": "OK"},
        {"cmd_id": "CMD_002", "ack_time": 210.0, "status": "OK"},
        {"cmd_id": "CMD_003", "ack_time": 302.0, "status": "REJECTED"}
        # CMD_004 has no ACK at all
    ]

    # Test 1: CONFIRMED within timeout
    try:
        res = verify_command_acks(commands, acks)
        assert res.get("CMD_001") == "CONFIRMED", f"CMD_001 ACK at 103 (within 5s) should be CONFIRMED, got {res.get('CMD_001')}"
        results.append(("Test 1 (CONFIRMED — ACK within timeout)", True, ""))
    except Exception as e:
        results.append(("Test 1 (CONFIRMED — ACK within timeout)", False, str(e)))

    # Test 2: TIMEOUT — ACK arrived late
    try:
        res = verify_command_acks(commands, acks)
        assert res.get("CMD_002") == "TIMEOUT", f"CMD_002 ACK at 210 (10s > 3s timeout) should be TIMEOUT, got {res.get('CMD_002')}"
        results.append(("Test 2 (TIMEOUT — late ACK)", True, ""))
    except Exception as e:
        results.append(("Test 2 (TIMEOUT — late ACK)", False, str(e)))

    # Test 3: REJECTED
    try:
        res = verify_command_acks(commands, acks)
        assert res.get("CMD_003") == "REJECTED", f"CMD_003 status REJECTED should be REJECTED, got {res.get('CMD_003')}"
        results.append(("Test 3 (REJECTED — spacecraft rejected command)", True, ""))
    except Exception as e:
        results.append(("Test 3 (REJECTED — spacecraft rejected command)", False, str(e)))

    # Test 4: TIMEOUT — no ACK at all
    try:
        res = verify_command_acks(commands, acks)
        assert res.get("CMD_004") == "TIMEOUT", f"CMD_004 has no ACK, should be TIMEOUT, got {res.get('CMD_004')}"
        results.append(("Test 4 (TIMEOUT — no ACK received)", True, ""))
    except Exception as e:
        results.append(("Test 4 (TIMEOUT — no ACK received)", False, str(e)))

    # Test 5: Empty commands returns {}
    try:
        res = verify_command_acks([], acks)
        assert res == {}, f"Empty commands should return {{}}, got {res}"
        results.append(("Test 5 (Empty commands guard)", True, ""))
    except Exception as e:
        results.append(("Test 5 (Empty commands guard)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Good. Real mission ops wrinkle: the spacecraft can send multiple ACKs for a single command — first an 'Accepted' ACK confirming receipt, then an 'Executed' ACK confirming execution. A REJECTED on the Executed ACK means it accepted but failed mid-execution — very different from a REJECTED on receipt. How would you handle multiple ACKs per cmd_id, and which one should determine the final status?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'Quick check — what if acks is None instead of an empty list? The caller might not pass it at all. Does your ACK index loop handle that safely?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'Good. In a real mission, we're tracking thousands of commands across a 12-minute pass. Your dict lookup is O(1) — what's the overall time complexity of your full function, and is there any structure that would make it worse?'",
        type: "performance"
      }
    ],
    hints: [
      "Step 1: Build an ACK index first — a dict keyed by cmd_id. Loop over (acks or []) and check isinstance(a, dict) and 'cmd_id' in a.",
      "Step 2: Loop over commands. Use .get() to extract cmd_id, sent_time, timeout_sec (default 5.0). Skip if cmd_id is missing.",
      "Step 3: If cmd_id not in ack_map, status = 'TIMEOUT'. If found, check status == 'REJECTED' first. Then compare ack_time - sent_time <= timeout_sec.",
      "Edge: what if acks is None? Use (acks or []) in your loop — that safely handles None and empty list."
    ],
    evaluationRubric: {
      defensive: ["Guards empty commands → returns {}", "Handles None acks safely with (acks or [])", "Skips non-dict commands", "Handles missing cmd_id or sent_time"],
      domain: ["Builds O(1) ACK lookup dict", "REJECTED checked before TIMEOUT", "Correct timeout comparison: ack_time - sent_time <= timeout_sec", "Addresses multiple-ACK-per-command concern"],
      pythonic: ["Uses (acks or []) idiom", "Dict for O(1) lookup", "Clean .get() with defaults", "Clear status string constants"],
      communication: ["Asked about acks=None edge case", "Asked about REJECTED vs TIMEOUT precedence", "Explained indexing strategy", "Discussed multiple ACKs per command"]
    }
  },

  scenario_d: {
    id: "scenario_d",
    label: "Scenario 4",
    title: "Flight State Machine Sequence Validation",
    icon: "🛰️",
    difficulty: "Medium",
    tags: ["State Machine", "Validation", "Dict Mapping"],
    interviewer: "Anh Thai",
    interviewerRole: "Ground Software Engineer",
    openingPrompt: `Hi, I'm Anh. Good to have you in.\n\nThis is about mission state validation — operators at ground control track the rocket through mission stages. The valid sequence is:\n\n  PRE_LAUNCH → BOOST → STAGE_SEP → COAST → PAYLOAD_DEPLOY → MISSION_COMPLETE\n\nTelemetry packets arrive reporting state transitions, but they can be corrupted or out of order. We need to detect illegal transitions.\n\nWrite a function validate_sequence(events) that takes a list of state-change event strings and returns:\n  - {"valid": True, "final_state": "..."} if all transitions are legal\n  - {"valid": False, "error": "Invalid transition from X to Y at index N"} on the first illegal transition\n\nThe first event must be "PRE_LAUNCH". Any other starting state is invalid.\n\nWhat questions do you have before you start coding?`,
    starterCode: `def validate_sequence(events):
    """
    Validate a sequence of flight state transition events.
    
    Valid transitions:
        PRE_LAUNCH -> BOOST
        BOOST -> STAGE_SEP
        STAGE_SEP -> COAST
        COAST -> PAYLOAD_DEPLOY
        PAYLOAD_DEPLOY -> MISSION_COMPLETE
    
    Args:
        events: List of state name strings
    
    Returns:
        {"valid": True, "final_state": "..."} on success
        {"valid": False, "error": "..."} on first illegal transition
    """
    # TODO: Implement state machine validation
    pass


# Test your implementation:
print(validate_sequence(["PRE_LAUNCH", "BOOST", "STAGE_SEP"]))
print(validate_sequence(["PRE_LAUNCH", "STAGE_SEP"]))  # Invalid!
print(validate_sequence(["BOOST", "STAGE_SEP"]))        # Invalid start!`,
    testHarness: `def run_tests():
    results = []

    # Test 1: Valid full sequence
    try:
        events = ["PRE_LAUNCH", "BOOST", "STAGE_SEP", "COAST", "PAYLOAD_DEPLOY", "MISSION_COMPLETE"]
        result = validate_sequence(events)
        assert result["valid"] == True, f"Full valid sequence should pass, got {result}"
        assert result["final_state"] == "MISSION_COMPLETE"
        results.append(("Test 1 (Valid full sequence)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Valid full sequence)", False, str(e)))

    # Test 2: Invalid transition mid-sequence
    try:
        events = ["PRE_LAUNCH", "BOOST", "PAYLOAD_DEPLOY"]
        result = validate_sequence(events)
        assert result["valid"] == False, "BOOST -> PAYLOAD_DEPLOY is invalid"
        assert "2" in result["error"] or "index" in result["error"].lower(), "Should mention index of failure"
        results.append(("Test 2 (Invalid transition detected)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Invalid transition detected)", False, str(e)))

    # Test 3: Invalid starting state
    try:
        events = ["BOOST", "STAGE_SEP"]
        result = validate_sequence(events)
        assert result["valid"] == False, "Must start with PRE_LAUNCH"
        results.append(("Test 3 (Invalid starting state)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Invalid starting state)", False, str(e)))

    # Test 4: Empty event list
    try:
        result = validate_sequence([])
        assert result["valid"] == False or isinstance(result, dict), "Empty list should be handled"
        results.append(("Test 4 (Empty event list)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Empty event list)", False, str(e)))

    # Test 5: Unknown state name
    try:
        events = ["PRE_LAUNCH", "BOOST", "WARP_DRIVE"]
        result = validate_sequence(events)
        assert result["valid"] == False, "Unknown state should be invalid"
        results.append(("Test 5 (Unknown state name)", True, ""))
    except Exception as e:
        results.append(("Test 5 (Unknown state name)", False, str(e)))

    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Good. Real scenario: telemetry packets sometimes arrive out of order due to network jitter. The vehicle actually went PRE_LAUNCH → BOOST → STAGE_SEP, but the packets arrive as PRE_LAUNCH → STAGE_SEP → BOOST. How would you handle reordering? Each event has a monotonic sequence number — how would you buffer and sort before validation?",
    interruptions: [
      {
        triggerMinute: 10,
        message: "Anh: 'Quick check — what happens if an event string has trailing whitespace or different casing? Like \"pre_launch\" instead of \"PRE_LAUNCH\"?'",
        type: "edge-case"
      },
      {
        triggerMinute: 18,
        message: "Anh: 'That works for our sample data. If we extend this to handle branching states — like STAGE_SEP can go to either COAST or ABORT — how would you modify the transition map?'",
        type: "performance"
      }
    ],
    hints: [
      "Define a dictionary mapping each state to its allowed next state(s): VALID_TRANSITIONS = {'PRE_LAUNCH': ['BOOST'], 'BOOST': ['STAGE_SEP'], ...}",
      "First check: if the list is empty or events[0] != 'PRE_LAUNCH', return invalid immediately.",
      "Loop from index 1: check if events[i] is in VALID_TRANSITIONS.get(events[i-1], []). If not, return the error with the index.",
      "Don't forget: what if a state name isn't in your transitions dict at all? .get() with a default empty list handles that."
    ],
    evaluationRubric: {
      defensive: ["Handles empty event list", "Handles invalid start state", "Handles unknown state names", "Returns error with index info"],
      domain: ["Correct transition map structure", "Validates first event", "Detects invalid transitions", "Addresses out-of-order events concern"],
      pythonic: ["Uses dict for transition map", "Uses .get() with default", "Clean loop structure", "Descriptive error messages"],
      communication: ["Asked about valid transitions", "Asked about error format", "Explained state machine concept", "Discussed branching states"]
    }
  }
};

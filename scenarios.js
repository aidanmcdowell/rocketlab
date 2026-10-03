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

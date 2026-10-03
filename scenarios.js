const SCENARIOS = {
  scenario_a: {
    id: "scenario_a",
    label: "Scenario A",
    title: "Telemetry Stream Aggregation & Outlier Detection",
    icon: "📡",
    difficulty: "Medium",
    tags: ["Rolling Window", "Statistics", "Streaming"],
    openingPrompt: `Hi, great to finally meet you. I'm Marcus — Lead Ground Software Engineer here at Rocket Lab. Thanks for coming in.\n\nWe'll be working through a problem directly relevant to our satellite pass processing pipeline. I want you to write a Python function called process_telemetry(packets, thresholds).\n\nContext: our ground stations receive batches of raw sensor packets — voltage, temperature, pressure — from the vehicle during a pass:\n\n  packets = [\n    {'subsystem': 'battery', 'value': 28.2, 'status': 'OK'},\n    {'subsystem': 'battery', 'value': None, 'status': 'ERROR'},\n    {'subsystem': 'battery', 'value': 34.5, 'status': 'OK'},\n    {'subsystem': 'avionics', 'value': 12.0, 'status': 'OK'}\n  ]\n  thresholds = {'battery': 30.0, 'avionics': 15.0}\n\nYour function should: filter out corrupted packets, calculate the rolling max and average per subsystem, and flag any subsystem where any reading exceeds its safe threshold.\n\nBefore you start typing — take a moment. What questions do you have about the input, the output format, or the edge cases I'd want handled?`,
    starterCode: `def process_telemetry(packets, thresholds):
    """
    Process telemetry packets from ground station receiver.
    
    Args:
        packets: List of dicts with keys: subsystem, value, status
        thresholds: Dict mapping subsystem name to max safe value
    
    Returns:
        Dict keyed by subsystem with: max, avg, alert, count
    """
    # TODO: Implement parsing, filtering, and metric calculation
    pass


# Test your implementation:
test_data = [
    {'subsystem': 'battery', 'value': 28.2, 'status': 'OK'},
    {'subsystem': 'battery', 'value': None, 'status': 'ERROR'},
    {'subsystem': 'battery', 'value': 34.5, 'status': 'OK'},
    {'subsystem': 'avionics', 'value': 12.0, 'status': 'OK'}
]
thresholds = {'battery': 30.0, 'avionics': 15.0}
result = process_telemetry(test_data, thresholds)
print(result)`,
    testHarness: `import traceback

def run_tests():
    results = []
    try:
        packets = [
            {'subsystem': 'battery', 'value': 28.2, 'status': 'OK'},
            {'subsystem': 'battery', 'value': None, 'status': 'ERROR'},
            {'subsystem': 'battery', 'value': 34.5, 'status': 'OK'},
            {'subsystem': 'avionics', 'value': 12.0, 'status': 'OK'}
        ]
        thresholds = {'battery': 30.0, 'avionics': 15.0}
        res = process_telemetry(packets, thresholds)
        assert res['battery']['max'] == 34.5
        assert abs(res['battery']['avg'] - 31.35) < 0.01
        assert res['battery']['alert'] == True
        assert res['avionics']['alert'] == False
        results.append(("Test 1 (Basic filtering & metrics)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Basic filtering & metrics)", False, str(e)))
    try:
        packets = [{'subsystem': 'battery', 'value': None, 'status': 'ERROR'}]
        res = process_telemetry(packets, {'battery': 30.0})
        assert res.get('battery', {}).get('count', 0) == 0 or 'battery' not in res
        results.append(("Test 2 (All-corrupt packets)", True, ""))
    except Exception as e:
        results.append(("Test 2 (All-corrupt packets)", False, str(e)))
    try:
        packets = [{'subsystem': 'thruster', 'value': 99.9, 'status': 'OK'}]
        res = process_telemetry(packets, {'battery': 30.0})
        results.append(("Test 3 (Unknown subsystem)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Unknown subsystem)", False, str(e)))
    try:
        res = process_telemetry([], {})
        assert isinstance(res, dict)
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
    curveball: "Nice. That passes the baseline suite. Real-world constraint: this data is now streaming at 50,000 packets per second over a 12-minute orbital pass. Memory usage — if you're storing all packets in a list before processing, what happens after 36 million entries? How would you restructure this so memory stays constant regardless of pass duration?",
    hints: [
      "Before the loop — what does the output structure need to look like? If I call result['battery']['max'], what type should result be?",
      "Corrupted packets: what two things can make a packet invalid? The status field and the value field. How do you safely check both without a KeyError?",
      "Start with: for packet in packets: — filter out anything where status != 'OK' or value is None. Get that working before aggregation.",
      "For rolling max and avg: you don't need to store all values. Just running sum, count, and current max. Three variables per subsystem."
    ],
    evaluationRubric: {
      defensive: ["Handles None values", "Handles missing keys with .get()", "Handles empty packet list", "Handles unknown subsystems"],
      domain: ["Groups by subsystem", "Computes max and avg correctly", "Flags threshold violations", "Addresses streaming/memory concern"],
      pythonic: ["Uses .get() for safe key access", "List comprehension or dict grouping", "No unnecessary nested loops", "Clean function signature"],
      communication: ["Asked about output format", "Asked about error handling", "Explained approach before coding", "Talked through logic during implementation"]
    }
  },
  scenario_b: {
    id: "scenario_b",
    label: "Scenario B",
    title: "Binary Telemetry Frame Unpacking",
    icon: "🔢",
    difficulty: "Hard",
    tags: ["struct", "Binary Protocol", "UDP"],
    openingPrompt: `Good to meet you. I'm Marcus, Ground Software lead at Rocket Lab.\n\nToday is about binary telemetry parsing — we deal with this constantly on the ground side. Our spacecraft downlinks raw binary frames over UDP — we avoid JSON to minimize bandwidth during a pass.\n\nEach frame layout (11 bytes total):\n  Bytes 0-1:  Sync header (must equal 0xDEAD, big-endian)\n  Bytes 2-5:  Timestamp (4-byte big-endian uint32, seconds since epoch)\n  Bytes 6-7:  Sensor value 1 (16-bit big-endian signed int)\n  Bytes 8-9:  Sensor value 2 (16-bit big-endian signed int)\n  Byte 10:    Checksum (XOR of bytes 0-9)\n\nYour task: write decode_frame(raw_bytes) — validate the sync header, unpack the fields, verify the checksum, and return a dict. Return None if the frame is invalid.\n\nWhat are your first questions?`,
    starterCode: `import struct

def decode_frame(raw_bytes):
    """
    Decode a binary telemetry frame from spacecraft downlink.
    
    Frame layout (11 bytes total):
      [0:2]  - Sync header: 0xDEAD (big-endian uint16)
      [2:6]  - Timestamp: big-endian uint32 (seconds since epoch)
      [6:8]  - Sensor 1: big-endian int16
      [8:10] - Sensor 2: big-endian int16
      [10]   - Checksum: XOR of bytes 0-9
    
    Returns dict on success, None on invalid frame.
    """
    # TODO: Implement frame decoding
    pass


# Build a test frame to verify:
import struct
payload = struct.pack('>HIhh', 0xDEAD, 1727654400, 1234, -50)
checksum = 0
for b in payload:
    checksum ^= b
test_frame = payload + bytes([checksum])
print(f"Test frame hex: {test_frame.hex()}")
result = decode_frame(test_frame)
print(f"Decoded: {result}")`,
    testHarness: `import struct

def make_frame(sync, timestamp, s1, s2, corrupt_checksum=False):
    payload = struct.pack('>HIhh', sync, timestamp, s1, s2)
    checksum = 0
    for b in payload:
        checksum ^= b
    if corrupt_checksum:
        checksum ^= 0xFF
    return payload + bytes([checksum])

def run_tests():
    results = []
    try:
        frame = make_frame(0xDEAD, 1727654400, 1234, -50)
        result = decode_frame(frame)
        assert result is not None
        assert result['timestamp'] == 1727654400
        assert result['sensor1'] == 1234
        assert result['sensor2'] == -50
        results.append(("Test 1 (Valid frame decode)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Valid frame decode)", False, str(e)))
    try:
        frame = make_frame(0xBEEF, 1727654400, 100, 200)
        result = decode_frame(frame)
        assert result is None
        results.append(("Test 2 (Bad sync header)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Bad sync header)", False, str(e)))
    try:
        frame = make_frame(0xDEAD, 1727654400, 500, 300, corrupt_checksum=True)
        result = decode_frame(frame)
        assert result is None
        results.append(("Test 3 (Corrupted checksum)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Corrupted checksum)", False, str(e)))
    try:
        frame = bytes([0xDE, 0xAD, 0x00])
        result = decode_frame(frame)
        assert result is None
        results.append(("Test 4 (Truncated frame)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Truncated frame)", False, str(e)))
    try:
        result = decode_frame(b'')
        assert result is None
        results.append(("Test 5 (Empty input)", True, ""))
    except Exception as e:
        results.append(("Test 5 (Empty input)", False, str(e)))
    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))

passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Good. Field scenario: UDP datagrams sometimes arrive fragmented. Your decode_frame receives 5 bytes in one call, then 6 bytes in the next — partial frames. How do you modify the system to handle split frames across chunk boundaries? Think about a reassembly buffer.",
    hints: [
      "What does struct.unpack need? A format string and bytes. The '>' prefix means big-endian. What format characters cover uint16, uint32, and signed int16?",
      "Check frame length before unpacking — if len(raw_bytes) < 11, return None immediately. That's your first guard.",
      "For the checksum: XOR all bytes 0 through 9, compare to byte 10. A simple loop works: checksum = 0; for b in raw_bytes[:10]: checksum ^= b",
      "Build the struct format: '>HIhh' — big-endian, unsigned short (sync), unsigned int (timestamp), signed short x2 (sensors)."
    ],
    evaluationRubric: {
      defensive: ["Checks frame length before unpacking", "Validates sync header == 0xDEAD", "Verifies checksum byte", "Returns None on any invalid condition"],
      domain: ["Uses struct.unpack correctly", "Handles big-endian byte order", "Understands XOR checksum", "Addresses partial frame reassembly"],
      pythonic: ["Appropriate use of struct format strings", "Concise checksum computation", "Clear variable naming for byte fields", "Exception handling around struct.unpack"],
      communication: ["Asked about frame length guarantee", "Asked about error return format", "Explained byte order reasoning", "Described checksum algorithm before implementing"]
    }
  },
  scenario_c: {
    id: "scenario_c",
    label: "Scenario C",
    title: "Async Command & Telemetry Queue",
    icon: "⚡",
    difficulty: "Hard",
    tags: ["asyncio", "Priority Queue", "Concurrency"],
    openingPrompt: `Hey, I'm Marcus. Let's get into it.\n\nThis is about concurrent ground-to-vehicle communication — something our mission control software handles constantly during a live pass.\n\nYou need to implement an async command dispatcher using Python's asyncio. Ground software must simultaneously receive live telemetry while dispatching commands to the vehicle through a simulated socket.\n\nCommands arrive in a priority queue:\n  Priority 0: CRITICAL_ABORT — must go out immediately\n  Priority 1: HIGH_PRIORITY\n  Priority 2: ROUTINE_PING\n\nThe simulated socket is just an async function that can timeout. Your dispatcher should:\n  1. Pull commands from the queue in priority order\n  2. Retry up to 3 times with exponential backoff on timeout\n  3. Log each send attempt\n\nWhat questions do you have before you start?`,
    starterCode: `import asyncio
import heapq
import time

# Simulated socket - randomly times out
async def simulated_socket_send(command: str) -> bool:
    """Returns True on success, raises asyncio.TimeoutError on failure."""
    import random
    await asyncio.sleep(random.uniform(0.01, 0.05))
    if random.random() < 0.3:  # 30% failure rate
        raise asyncio.TimeoutError(f"Socket timeout sending {command}")
    return True

class CommandDispatcher:
    def __init__(self):
        self.queue = []  # Priority queue: (priority, timestamp, command)
        self.sent = []
        self.failed = []
    
    def enqueue(self, priority: int, command: str):
        """Add a command to the priority queue."""
        # TODO: Implement
        pass
    
    async def dispatch_one(self, command: str, max_retries: int = 3) -> bool:
        """Send a single command with retry/backoff logic."""
        # TODO: Implement exponential backoff retry
        pass
    
    async def run(self, duration_seconds: float = 2.0):
        """Process queue for given duration."""
        # TODO: Drain the priority queue, dispatch commands
        pass


# Test scaffold:
async def main():
    dispatcher = CommandDispatcher()
    dispatcher.enqueue(2, "ROUTINE_PING")
    dispatcher.enqueue(0, "CRITICAL_ABORT")
    dispatcher.enqueue(1, "HIGH_PRIORITY_UPLINK")
    dispatcher.enqueue(2, "ROUTINE_PING_2")
    
    await dispatcher.run(duration_seconds=5.0)
    print(f"Sent: {dispatcher.sent}")
    print(f"Failed: {dispatcher.failed}")

asyncio.run(main())`,
    testHarness: `import asyncio
import heapq

async def run_tests():
    results = []
    try:
        dispatcher = CommandDispatcher()
        dispatcher.enqueue(2, "LOW")
        dispatcher.enqueue(0, "CRITICAL")
        dispatcher.enqueue(1, "HIGH")
        order = []
        while dispatcher.queue:
            priority, ts, cmd = heapq.heappop(dispatcher.queue)
            order.append((priority, cmd))
        assert order[0][1] == "CRITICAL", f"CRITICAL should be first, got {order[0][1]}"
        assert order[1][1] == "HIGH", f"HIGH should be second, got {order[1][1]}"
        results.append(("Test 1 (Priority ordering)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Priority ordering)", False, str(e)))
    try:
        attempt_count = [0]
        async def counting_fail(cmd):
            attempt_count[0] += 1
            raise asyncio.TimeoutError("Test timeout")
        global simulated_socket_send
        old_socket = simulated_socket_send
        simulated_socket_send = counting_fail
        dispatcher2 = CommandDispatcher()
        dispatcher2.enqueue(0, "TEST_CMD")
        await dispatcher2.run(duration_seconds=2.0)
        simulated_socket_send = old_socket
        assert "TEST_CMD" in dispatcher2.failed, "Failed command should be logged"
        results.append(("Test 2 (Retry + failure logging)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Retry + failure logging)", False, str(e)))
    try:
        async def always_succeed(cmd):
            return True
        global simulated_socket_send
        old_socket = simulated_socket_send
        simulated_socket_send = always_succeed
        dispatcher3 = CommandDispatcher()
        dispatcher3.enqueue(0, "SUCCESS_CMD")
        await dispatcher3.run(duration_seconds=1.0)
        simulated_socket_send = old_socket
        assert "SUCCESS_CMD" in dispatcher3.sent
        results.append(("Test 3 (Success logging)", True, ""))
    except Exception as e:
        results.append(("Test 3 (Success logging)", False, str(e)))
    return results

test_results = asyncio.run(run_tests())
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))
passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Solid. Wrinkle: the queue gets flooded — 500 commands backed up during an outage. When the socket recovers, we can't blast all 500 at once or we'll saturate the RF uplink. How do you add rate limiting — max 10 commands per second — without blocking telemetry ingestion on a concurrent async task?",
    hints: [
      "Start with enqueue: heapq.heappush(self.queue, (priority, time.time(), command)). Why include the timestamp? Tie-breaking when two commands share the same priority.",
      "For dispatch_one: for attempt in range(max_retries): — try await simulated_socket_send(command). Catch asyncio.TimeoutError. On failure, wait 2**attempt seconds before retrying.",
      "Your run method: while self.queue and time.time() < deadline: — pop from the heap, dispatch, continue. asyncio.sleep(0) inside the loop yields control to other coroutines.",
      "Exponential backoff: await asyncio.sleep(2 ** attempt) — attempt 0 waits 1s, attempt 1 waits 2s, attempt 2 waits 4s."
    ],
    evaluationRubric: {
      defensive: ["Handles TimeoutError gracefully", "Logs failed commands after max retries", "Handles empty queue gracefully", "Uses try/except around async socket call"],
      domain: ["Uses heapq for priority ordering", "Implements exponential backoff", "Uses asyncio correctly", "Addresses rate limiting concern"],
      pythonic: ["Uses heapq.heappush/heappop correctly", "Async/await syntax clean", "Avoids blocking calls inside async context", "Clear separation of enqueue/dispatch/run"],
      communication: ["Asked about retry count", "Asked about priority tie-breaking", "Explained backoff strategy before coding", "Discussed rate limiting tradeoffs"]
    }
  },
  scenario_d: {
    id: "scenario_d",
    label: "Scenario D",
    title: "Missing-Data Forward Fill & State Snapshot",
    icon: "🛰️",
    difficulty: "Medium",
    tags: ["Data Merging", "Forward Fill", "State Machine"],
    openingPrompt: `Hi, I'm Marcus. Good to have you in.\n\nThis is about mission state reconstruction — operators need the complete spacecraft state at any given second, even if subsystems transmit at different rates.\n\nWe have two data streams:\n  battery_stream: transmits every 1 second\n  attitude_stream: transmits every 5 seconds\n\nWe need build_snapshot(battery_stream, attitude_stream, duration) to merge these into a unified per-second state table.\n\nInput format:\n  battery_stream = [(0, 28.0), (1, 28.1), (2, 28.3), ...]  # (second, value)\n  attitude_stream = [(0, 0.5), (5, 0.7), (10, 0.9), ...]   # (second, value)\n\nOutput: list of dicts: [{'second': 0, 'battery': 28.0, 'attitude': 0.5}, ...]\n\nIf a subsystem hasn't sent a new reading, hold the last known value (forward-fill). If a sensor silently stops transmitting, hold its last known value until the end.\n\nWhat do you want to clarify before you code?`,
    starterCode: `def build_snapshot(battery_stream, attitude_stream, duration):
    """
    Merge multi-rate telemetry streams into unified per-second snapshots.
    
    Args:
        battery_stream: List of (second, value) tuples, 1Hz
        attitude_stream: List of (second, value) tuples, 0.2Hz (every 5s)
        duration: Total snapshot duration in seconds
    
    Returns:
        List of dicts: [{'second': t, 'battery': v, 'attitude': v}, ...]
        Forward-fill missing values from last known reading.
        Seconds before first reading should have None for that subsystem.
    """
    # TODO: Implement forward-fill merge
    pass


# Test your implementation:
battery = [(0, 28.0), (1, 28.1), (2, 28.3), (3, 28.2), (4, 28.4)]
attitude = [(0, 0.5), (5, 0.7)]

result = build_snapshot(battery, attitude, duration=10)
for row in result:
    print(row)`,
    testHarness: `def run_tests():
    results = []
    try:
        battery = [(0, 28.0), (1, 28.5), (2, 29.0)]
        attitude = [(0, 0.5), (5, 0.7)]
        result = build_snapshot(battery, attitude, duration=6)
        assert len(result) == 6
        assert result[0]['battery'] == 28.0
        assert result[0]['attitude'] == 0.5
        assert result[3]['attitude'] == 0.5
        assert result[5]['attitude'] == 0.7
        results.append(("Test 1 (Basic forward fill)", True, ""))
    except Exception as e:
        results.append(("Test 1 (Basic forward fill)", False, str(e)))
    try:
        battery = [(0, 28.0), (1, 28.1)]
        attitude = [(0, 0.5)]
        result = build_snapshot(battery, attitude, duration=5)
        assert result[4]['battery'] == 28.1
        results.append(("Test 2 (Silent sensor forward-fill)", True, ""))
    except Exception as e:
        results.append(("Test 2 (Silent sensor forward-fill)", False, str(e)))
    try:
        battery = [(2, 28.0)]
        attitude = [(0, 0.5)]
        result = build_snapshot(battery, attitude, duration=5)
        assert result[0].get('battery') is None
        assert result[2]['battery'] == 28.0
        results.append(("Test 3 (None before first reading)", True, ""))
    except Exception as e:
        results.append(("Test 3 (None before first reading)", False, str(e)))
    try:
        result = build_snapshot([], [], duration=3)
        assert len(result) == 3
        assert all(r.get('battery') is None for r in result)
        results.append(("Test 4 (Empty streams)", True, ""))
    except Exception as e:
        results.append(("Test 4 (Empty streams)", False, str(e)))
    return results

test_results = run_tests()
for name, passed, msg in test_results:
    icon = "PASS" if passed else "FAIL"
    print(f"[{icon}] {name}" + (f": {msg}" if msg else ""))
passed_count = sum(1 for _, p, _ in test_results if p)
print(f"\\nSCORE: {passed_count}/{len(test_results)} tests passed")
if passed_count == len(test_results):
    print("ALL_TESTS_PASSED")`,
    curveball: "Good. Hard part: the attitude sensor silently stops at t=47s, but we get no disconnect packet — it just goes quiet. Operators are reading the forward-filled t=45 value and trusting it. How do you add a staleness threshold — mark a value STALE if it hasn't updated in more than 10 seconds — without changing the return format for valid data?",
    hints: [
      "First, convert each stream into a dict keyed by second for O(1) lookup: {t: v for t, v in battery_stream}. Then iterate for t in range(duration):",
      "Track two 'last seen' variables initialized to None. At each second t, check if t is in the battery dict; if so, update last_battery. Then append the row.",
      "Classic forward-fill: last_battery = battery_lookup.get(t, last_battery) — one line handles both update and hold.",
      "For staleness: also track last_battery_time. When appending, check if t - last_battery_time > threshold and mark accordingly. Discuss the tradeoff before changing return type."
    ],
    evaluationRubric: {
      defensive: ["Handles empty streams", "Handles None before first reading", "Handles sensors that stop mid-mission", "Handles streams with missing seconds"],
      domain: ["Correct forward-fill logic", "Correct per-second iteration", "Addresses staleness concern", "Understands multi-rate sensor fusion"],
      pythonic: ["Uses dict lookup for O(1) stream access", "Single-pass iteration", "Clean variable naming", "Efficient memory usage"],
      communication: ["Asked about behavior before first reading", "Asked about staleness handling", "Explained forward-fill concept verbally", "Discussed tradeoffs of stale data"]
    }
  }
};

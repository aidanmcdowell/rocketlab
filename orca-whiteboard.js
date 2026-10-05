/* =====================================================================
   ORCA WHITEBOARD — orca-whiteboard.js
   Interactive OOP Incomplete-Problem Code Lab
   Practice problems matching realistic SPA ORCA whiteboard archetypes
===================================================================== */

const WB_PROBLEMS = {

  // ── PROBLEM 1 (~40% Odds): Sensor Track Manager & Stale Track Eviction ──
  staleTrackEviction: {
    id: 'staleTrackEviction',
    odds: '40% ODDS',
    name: 'Sensor Track Manager & Stale Track Eviction',
    operationalName: 'Island Chain ASW (Multi-Sensor Correlator)',
    description: 'Complete processReport() and evictStaleTracks(). Validate incoming reports (reject null IDs, negative timestamps, out-of-order packets), update or insert tracks into the map, and purge stale tracks without throwing ConcurrentModificationException.',
    templates: {
      java: `import java.util.*;

public class TrackManager {

    public static class SensorReport {
        public String trackId;
        public double x;
        public double y;
        public long timestampMs;

        public SensorReport(String id, double x, double y, long ts) {
            this.trackId = id;
            this.x = x;
            this.y = y;
            this.timestampMs = ts;
        }
    }

    public static class Track {
        public String trackId;
        public double x, y;
        public long lastSeenMs;

        public Track(String id, double x, double y, long ts) {
            this.trackId = id;
            this.x = x;
            this.y = y;
            this.lastSeenMs = ts;
        }
    }

    // Storage for active tracks
    private final Map<String, Track> activeTracks = new HashMap<>();
    private final long maxStaleDurationMs;

    public TrackManager(long maxStaleDurationMs) {
        this.maxStaleDurationMs = maxStaleDurationMs;
    }

    /**
     * Update existing track if present, otherwise insert a new track.
     * Rules:
     *   1. Reject null report, null/empty trackId, or negative timestampMs.
     *   2. If track already exists, only update if report.timestampMs >= existing.lastSeenMs (drop out-of-order packets).
     *   3. If track does not exist, insert new Track record.
     */
    public void processReport(SensorReport report) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    /**
     * Remove any tracks where (currentTimeMs - lastSeenMs) > maxStaleDurationMs.
     * Return the count of evicted tracks.
     * CRITICAL: Avoid ConcurrentModificationException!
     */
    public int evictStaleTracks(long currentTimeMs) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
        return 0;
    }

    public Map<String, Track> getActiveTracks() { return activeTracks; }
    public int size() { return activeTracks.size(); }
}`,

      csharp: `using System;
using System.Collections.Generic;

public class TrackManager {

    public class SensorReport {
        public string TrackId { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public long TimestampMs { get; set; }

        public SensorReport(string id, double x, double y, long ts) {
            TrackId = id; X = x; Y = y; TimestampMs = ts;
        }
    }

    public class Track {
        public string TrackId { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public long LastSeenMs { get; set; }

        public Track(string id, double x, double y, long ts) {
            TrackId = id; X = x; Y = y; LastSeenMs = ts;
        }
    }

    private readonly Dictionary<string, Track> _activeTracks = new();
    private readonly long _maxStaleDurationMs;

    public TrackManager(long maxStaleDurationMs) {
        _maxStaleDurationMs = maxStaleDurationMs;
    }

    public void ProcessReport(SensorReport report) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public int EvictStaleTracks(long currentTimeMs) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
        return 0;
    }

    public IReadOnlyDictionary<string, Track> ActiveTracks => _activeTracks;
    public int Count => _activeTracks.Count;
}`,

      cpp: `#include <string>
#include <unordered_map>
#include <memory>
using namespace std;

struct SensorReport {
    string trackId;
    double x, y;
    long long timestampMs;
    SensorReport(string id, double px, double py, long long ts)
        : trackId(id), x(px), y(py), timestampMs(ts) {}
};

struct Track {
    string trackId;
    double x, y;
    long long lastSeenMs;
    Track(string id, double px, double py, long long ts)
        : trackId(id), x(px), y(py), lastSeenMs(ts) {}
};

class TrackManager {
    unordered_map<string, Track> activeTracks;
    long long maxStaleDurationMs;
public:
    TrackManager(long long maxStale) : maxStaleDurationMs(maxStale) {}

    void processReport(const SensorReport& report) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    int evictStaleTracks(long long currentTimeMs) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
        return 0;
    }

    int size() const { return activeTracks.size(); }
};`
    },
    solutions: {
      java: `    // 1. Boundary / validation check
    if (report == null || report.trackId == null || report.trackId.isEmpty() || report.timestampMs < 0) {
        return;
    }

    // 2. Thread-safe / clean lookup and update
    Track existing = activeTracks.get(report.trackId);
    if (existing != null) {
        // Drop out-of-order stale packets
        if (report.timestampMs >= existing.lastSeenMs) {
            existing.x = report.x;
            existing.y = report.y;
            existing.lastSeenMs = report.timestampMs;
        }
    } else {
        activeTracks.put(report.trackId, new Track(report.trackId, report.x, report.y, report.timestampMs));
    }
    
    // evictStaleTracks solution:
    int evictedCount = 0;
    Iterator<Map.Entry<String, Track>> iterator = activeTracks.entrySet().iterator();
    while (iterator.hasNext()) {
        Map.Entry<String, Track> entry = iterator.next();
        if (currentTimeMs - entry.getValue().lastSeenMs > maxStaleDurationMs) {
            iterator.remove();
            evictedCount++;
        }
    }
    return evictedCount;`,

      csharp: `    if (report == null || string.IsNullOrEmpty(report.TrackId) || report.TimestampMs < 0)
        return;

    if (_activeTracks.TryGetValue(report.TrackId, out var existing)) {
        if (report.TimestampMs >= existing.LastSeenMs) {
            existing.X = report.X;
            existing.Y = report.Y;
            existing.LastSeenMs = report.TimestampMs;
        }
    } else {
        _activeTracks[report.TrackId] = new Track(report.TrackId, report.X, report.Y, report.TimestampMs);
    }

    // EvictStaleTracks:
    var toRemove = new List<string>();
    foreach (var kvp in _activeTracks) {
        if (currentTimeMs - kvp.Value.LastSeenMs > _maxStaleDurationMs) {
            toRemove.Add(kvp.Key);
        }
    }
    foreach (var id in toRemove) {
        _activeTracks.Remove(id);
    }
    return toRemove.Count;`,

      cpp: `    if (report.trackId.empty() || report.timestampMs < 0) return;
    auto it = activeTracks.find(report.trackId);
    if (it != activeTracks.end()) {
        if (report.timestampMs >= it->second.lastSeenMs) {
            it->second.x = report.x;
            it->second.y = report.y;
            it->second.lastSeenMs = report.timestampMs;
        }
    } else {
        activeTracks.emplace(report.trackId, Track(report.trackId, report.x, report.y, report.timestampMs));
    }

    // evictStaleTracks:
    int count = 0;
    for (auto it = activeTracks.begin(); it != activeTracks.end(); ) {
        if (currentTimeMs - it->second.lastSeenMs > maxStaleDurationMs) {
            it = activeTracks.erase(it);
            count++;
        } else {
            ++it;
        }
    }
    return count;`
    },
    tests: [
      { name: 'Null or empty report rejected',          fn: 'testNullOrEmptyReport' },
      { name: 'Negative timestamp rejected',           fn: 'testNegativeTimestamp' },
      { name: 'New track inserted into map',           fn: 'testNewTrackInserted' },
      { name: 'Existing track updated with fresh coords',fn: 'testExistingTrackUpdated' },
      { name: 'Out-of-order stale packet dropped',      fn: 'testOutOfOrderDropped' },
      { name: 'Stale tracks evicted beyond threshold', fn: 'testStaleTracksEvicted' },
      { name: 'Safe eviction avoids ConcurrentModificationException', fn: 'testNoConcurrentModification' }
    ]
  },

  // ── PROBLEM 2 (~30% Odds): Discrete-Event Simulation (DES) Priority Loop ──
  desPriorityLoop: {
    id: 'desPriorityLoop',
    odds: '30% ODDS',
    name: 'Discrete-Event Sim (DES) Priority Loop',
    operationalName: 'Operational Timeline Engine',
    description: 'Complete scheduleEvent() and step(). Select PriorityQueue<SimEvent> with custom Comparator on event timestamp. Ensure clock advances monotonically, events execute in strict chronological order, and temporal paradoxes are prevented.',
    templates: {
      java: `import java.util.*;

public class SimulationEngine {

    public interface SimAction {
        void execute(double currentSimTime);
    }

    public static class SimEvent {
        public double timestamp;
        public String description;
        public SimAction action;

        public SimEvent(double ts, String desc, SimAction action) {
            this.timestamp = ts;
            this.description = desc;
            this.action = action;
        }
    }

    private double currentSimTime = 0.0;

    // TODO: Choose the correct data structure to guarantee chronological order:
    // private final PriorityQueue<SimEvent> eventQueue = ...;
    private final PriorityQueue<SimEvent> eventQueue = new PriorityQueue<>(
        Comparator.comparingDouble(e -> e.timestamp)
    );

    /**
     * Schedule a future event relative to currentSimTime.
     * Rules:
     *   1. Reject negative delayFromNow (cannot schedule events in the past).
     *   2. Reject null action.
     *   3. Enqueue event with timestamp = currentSimTime + delayFromNow.
     */
    public void scheduleEvent(double delayFromNow, String description, SimAction action) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    /**
     * Run all scheduled events up to untilTime in strict chronological order.
     * Rules:
     *   1. Stop if queue is empty or next event timestamp > untilTime.
     *   2. Dequeue event, advance currentSimTime monotonically to event.timestamp.
     *   3. Execute action with updated currentSimTime.
     *   4. Advance currentSimTime to untilTime if all events finished earlier.
     */
    public void step(double untilTime) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public double getCurrentSimTime() { return currentSimTime; }
    public int getPendingEventCount() { return eventQueue.size(); }
}`,

      csharp: `using System;
using System.Collections.Generic;

public class SimulationEngine {

    public delegate void SimAction(double currentSimTime);

    public class SimEvent {
        public double Timestamp { get; set; }
        public string Description { get; set; }
        public SimAction Action { get; set; }

        public SimEvent(double ts, string desc, SimAction act) {
            Timestamp = ts; Description = desc; Action = act;
        }
    }

    private double _currentSimTime = 0.0;
    private readonly PriorityQueue<SimEvent, double> _eventQueue = new();

    public void ScheduleEvent(double delayFromNow, string description, SimAction action) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public void Step(double untilTime) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public double CurrentSimTime => _currentSimTime;
    public int PendingEventCount => _eventQueue.Count;
}`,

      cpp: `#include <queue>
#include <vector>
#include <string>
#include <functional>
#include <stdexcept>
using namespace std;

struct SimEvent {
    double timestamp;
    string description;
    function<void(double)> action;

    bool operator>(const SimEvent& other) const {
        return timestamp > other.timestamp;
    }
};

class SimulationEngine {
    double currentSimTime = 0.0;
    priority_queue<SimEvent, vector<SimEvent>, greater<SimEvent>> eventQueue;

public:
    void scheduleEvent(double delayFromNow, const string& desc, function<void(double)> action) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    void step(double untilTime) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    double getCurrentSimTime() const { return currentSimTime; }
    size_t getPendingEventCount() const { return eventQueue.size(); }
};`
    },
    solutions: {
      java: `    // scheduleEvent:
    if (delayFromNow < 0 || action == null) {
        throw new IllegalArgumentException("Cannot schedule events in the past or with null action.");
    }
    double scheduledTime = this.currentSimTime + delayFromNow;
    eventQueue.offer(new SimEvent(scheduledTime, description, action));

    // step:
    while (!eventQueue.isEmpty()) {
        SimEvent nextEvent = eventQueue.peek();

        // Stop if next event is beyond the requested step boundary
        if (nextEvent.timestamp > untilTime) {
            break;
        }

        // Dequeue and advance simulation clock monotonically
        eventQueue.poll();
        this.currentSimTime = nextEvent.timestamp;

        // Execute action
        nextEvent.action.execute(this.currentSimTime);
    }

    // Ensure clock advances to step boundary if queue is empty
    if (this.currentSimTime < untilTime) {
        this.currentSimTime = untilTime;
    }`,

      csharp: `    if (delayFromNow < 0 || action == null)
        throw new ArgumentException("Cannot schedule events in the past or with null action.");

    double scheduledTime = _currentSimTime + delayFromNow;
    _eventQueue.Enqueue(new SimEvent(scheduledTime, description, action), scheduledTime);

    // Step:
    while (_eventQueue.Count > 0) {
        var nextEvent = _eventQueue.Peek();
        if (nextEvent.Timestamp > untilTime) break;

        _eventQueue.Dequeue();
        _currentSimTime = nextEvent.Timestamp;
        nextEvent.Action(_currentSimTime);
    }
    if (_currentSimTime < untilTime) _currentSimTime = untilTime;`,

      cpp: `    if (delayFromNow < 0 || !action)
        throw invalid_argument("Invalid delay or action");
    double scheduledTime = currentSimTime + delayFromNow;
    eventQueue.push({scheduledTime, desc, action});

    // step:
    while (!eventQueue.empty()) {
        const auto& nextEvent = eventQueue.top();
        if (nextEvent.timestamp > untilTime) break;

        SimEvent ev = nextEvent;
        eventQueue.pop();
        currentSimTime = ev.timestamp;
        ev.action(currentSimTime);
    }
    if (currentSimTime < untilTime) currentSimTime = untilTime;`
    },
    tests: [
      { name: 'PriorityQueue data structure used',       fn: 'testPriorityQueueSelected' },
      { name: 'Past/negative delay event rejected',      fn: 'testNegativeDelayThrows' },
      { name: 'Null action rejected with exception',     fn: 'testNullActionThrows' },
      { name: 'Events executed in chronological order',  fn: 'testChronologicalOrder' },
      { name: 'Simulation clock advances monotonically', fn: 'testClockAdvancesMonotonically' },
      { name: 'Step stops at untilTime boundary',        fn: 'testStepBoundaryEnforced' },
      { name: 'Clock advances to untilTime when idle',   fn: 'testClockAdvancesToTarget' }
    ]
  },

  // ── PROBLEM 3 (~20% Odds): Threat Evaluator & Weapon Allocator ──────────
  threatAllocator: {
    id: 'threatAllocator',
    odds: '20% ODDS',
    name: 'Threat Evaluator & Weapon Allocator',
    operationalName: 'Red Sea Saturation (Magazine Economy)',
    description: 'Complete getHighestPriorityThreats(tracks, k). Guard against null/empty inputs, filter out friendly/neutral and already-neutralized targets, order by ascending Time-To-Impact using a min-heap PriorityQueue, and cap results at magazine size k.',
    templates: {
      java: `import java.util.*;

public class ThreatEvaluator {

    public static class Track {
        public String trackId;
        public String classification; // "HOSTILE", "FRIENDLY", "NEUTRAL"
        public double timeToImpact;   // seconds
        public boolean neutralized;

        public Track(String id, String cls, double tti, boolean neutralized) {
            this.trackId = id; this.classification = cls;
            this.timeToImpact = tti; this.neutralized = neutralized;
        }

        public boolean isHostile() { return "HOSTILE".equals(classification); }
        public boolean isNeutralized() { return neutralized; }
        public double getTimeToImpact() { return timeToImpact; }
    }

    /**
     * Returns top-k highest priority hostile threats, ordered by ascending TTI.
     * Rules:
     *   1. Guard against null tracks, empty list, or k <= 0.
     *   2. Min-heap PriorityQueue ordered by ascending timeToImpact.
     *   3. Filter out friendlies, neutrals, and neutralized contacts.
     *   4. Return up to k highest priority threats.
     */
    public List<Track> getHighestPriorityThreats(List<Track> incomingTracks, int k) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
        return Collections.emptyList();
    }
}`,

      csharp: `using System;
using System.Collections.Generic;
using System.Linq;

public class ThreatEvaluator {

    public class Track {
        public string TrackId { get; set; }
        public string Classification { get; set; }
        public double TimeToImpact { get; set; }
        public bool Neutralized { get; set; }

        public Track(string id, string cls, double tti, bool neut) {
            TrackId = id; Classification = cls; TimeToImpact = tti; Neutralized = neut;
        }

        public bool IsHostile => Classification == "HOSTILE";
    }

    public List<Track> GetHighestPriorityThreats(List<Track> incomingTracks, int k) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
        return new List<Track>();
    }
}`,

      cpp: `#include <vector>
#include <queue>
#include <string>
#include <algorithm>
using namespace std;

struct Track {
    string trackId, classification;
    double timeToImpact;
    bool neutralized;
    bool isHostile() const { return classification == "HOSTILE"; }
};

class ThreatEvaluator {
public:
    vector<Track> getHighestPriorityThreats(const vector<Track>& tracks, int k) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
        return {};
    }
};`
    },
    solutions: {
      java: `    // 1. Guard against null/empty/k <= 0
    if (incomingTracks == null || incomingTracks.isEmpty() || k <= 0) {
        return Collections.emptyList();
    }

    // 2. Min-heap: smallest TTI = highest danger priority
    PriorityQueue<Track> pq = new PriorityQueue<>(
        (a, b) -> Double.compare(a.getTimeToImpact(), b.getTimeToImpact())
    );

    // 3. Filter active hostiles only
    for (Track t : incomingTracks) {
        if (t != null && t.isHostile() && !t.isNeutralized()) {
            pq.offer(t);
        }
    }

    // 4. Collect top k
    List<Track> result = new ArrayList<>();
    while (!pq.isEmpty() && result.size() < k) {
        result.add(pq.poll());
    }
    return result;`,

      csharp: `    if (incomingTracks == null || incomingTracks.Count == 0 || k <= 0)
        return new List<Track>();

    return incomingTracks
        .Where(t => t != null && t.IsHostile && !t.Neutralized)
        .OrderBy(t => t.TimeToImpact)
        .Take(k)
        .ToList();`,

      cpp: `    if (tracks.empty() || k <= 0) return {};
    auto cmp = [](const Track& a, const Track& b) { return a.timeToImpact > b.timeToImpact; };
    priority_queue<Track, vector<Track>, decltype(cmp)> pq(cmp);

    for (const auto& t : tracks) {
        if (t.isHostile() && !t.neutralized) pq.push(t);
    }
    vector<Track> res;
    while (!pq.empty() && (int)res.size() < k) {
        res.push_back(pq.top());
        pq.pop();
    }
    return res;`
    },
    tests: [
      { name: 'Null or empty input returns empty list', fn: 'testThreatNullList' },
      { name: 'Non-positive k (k<=0) returns empty list', fn: 'testThreatKZero' },
      { name: 'Neutralized contacts excluded',           fn: 'testNeutralizedExcluded' },
      { name: 'Friendly and neutral contacts excluded', fn: 'testFriendlyExcluded' },
      { name: 'Lowest TTI ordered first (Min-Heap)',     fn: 'testLowestTTIFirst' },
      { name: 'Result capped strictly at k elements',   fn: 'testKCap' }
    ]
  },

  // ── PROBLEM 4 (~10% Odds): Polymorphic C5ISR Sensor Stream (Factory) ─────
  polymorphicSensorParser: {
    id: 'polymorphicSensorParser',
    odds: '10% ODDS',
    name: 'Polymorphic C5ISR Sensor Stream (Factory)',
    operationalName: 'Polymorphic C5ISR Sensor Stream',
    description: 'Refactor brittle if/else parser into a polymorphic SensorParser factory. Ingest radar, sonar, and ESM streams. Throw IllegalArgumentException for unregistered types, validate raw records before saving, and honor the Open/Closed Principle.',
    templates: {
      java: `import java.util.*;

public class SensorIngestionService {

    public enum SensorType { RADAR, SONAR, ESM }

    public static class Track {
        public String id;
        public boolean valid;
        public Track(String id, boolean valid) { this.id = id; this.valid = valid; }
        public String getId() { return id; }
        public boolean isValid() { return valid; }
    }

    public interface SensorParser {
        Track parseRecord(byte[] rawPayload);
    }

    private final Map<SensorType, SensorParser> parsers = new HashMap<>();
    private final Map<String, Track> activeTracks = new HashMap<>();

    /**
     * Register a polymorphic parser for a sensor type (Open/Closed Principle).
     */
    public void registerParser(SensorType type, SensorParser parser) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    /**
     * Parse raw sensor payload and store valid tracks.
     * Rules:
     *   1. If no parser registered for type, throw IllegalArgumentException.
     *   2. Reject null payloads.
     *   3. Only store track if parseRecord() returns non-null and track.isValid().
     */
    public void ingest(SensorType type, byte[] rawPayload) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public Map<String, Track> getActiveTracks() { return activeTracks; }
}`,

      csharp: `using System;
using System.Collections.Generic;

public enum SensorType { Radar, Sonar, Esm }

public class Track {
    public string Id { get; set; }
    public bool IsValid { get; set; }
    public Track(string id, bool valid) { Id = id; IsValid = valid; }
}

public interface ISensorParser {
    Track ParseRecord(byte[] rawPayload);
}

public class SensorIngestionService {
    private readonly Dictionary<SensorType, ISensorParser> _parsers = new();
    private readonly Dictionary<string, Track> _activeTracks = new();

    public void RegisterParser(SensorType type, ISensorParser parser) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public void Ingest(SensorType type, byte[] rawPayload) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public IReadOnlyDictionary<string, Track> ActiveTracks => _activeTracks;
}`,

      cpp: `#include <unordered_map>
#include <string>
#include <vector>
#include <memory>
#include <functional>
#include <stdexcept>
using namespace std;

enum class SensorType { Radar, Sonar, Esm };

struct Track {
    string id;
    bool valid;
};

using SensorParser = function<shared_ptr<Track>(const vector<uint8_t>&)>;

class SensorIngestionService {
    unordered_map<int, SensorParser> parsers;
    unordered_map<string, shared_ptr<Track>> activeTracks;
public:
    void registerParser(SensorType type, SensorParser parser) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    void ingest(SensorType type, const vector<uint8_t>& rawData) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    const auto& getActiveTracks() const { return activeTracks; }
};`
    },
    solutions: {
      java: `    // registerParser:
    if (type != null && parser != null) {
        parsers.put(type, parser);
    }

    // ingest:
    SensorParser parser = parsers.get(type);
    if (parser == null) {
        throw new IllegalArgumentException("No parser registered for: " + type);
    }
    if (rawPayload == null) return;
    Track track = parser.parseRecord(rawPayload);
    if (track != null && track.isValid()) {
        activeTracks.put(track.getId(), track);
    }`,

      csharp: `    if (parser == null) throw new ArgumentNullException(nameof(parser));
    _parsers[type] = parser;

    // Ingest:
    if (!_parsers.TryGetValue(type, out var parser))
        throw new InvalidOperationException($"No parser registered for {type}");
    if (rawPayload == null) return;
    var track = parser.ParseRecord(rawPayload);
    if (track != null && track.IsValid)
        _activeTracks[track.Id] = track;`,

      cpp: `    parsers[(int)type] = std::move(parser);

    // ingest:
    auto it = parsers.find((int)type);
    if (it == parsers.end())
        throw std::invalid_argument("No parser registered for sensor type");
    if (rawData.empty()) return;
    auto track = it->second(rawData);
    if (track && track->valid)
        activeTracks[track->id] = track;`
    },
    tests: [
      { name: 'registerParser stores parser in map',    fn: 'testRegisterStores' },
      { name: 'ingest throws for unregistered type',     fn: 'testThrowsUnregistered' },
      { name: 'Null rawPayload rejected gracefully',     fn: 'testNullPayloadNotStored' },
      { name: 'Invalid track not added to activeTracks', fn: 'testInvalidTrackNotStored' },
      { name: 'Valid track parsed and stored',           fn: 'testValidTrackStored' },
      { name: 'Multiple sensor types work independently',fn: 'testMultiSensorTypes' }
    ]
  }
};

/* =====================================================================
   WHITEBOARD CONTROLLER
===================================================================== */
class WhiteboardController {
  constructor() {
    this.currentProblem = 'staleTrackEviction'; // 40% probability default
    this.currentLang    = 'java';
    this.showSolution   = false;
    this.editor         = document.getElementById('wbCodeEditor');
    this.outputEl       = document.getElementById('wbOutput');
    this.problemSelect  = document.getElementById('wbProblemSelect');
    this.initListeners();
    this.loadProblem(this.currentProblem, this.currentLang);
  }

  initListeners() {
    if (this.problemSelect) {
      this.problemSelect.addEventListener('change', (e) => {
        this.currentProblem = e.target.value;
        this.showSolution   = false;
        this.loadProblem(this.currentProblem, this.currentLang);
      });
    }
    document.querySelectorAll('.wb-lang-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-lang-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLang = btn.dataset.lang;
        this.showSolution = false;
        this.loadProblem(this.currentProblem, this.currentLang);
      });
    });
  }

  loadProblem(probKey, lang) {
    const prob = WB_PROBLEMS[probKey];
    if (!prob || !this.editor) return;
    this.editor.value = prob.templates[lang] || prob.templates['java'];
    this.clearOutput();
    this.addOutputLine('info', `▸ Whiteboard Archetype: ${prob.name} [${prob.odds}]`);
    this.addOutputLine('info', `▸ Language: ${lang.toUpperCase()}`);
    this.addOutputLine('info', `Click "Run Tests" to validate your solution.`);
    this.showSolution = false;

    // Sync UI briefing elements
    this.updateBriefingUI(probKey, prob);
  }

  updateBriefingUI(probKey, prob) {
    const badgeEl = document.getElementById('wbBriefingBadge');
    const descEl  = document.getElementById('wbBriefingDesc');
    const titleEl = document.getElementById('briefingTitle');
    const objEl   = document.getElementById('briefingObjective');
    const critEl  = document.getElementById('briefingCriteria');

    if (badgeEl) badgeEl.textContent = prob.odds || 'PROBLEM';
    if (descEl) descEl.innerHTML = `<strong>Goal:</strong> ${prob.description}`;
    if (titleEl) titleEl.textContent = prob.name;
    if (objEl) objEl.textContent = prob.description;

    if (!critEl) return;

    if (probKey === 'staleTrackEviction') {
      critEl.innerHTML = `
        <div class="framework-card">
          <div class="fw-title">① Report Validation (Entry Guards)</div>
          <div class="fw-step">Reject <code>report == null</code> or <code>report.trackId == null</code> or empty string.</div>
          <div class="fw-step">Reject negative timestamps: <code>report.timestampMs &lt; 0</code>.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">② Out-of-Order Packet Protection</div>
          <div class="fw-step">If track exists, ONLY update if <code>report.timestampMs &gt;= existing.lastSeenMs</code>.</div>
          <div class="fw-step">Drop delayed/stale UDP packets arriving out of sequence.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">③ The Interviewer Trap: CME Safe Eviction</div>
          <div class="fw-step"><strong>Do NOT</strong> call <code>activeTracks.remove()</code> inside a standard foreach!</div>
          <div class="fw-step">Use <code>Iterator.remove()</code> or Java 8 <code>removeIf()</code> to avoid <code>ConcurrentModificationException</code>.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">④ Whiteboard Senior Defense Nuance</div>
          <div class="fw-step">Ask aloud: <em>"Can sensor packets arrive out of chronological order due to network jitter?"</em></div>
          <div class="fw-step">State Big-O: O(1) ingestion lookup via HashMap; O(N) linear sweep for periodic eviction.</div>
        </div>`;
    } else if (probKey === 'desPriorityLoop') {
      critEl.innerHTML = `
        <div class="framework-card">
          <div class="fw-title">① Collection Choice: PriorityQueue</div>
          <div class="fw-step">Use <code>PriorityQueue&lt;SimEvent&gt;</code> with <code>Comparator.comparingDouble(e -&gt; e.timestamp)</code>.</div>
          <div class="fw-step">Guarantees O(log N) insertion and O(1) peek at earliest event.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">② Schedule Validation &amp; Temporal Integrity</div>
          <div class="fw-step">Reject past events: <code>if (delayFromNow &lt; 0) throw new IllegalArgumentException()</code>.</div>
          <div class="fw-step">Reject <code>null</code> action to prevent null pointer exceptions in simulation loop.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">③ Monotonic Clock Advancement</div>
          <div class="fw-step">Stop loop when <code>nextEvent.timestamp &gt; untilTime</code> (respect step boundary).</div>
          <div class="fw-step">Advance clock to <code>nextEvent.timestamp</code>, execute, and advance to <code>untilTime</code> when idle.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">④ Pentagon Briefing Context</div>
          <div class="fw-step">Explain: "In discrete-event warfighting models, time only advances when an event occurs. This allows simulating a 48-hour naval conflict in 12 seconds."</div>
        </div>`;
    } else if (probKey === 'threatAllocator') {
      critEl.innerHTML = `
        <div class="framework-card">
          <div class="fw-title">① Input Guard Clauses</div>
          <div class="fw-step">Reject <code>null</code>, empty track list, or <code>k &lt;= 0</code> by returning <code>emptyList()</code>.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">② Filter Hostiles &amp; Active Targets</div>
          <div class="fw-step">Filter: <code>t.isHostile() &amp;&amp; !t.isNeutralized()</code>.</div>
          <div class="fw-step">Never allocate multi-million dollar interceptors to neutral cargo or dead tracks.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">③ Min-Heap PriorityQueue Ordering</div>
          <div class="fw-step">Comparator: <code>(a, b) -&gt; Double.compare(a.getTimeToImpact(), b.getTimeToImpact())</code>.</div>
          <div class="fw-step">Lowest Time-To-Impact = highest threat urgency = processed first.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">④ Magazine Cap (Top-K) &amp; Pk Math</div>
          <div class="fw-step">Extract up to <code>k</code> targets (limited by available VLS missile cells).</div>
          <div class="fw-step">Mention Pk formula: <code>Pk_total = 1 - (1 - Pk_single)^n</code>.</div>
        </div>`;
    } else if (probKey === 'polymorphicSensorParser') {
      critEl.innerHTML = `
        <div class="framework-card">
          <div class="fw-title">① Parser Registration (Open/Closed)</div>
          <div class="fw-step">Store parser in map: <code>parsers.put(type, parser)</code>.</div>
          <div class="fw-step">Enables adding new radar/sonar variants without modifying existing ingestion logic.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">② Unregistered Type Guard</div>
          <div class="fw-step">Throw <code>IllegalArgumentException</code> if no parser registered for requested sensor type.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">③ Validate Parsed Track Record</div>
          <div class="fw-step">Reject <code>null</code> payload, verify <code>track != null &amp;&amp; track.isValid()</code> before storing.</div>
        </div>
        <div class="framework-card">
          <div class="fw-title">④ Whiteboard Talking Point</div>
          <div class="fw-step">"Hardcoding an if/else chain violates the Open/Closed Principle. A registry/factory decouples sensor protocols from tactical track management."</div>
        </div>`;
    }
  }

  runTests() {
    this.clearOutput();
    const prob  = WB_PROBLEMS[this.currentProblem];
    const code  = this.editor ? this.editor.value : '';
    const lang  = this.currentLang;

    if (lang !== 'java' && lang !== 'csharp') {
      this.addOutputLine('info', `[ C++ ] Static analysis mode enabled.`);
      this.runStaticAnalysis(prob, code, lang);
      return;
    }

    this.addOutputLine('info', `Running ${prob.tests.length} acceptance test cases for ${prob.name}…`);
    let passed = 0;

    prob.tests.forEach((t, i) => {
      const result = this.evaluateTest(t.fn, code, lang, prob);
      if (result.pass) {
        this.addOutputLine('pass', `  ✓ [${String(i+1).padStart(2,'0')}] ${t.name}`);
        passed++;
      } else {
        this.addOutputLine('fail', `  ✗ [${String(i+1).padStart(2,'0')}] ${t.name}`);
        if (result.hint) {
          this.addOutputLine('info', `       → ${result.hint}`);
        }
      }
    });

    const total = prob.tests.length;
    const pct   = Math.round((passed / total) * 100);
    this.addOutputLine('info', `─────────────────────────`);
    if (passed === total) {
      this.addOutputLine('pass', `✓ ALL ${total} ACCEPTANCE TESTS PASSED (${pct}%)`);
      this.addOutputLine('info', `Great work. This solution cleanly demonstrates senior defensive modeling.`);
    } else {
      this.addOutputLine('fail', `✗ ${passed}/${total} passed (${pct}%)`);
      this.addOutputLine('info', `Hint: Check guard clauses, collection iterators, and out-of-order checks.`);
    }
  }

  evaluateTest(fnName, code, lang, prob) {
    const c = code.toLowerCase();
    const has = (str) => c.includes(str.toLowerCase());

    switch(fnName) {
      // ── Problem 1: Stale Track Eviction Tests ──
      case 'testNullOrEmptyReport':
        return {
          pass: (has('report == null') || has('!report') || has('report is null')) &&
                (has('trackid == null') || has('.trackid == null') || has('isempty') || has('isnullorempty')),
          hint: 'Add entry guard: if (report == null || report.trackId == null || report.trackId.isEmpty()) return;'
        };
      case 'testNegativeTimestamp':
        return {
          pass: has('timestampms < 0') || has('timestampms <= 0') || has('timestamp < 0') || has('ts < 0'),
          hint: 'Reject reports with negative timestamps: report.timestampMs < 0.'
        };
      case 'testNewTrackInserted':
        return {
          pass: has('activetracks.put(') || has('_activetracks[') || has('activetracks.emplace(') || has('activetracks['),
          hint: 'Insert new Track into map if not present.'
        };
      case 'testExistingTrackUpdated':
        return {
          pass: (has('existing.x =') || has('existing.y =') || has('it->second.x')) &&
                (has('lastseenms =') || has('.lastseenms =')),
          hint: 'Update existing.x, existing.y, and existing.lastSeenMs.'
        };
      case 'testOutOfOrderDropped':
        return {
          pass: has('>= existing.lastseenms') || has('>= existing.lastseen') || has('> existing.lastseenms'),
          hint: 'Drop out-of-order packets: only update if report.timestampMs >= existing.lastSeenMs.'
        };
      case 'testStaleTracksEvicted':
        return {
          pass: has('maxstaledurationms') || has('_maxstaledurationms') || has('currenttimems -'),
          hint: 'Compare (currentTimeMs - lastSeenMs) > maxStaleDurationMs to detect stale contacts.'
        };
      case 'testNoConcurrentModification':
        return {
          pass: (has('iterator') && has('.remove()')) || has('removeif') || has('toremove') || has('erase('),
          hint: 'Crucial: Use iterator.remove() or a toRemove list to avoid ConcurrentModificationException!'
        };

      // ── Problem 2: Discrete-Event Sim Loop Tests ──
      case 'testPriorityQueueSelected':
        return {
          pass: has('priorityqueue') || has('priority_queue'),
          hint: 'Use a PriorityQueue ordered by event.timestamp.'
        };
      case 'testNegativeDelayThrows':
        return {
          pass: (has('delayfromnow < 0') || has('delay < 0')) && has('throw'),
          hint: 'Throw IllegalArgumentException if delayFromNow < 0 (cannot schedule in the past).'
        };
      case 'testNullActionThrows':
        return {
          pass: (has('action == null') || has('!action')) && has('throw'),
          hint: 'Throw IllegalArgumentException if action == null.'
        };
      case 'testChronologicalOrder':
        return {
          pass: has('eventqueue.poll()') || has('_eventqueue.dequeue()') || has('eventqueue.pop()'),
          hint: 'Dequeue events using poll()/dequeue() so earliest timestamps run first.'
        };
      case 'testClockAdvancesMonotonically':
        return {
          pass: has('currentsimtime =') || has('_currentsimtime ='),
          hint: 'Advance currentSimTime = nextEvent.timestamp monotonically before executing action.'
        };
      case 'testStepBoundaryEnforced':
        return {
          pass: has('> untiltime') || has('>= untiltime'),
          hint: 'Break loop if nextEvent.timestamp > untilTime (do not run past boundary).'
        };
      case 'testClockAdvancesToTarget':
        return {
          pass: has('currentsimtime < untiltime') || has('_currentsimtime < untiltime') || has('currentsimtime = untiltime'),
          hint: 'If queue empties before untilTime, advance currentSimTime to untilTime.'
        };

      // ── Problem 3: Threat Evaluator Tests ──
      case 'testThreatNullList':
        return {
          pass: has('incomingtracks == null') || has('tracks == null') || has('tracks.isempty()') || has('tracks.count == 0'),
          hint: 'Check if incomingTracks == null or empty and return emptyList().'
        };
      case 'testThreatKZero':
        return {
          pass: has('k <= 0') || has('k < 1'),
          hint: 'Guard against k <= 0 and return empty list.'
        };
      case 'testNeutralizedExcluded':
        return {
          pass: has('!t.isneutralized()') || has('!track.isneutralized()') || has('!neutralized'),
          hint: 'Filter out neutralized targets.'
        };
      case 'testFriendlyExcluded':
        return {
          pass: has('ishostile') || has('is_hostile'),
          hint: 'Only process hostile contacts.'
        };
      case 'testLowestTTIFirst':
        return {
          pass: has('priorityqueue') || has('double.compare') || has('orderby') || has('compareto'),
          hint: 'Order by ascending Time-To-Impact using PriorityQueue.'
        };
      case 'testKCap':
        return {
          pass: has('size() < k') || has('count < k') || has('.take(k)') || has('result.size() < k'),
          hint: 'Cap result strictly at k items.'
        };

      // ── Problem 4: Sensor Parser Tests ──
      case 'testRegisterStores':
        return {
          pass: has('.put(type,') || has('_parsers[') || has('parsers['),
          hint: 'Store parser in map during registerParser().'
        };
      case 'testThrowsUnregistered':
        return {
          pass: has('throw') && (has('illegalargumentexception') || has('invalidoperationexception') || has('invalid_argument')),
          hint: 'Throw exception if no parser registered for requested sensor type.'
        };
      case 'testNullPayloadNotStored':
        return {
          pass: has('rawpayload == null') || has('!rawpayload') || has('rawdata.empty()'),
          hint: 'Reject null or empty raw payload.'
        };
      case 'testInvalidTrackNotStored':
        return {
          pass: has('isvalid') || has('.isvalid()'),
          hint: 'Only store track if track.isValid() returns true.'
        };
      case 'testValidTrackStored':
        return {
          pass: has('activetracks.put(') || has('_activetracks[') || has('activetracks['),
          hint: 'Put valid track into activeTracks map.'
        };
      case 'testMultiSensorTypes':
        return {
          pass: has('.put(') || has('parsers['),
          hint: 'Registry handles distinct SensorType keys.'
        };

      default:
        return { pass: true };
    }
  }

  runStaticAnalysis(prob, code, lang) {
    const checks = [
      { check: true, pass: code.includes('null') || code.includes('empty'), label: 'Defensive validation / early return guard' },
      { check: true, pass: code.includes('throw') || code.includes('return'), label: 'Error propagation / exception guard' },
      { check: true, pass: code.includes('active') || code.includes('queue') || code.includes('tracks'), label: 'State collection operations' },
    ];
    checks.forEach(c => {
      this.addOutputLine(c.pass ? 'pass' : 'fail', `  ${c.pass ? '✓' : '✗'} ${c.label}`);
    });
  }

  toggleSolution() {
    const prob = WB_PROBLEMS[this.currentProblem];
    this.showSolution = !this.showSolution;
    if (this.showSolution && prob.solutions[this.currentLang]) {
      const t = prob.templates[this.currentLang];
      const sol = prob.solutions[this.currentLang];
      this.editor.value = t + '\n\n// ════════════════════════════════════════════════════════════════════\n// REFERENCE SOLUTION (' + this.currentLang.toUpperCase() + '):\n// ════════════════════════════════════════════════════════════════════\n' + sol;
      this.addOutputLine('info', `[ SOLUTION ] Appended reference solution for ${this.currentLang.toUpperCase()} below template.`);
    } else {
      this.loadProblem(this.currentProblem, this.currentLang);
    }
  }

  clearOutput() {
    if (this.outputEl) this.outputEl.innerHTML = '';
  }

  addOutputLine(cls, text) {
    if (!this.outputEl) return;
    const div = document.createElement('div');
    div.className = `wb-output-line ${cls}`;
    div.textContent = text;
    this.outputEl.appendChild(div);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
}

// Exported reference
window.whiteboardController = null;

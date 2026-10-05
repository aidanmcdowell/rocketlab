/* =====================================================================
   ORCA WHITEBOARD — orca-whiteboard.js
   Interactive OOP Incomplete-Problem Code Lab
   Practice problems matching SPA ORCA interview archetypes
===================================================================== */

const WB_PROBLEMS = {

  // ── PROBLEM A: Track Ingestion & Boundary Filter ───────────────────
  trackIngestion: {
    name: 'Track Ingestion & Boundary Filter',
    description: 'Complete the `ingest()` method. It must: validate the track is non-null and has a valid ID, filter coordinates within the operational boundary (lat -90–90, lon -180–180), deduplicate by overwriting existing track IDs, and store valid tracks in the map.',
    templates: {
      java: `import java.util.*;

// Abstract base class — DO NOT MODIFY
public abstract class Track {
    private final String trackId;
    private final String classification; // "HOSTILE","FRIENDLY","NEUTRAL"
    private double lat;
    private double lon;
    private double speed;    // knots
    private double heading;  // degrees 0–360

    public Track(String trackId, String classification,
                 double lat, double lon, double speed, double heading) {
        this.trackId = trackId;
        this.classification = classification;
        this.lat = lat; this.lon = lon;
        this.speed = speed; this.heading = heading;
    }

    public String getTrackId()       { return trackId; }
    public String getClassification(){ return classification; }
    public double getLat()           { return lat; }
    public double getLon()           { return lon; }
    public double getSpeed()         { return speed; }
    public boolean isHostile()       { return "HOSTILE".equals(classification); }

    public abstract double getTimeToImpact(); // subclasses implement
}

// ════════════════════════════════════════════════════════════════════
// TODO: Complete this class
// ════════════════════════════════════════════════════════════════════
public class TrackManager {
    private final Map<String, Track> activeTracks = new HashMap<>();

    /**
     * Ingest a sensor-reported track.
     * Rules:
     *   1. Reject null tracks.
     *   2. Reject tracks with null/empty trackId.
     *   3. Reject coordinates outside valid bounds:
     *        lat: -90.0 to 90.0   lon: -180.0 to 180.0
     *   4. Overwrite existing record if trackId already present.
     *   5. Store valid track in activeTracks.
     *
     * @param track incoming Track object from sensor feed
     */
    public void ingest(Track track) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public Map<String, Track> getActiveTracks() { return activeTracks; }
    public int size() { return activeTracks.size(); }
}`,

      csharp: `using System;
using System.Collections.Generic;

// Abstract base class — DO NOT MODIFY
public abstract class Track {
    public string TrackId        { get; }
    public string Classification { get; } // "HOSTILE","FRIENDLY","NEUTRAL"
    public double Lat    { get; }
    public double Lon    { get; }
    public double Speed  { get; }
    public double Heading{ get; }

    protected Track(string trackId, string classification,
                    double lat, double lon, double speed, double heading) {
        TrackId = trackId; Classification = classification;
        Lat = lat; Lon = lon; Speed = speed; Heading = heading;
    }

    public bool IsHostile => Classification == "HOSTILE";
    public abstract double GetTimeToImpact(); // subclasses implement
}

// ════════════════════════════════════════════════════════════════════
// TODO: Complete this class
// ════════════════════════════════════════════════════════════════════
public class TrackManager {
    private readonly Dictionary<string, Track> _activeTracks = new();

    /// <summary>
    /// Ingest a sensor-reported track.
    /// Rules:
    ///   1. Reject null tracks.
    ///   2. Reject tracks with null/empty TrackId.
    ///   3. Reject coordinates outside valid bounds:
    ///        lat: -90.0 to 90.0   lon: -180.0 to 180.0
    ///   4. Overwrite existing record if TrackId already present.
    ///   5. Store valid track in _activeTracks.
    /// </summary>
    public void Ingest(Track track) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    public IReadOnlyDictionary<string, Track> ActiveTracks => _activeTracks;
    public int Count => _activeTracks.Count;
}`,

      cpp: `#include <string>
#include <unordered_map>
#include <memory>
#include <stdexcept>
using namespace std;

// Abstract base — DO NOT MODIFY
class Track {
public:
    string trackId, classification;
    double lat, lon, speed, heading;

    Track(string id, string cls, double la, double lo, double sp, double hd)
        : trackId(id), classification(cls), lat(la), lon(lo), speed(sp), heading(hd) {}

    bool isHostile() const { return classification == "HOSTILE"; }
    virtual double getTimeToImpact() const = 0; // pure virtual
    virtual ~Track() = default;
};

// ════════════════════════════════════════════════════════════════════
// TODO: Complete this class
// ════════════════════════════════════════════════════════════════════
class TrackManager {
    unordered_map<string, shared_ptr<Track>> activeTracks;
public:
    /**
     * Ingest a sensor-reported track.
     * Rules:
     *   1. Reject null pointer.
     *   2. Reject empty trackId.
     *   3. Reject coords outside bounds (lat -90–90, lon -180–180).
     *   4. Overwrite if trackId already present.
     *   5. Store valid track in activeTracks.
     */
    void ingest(shared_ptr<Track> track) {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }

    const unordered_map<string, shared_ptr<Track>>& getActiveTracks() const {
        return activeTracks;
    }
    int size() const { return activeTracks.size(); }
};`
    },
    solutions: {
      java: `    // 1. Null guard
    if (track == null) return;

    // 2. ID guard
    if (track.getTrackId() == null || track.getTrackId().isEmpty()) return;

    // 3. Coordinate bounds validation
    double lat = track.getLat(), lon = track.getLon();
    if (lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0) return;

    // 4 & 5. Upsert (overwrite or insert)
    activeTracks.put(track.getTrackId(), track);`,
      csharp: `    // 1. Null guard
    if (track == null) return;

    // 2. ID guard
    if (string.IsNullOrEmpty(track.TrackId)) return;

    // 3. Coordinate bounds validation
    if (track.Lat < -90.0 || track.Lat > 90.0 ||
        track.Lon < -180.0 || track.Lon > 180.0) return;

    // 4 & 5. Upsert (overwrite or insert)
    _activeTracks[track.TrackId] = track;`,
      cpp: `    // 1. Null guard
    if (!track) return;

    // 2. ID guard
    if (track->trackId.empty()) return;

    // 3. Coordinate bounds validation
    if (track->lat < -90.0 || track->lat > 90.0 ||
        track->lon < -180.0 || track->lon > 180.0) return;

    // 4 & 5. Upsert
    activeTracks[track->trackId] = track;`
    },
    tests: [
      { name: 'Null track rejected',               fn: 'testNullRejected' },
      { name: 'Empty ID rejected',                  fn: 'testEmptyIdRejected' },
      { name: 'Out-of-bounds lat rejected',          fn: 'testLatOOBRejected' },
      { name: 'Out-of-bounds lon rejected',          fn: 'testLonOOBRejected' },
      { name: 'Valid track stored',                  fn: 'testValidStored' },
      { name: 'Duplicate ID overwrites',             fn: 'testDuplicateOverwrites' },
    ]
  },

  // ── PROBLEM B: PriorityQueue Threat Allocator ──────────────────────
  threatAllocator: {
    name: 'PriorityQueue Threat Allocator',
    description: 'Complete `getHighestPriorityThreats()`. It must: guard against null/empty/k≤0 inputs, only include hostile non-neutralized tracks, order by ascending time-to-impact (lowest TTI = highest threat), and return the top-K entries.',
    templates: {
      java: `import java.util.*;

public class ThreatEvaluator {

    /**
     * Returns the top-K highest-priority hostile threats,
     * ordered by ascending time-to-impact.
     *
     * @param incomingTracks all sensor tracks (may include neutrals, friendlies)
     * @param k              max number of threats to return
     * @return ordered list of highest-priority threats (lowest TTI first)
     */
    public List<Track> getHighestPriorityThreats(
            List<Track> incomingTracks, int k) {

        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }
}

// Minimal Track stub for whiteboard context
abstract class Track {
    public abstract String  getId();
    public abstract boolean isHostile();
    public abstract boolean isNeutralized();
    public abstract double  getTimeToImpact(); // seconds to impact point
}`,
      csharp: `using System;
using System.Collections.Generic;

public class ThreatEvaluator {

    /// <summary>
    /// Returns the top-K highest-priority hostile threats,
    /// ordered by ascending TimeToImpact.
    /// </summary>
    public List<Track> GetHighestPriorityThreats(
        List<Track> incomingTracks, int k)
    {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }
}

public abstract class Track {
    public abstract string  Id             { get; }
    public abstract bool    IsHostile      { get; }
    public abstract bool    IsNeutralized  { get; }
    public abstract double  TimeToImpact   { get; } // seconds
}`,
      cpp: `#include <vector>
#include <queue>
#include <memory>
#include <functional>
using namespace std;

struct Track {
    string id;
    bool hostile;
    bool neutralized;
    double timeToImpact;
};

class ThreatEvaluator {
public:
    /**
     * Returns top-K hostile non-neutralized tracks with lowest TTI.
     */
    vector<shared_ptr<Track>> getHighestPriorityThreats(
        vector<shared_ptr<Track>>& tracks, int k)
    {
        // ── YOUR CODE HERE ──────────────────────────────────────────



        // ────────────────────────────────────────────────────────────
    }
};`
    },
    solutions: {
      java: `        if (incomingTracks == null || incomingTracks.isEmpty() || k <= 0) {
            return Collections.emptyList();
        }

        // Min-heap ordered by ascending TTI (lowest TTI = highest threat)
        PriorityQueue<Track> threatQueue = new PriorityQueue<>(
            (a, b) -> Double.compare(a.getTimeToImpact(), b.getTimeToImpact())
        );

        for (Track track : incomingTracks) {
            if (track.isHostile() && !track.isNeutralized()) {
                threatQueue.offer(track);
            }
        }

        List<Track> priorityTargets = new ArrayList<>();
        while (!threatQueue.isEmpty() && priorityTargets.size() < k) {
            priorityTargets.add(threatQueue.poll());
        }
        return priorityTargets;`,
      csharp: `        if (incomingTracks == null || incomingTracks.Count == 0 || k <= 0)
            return new List<Track>();

        // SortedSet or manual sort — use LINQ + OrderBy for clarity
        var hostile = incomingTracks
            .Where(t => t.IsHostile && !t.IsNeutralized)
            .OrderBy(t => t.TimeToImpact)
            .Take(k)
            .ToList();

        return hostile;`,
      cpp: `        if (tracks.empty() || k <= 0) return {};

        // Min-heap: smallest TTI at top
        auto cmp = [](const shared_ptr<Track>& a, const shared_ptr<Track>& b) {
            return a->timeToImpact > b->timeToImpact; // note: reversed for min-heap
        };
        priority_queue<shared_ptr<Track>,
                       vector<shared_ptr<Track>>,
                       decltype(cmp)> pq(cmp);

        for (auto& t : tracks) {
            if (t->hostile && !t->neutralized) pq.push(t);
        }

        vector<shared_ptr<Track>> result;
        while (!pq.empty() && (int)result.size() < k) {
            result.push_back(pq.top()); pq.pop();
        }
        return result;`
    },
    tests: [
      { name: 'Null input returns empty',            fn: 'testNullInput' },
      { name: 'k=0 returns empty',                   fn: 'testKZero' },
      { name: 'Neutralized tracks excluded',          fn: 'testNeutralizedExcluded' },
      { name: 'Friendly tracks excluded',             fn: 'testFriendlyExcluded' },
      { name: 'Returns lowest TTI first',             fn: 'testLowestTTIFirst' },
      { name: 'Returns exactly k items',              fn: 'testKCap' },
    ]
  },

  // ── PROBLEM C: Heterogeneous Sensor Parser (Factory) ───────────────
  sensorParser: {
    name: 'Sensor Parser — Factory Pattern',
    description: 'Complete `registerParser()` and `ingest()`. The ingest method should look up the registered parser for the given SensorType, call parseRecord(), and only store the track if it is non-null and valid. Eliminate the brittle if/else chain.',
    templates: {
      java: `import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public enum SensorType { RADAR, SONAR, ESM, AIS }

public interface SensorParser {
    /**
     * Parse raw sensor byte payload into a Track.
     * @return parsed Track, or null if payload is malformed
     */
    Track parseRecord(byte[] rawPayload);
}

// ════════════════════════════════════════════════════════════════════
// BROKEN ORIGINAL CODE — rigid type chains, no extensibility
// ════════════════════════════════════════════════════════════════════
/*
public class BrokenIngestion {
    public void ingest(int type, byte[] data) {
        if      (type == 1) { RadarParser p = new RadarParser(); ... }
        else if (type == 2) { SonarParser p = new SonarParser(); ... }
        else if (type == 3) { ESMParser p   = new ESMParser();   ... }
        // Adding a new sensor requires editing this method — VIOLATION of OCP
    }
}
*/

// ════════════════════════════════════════════════════════════════════
// TODO: Fix using Factory / Registry pattern
// ════════════════════════════════════════════════════════════════════
public class SensorIngestionService {
    private final Map<SensorType, SensorParser> parsers    = new HashMap<>();
    private final Map<String,     Track>        activeTracks = new ConcurrentHashMap<>();

    /**
     * Register a parser for a sensor type (call before ingest).
     */
    public void registerParser(SensorType type, SensorParser parser) {
        // ── YOUR CODE HERE ────────────────────────────────────────



    }

    /**
     * Ingest a raw sensor payload.
     * 1. Look up parser for type; throw IllegalArgumentException if not found.
     * 2. Parse raw payload into Track.
     * 3. Store track if non-null and track.isValid().
     */
    public void ingest(SensorType type, byte[] rawData) {
        // ── YOUR CODE HERE ────────────────────────────────────────



    }

    public Map<String, Track> getActiveTracks() { return activeTracks; }
}

// Minimal stubs for whiteboard
abstract class Track {
    public abstract String getId();
    public abstract boolean isValid();
}`,
      csharp: `using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

public enum SensorType { Radar, Sonar, ESM, AIS }

public interface ISensorParser {
    /// <returns>Parsed Track, or null if payload is malformed</returns>
    Track ParseRecord(byte[] rawPayload);
}

// ════════════════════════════════════════════════════════════════════
// TODO: Complete using registry/factory pattern
// ════════════════════════════════════════════════════════════════════
public class SensorIngestionService {
    private readonly Dictionary<SensorType, ISensorParser> _parsers = new();
    private readonly ConcurrentDictionary<string, Track> _activeTracks = new();

    /// <summary>Register a parser for a sensor type.</summary>
    public void RegisterParser(SensorType type, ISensorParser parser) {
        // ── YOUR CODE HERE ────────────────────────────────────────



    }

    /// <summary>
    /// Ingest raw payload:
    ///  1. Throw if no parser registered for type.
    ///  2. Parse, then store if non-null and Valid.
    /// </summary>
    public void Ingest(SensorType type, byte[] rawData) {
        // ── YOUR CODE HERE ────────────────────────────────────────



    }

    public IReadOnlyDictionary<string, Track> ActiveTracks => _activeTracks;
}

public abstract class Track {
    public abstract string Id      { get; }
    public abstract bool   IsValid { get; }
}`,
      cpp: `#include <unordered_map>
#include <functional>
#include <memory>
#include <stdexcept>
using namespace std;

enum class SensorType { RADAR, SONAR, ESM, AIS };

struct Track {
    string id;
    bool valid;
};

// Parser is a callable returning shared_ptr<Track>
using SensorParser = function<shared_ptr<Track>(const vector<uint8_t>&)>;

class SensorIngestionService {
    unordered_map<int, SensorParser>              parsers;
    unordered_map<string, shared_ptr<Track>>      activeTracks;

public:
    void registerParser(SensorType type, SensorParser parser) {
        // ── YOUR CODE HERE ────────────────────────────────────────



    }

    void ingest(SensorType type, const vector<uint8_t>& rawData) {
        // ── YOUR CODE HERE ────────────────────────────────────────



    }

    const auto& getActiveTracks() const { return activeTracks; }
};`
    },
    solutions: {
      java: `    // registerParser:
    parsers.put(type, parser);

    // ingest:
    SensorParser parser = parsers.get(type);
    if (parser == null) {
        throw new IllegalArgumentException("No parser registered for: " + type);
    }
    Track track = parser.parseRecord(rawData);
    if (track != null && track.isValid()) {
        activeTracks.put(track.getId(), track);
    }`,
      csharp: `    // RegisterParser:
    _parsers[type] = parser ?? throw new ArgumentNullException(nameof(parser));

    // Ingest:
    if (!_parsers.TryGetValue(type, out var parser))
        throw new InvalidOperationException($"No parser registered for {type}");
    var track = parser.ParseRecord(rawData);
    if (track != null && track.IsValid)
        _activeTracks[track.Id] = track;`,
      cpp: `    // registerParser:
    parsers[(int)type] = std::move(parser);

    // ingest:
    auto it = parsers.find((int)type);
    if (it == parsers.end())
        throw std::invalid_argument("No parser registered for sensor type");
    auto track = it->second(rawData);
    if (track && track->valid)
        activeTracks[track->id] = track;`
    },
    tests: [
      { name: 'registerParser stores parser',         fn: 'testRegisterStores' },
      { name: 'ingest throws for unregistered type',  fn: 'testThrowsUnregistered' },
      { name: 'Malformed payload (null) not stored',  fn: 'testNullPayloadNotStored' },
      { name: 'Invalid track not stored',             fn: 'testInvalidTrackNotStored' },
      { name: 'Valid track stored with correct ID',   fn: 'testValidTrackStored' },
      { name: 'Two sensor types work independently',  fn: 'testMultiSensorTypes' },
    ]
  }
};

/* =====================================================================
   WHITEBOARD CONTROLLER
===================================================================== */
class WhiteboardController {
  constructor() {
    this.currentProblem = 'trackIngestion';
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
    this.addOutputLine('info', `▸ Problem: ${prob.name}`);
    this.addOutputLine('info', `▸ Language: ${lang.toUpperCase()}`);
    this.addOutputLine('info', `Click "Run Tests" to validate.`);
    this.showSolution = false;
  }

  runTests() {
    this.clearOutput();
    const prob  = WB_PROBLEMS[this.currentProblem];
    const code  = this.editor ? this.editor.value : '';
    const lang  = this.currentLang;

    if (lang !== 'java' && lang !== 'csharp') {
      this.addOutputLine('info', `[ Note ] Browser execution only supports Java/C# pseudovalidation.`);
      this.addOutputLine('info', `[ C++ ] Static analysis only — check logic manually.`);
      this.runStaticAnalysis(prob, code, lang);
      return;
    }

    this.addOutputLine('info', `Running ${prob.tests.length} test cases…`);
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
      this.addOutputLine('pass', `✓ ALL ${total} TESTS PASSED (${pct}%)`);
    } else {
      this.addOutputLine('fail', `✗ ${passed}/${total} passed (${pct}%)`);
      this.addOutputLine('info', `Hint: Check guard clauses and edge cases.`);
    }
  }

  evaluateTest(fnName, code, lang, prob) {
    const c = code.toLowerCase();
    const has = (str) => c.includes(str.toLowerCase());

    // Heuristic static analysis — checks for key patterns in the code
    switch(fnName) {
      // ── Track Ingestion tests ──
      case 'testNullRejected':
        return { pass: has('== null') || has('=== null') || has('!track') || has('is null'), hint: 'Add a null guard at the top of the method.' };
      case 'testEmptyIdRejected':
        return { pass: has('isempty') || has('empty()') || has('.length') || has('string.isnullorempty') || has('trackid == null'), hint: 'Check for null or empty ID string.' };
      case 'testLatOOBRejected':
        return { pass: (has('< -90') || has('< -90.0')) && (has('> 90') || has('> 90.0')), hint: 'Validate lat is within [-90, 90].' };
      case 'testLonOOBRejected':
        return { pass: (has('< -180') || has('< -180.0')) && (has('> 180') || has('> 180.0')), hint: 'Validate lon is within [-180, 180].' };
      case 'testValidStored':
        return { pass: has('.put(') || has('[track') || has('_activetracks[') || has('activetracks['), hint: 'Store the track in the map after validation.' };
      case 'testDuplicateOverwrites':
        return { pass: has('.put(') || has('[track') || has('_activetracks['), hint: 'Use map.put() to overwrite existing entries automatically.' };

      // ── Threat Allocator tests ──
      case 'testNullInput':
        return { pass: has('== null') || has('isempty') || has('.isempty()') || has('.count == 0'), hint: 'Guard against null/empty list.' };
      case 'testKZero':
        return { pass: has('k <= 0') || has('k == 0') || has('<= 0'), hint: 'Guard against k ≤ 0.' };
      case 'testNeutralizedExcluded':
        return { pass: has('!track.isneutralized') || has('!isneutralized') || has('isneutralized == false') || has('!t.isneutralized'), hint: 'Filter out neutralized tracks.' };
      case 'testFriendlyExcluded':
        return { pass: has('ishostile') || has('is_hostile') || has('.hostile'), hint: 'Only include hostile tracks.' };
      case 'testLowestTTIFirst':
        return { pass: has('priorityqueue') || has('orderby') || has('sort') || has('priority_queue') || has('compareto') || has('double.compare'), hint: 'Use a PriorityQueue (Java) or OrderBy (C#) ordered by TTI ascending.' };
      case 'testKCap':
        return { pass: has('.size() < k') || has('.count < k') || has('result.size() < k') || has('.take(k)') || has('take(k)'), hint: 'Stop after collecting k results.' };

      // ── Sensor Parser tests ──
      case 'testRegisterStores':
        return { pass: has('.put(') || has('parsers[') || has('_parsers['), hint: 'Store the parser in the map inside registerParser().' };
      case 'testThrowsUnregistered':
        return { pass: has('throw') && (has('illegalargumentexception') || has('invalidoperationexception') || has('invalid_argument') || has('throw new')), hint: 'Throw an exception if no parser is registered for the type.' };
      case 'testNullPayloadNotStored':
        return { pass: has('!= null') || has('track != null') || has('is not null') || has('track &&'), hint: 'Check parseRecord() result is not null before storing.' };
      case 'testInvalidTrackNotStored':
        return { pass: has('isvalid') || has('is_valid') || has('.isvalid()') || has('.valid'), hint: 'Check track.isValid() before storing.' };
      case 'testValidTrackStored':
        return { pass: has('.put(') || has('activetracks[') || has('_activetracks['), hint: 'Store the valid track by its ID.' };
      case 'testMultiSensorTypes':
        return { pass: has('.put(') || has('parsers['), hint: 'The map handles multiple keys independently.' };

      default:
        return { pass: true };
    }
  }

  runStaticAnalysis(prob, code, lang) {
    const checks = [
      { check: code.includes('nullptr') || code.includes('!track'), pass: code.includes('!track') || code.includes('if (!track)'), label: 'Null/nullptr guard' },
      { check: true, pass: code.includes('throw') || code.includes('return {}'), label: 'Error handling / early return' },
      { check: true, pass: code.includes('activeTracks') || code.includes('active_tracks'), label: 'Map storage found' },
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
      const marker = '// ── YOUR CODE HERE ──────────────────────────────────────────';
      const endMarker = '// ────────────────────────────────────────────────────────────';
      let filled = t;
      const sol = prob.solutions[this.currentLang];
      if (t.includes(marker)) {
        filled = t.replace(
          marker + '\n\n\n\n        // ────────────────────────────────────────────────────────────',
          marker + '\n' + sol + '\n        // ────────────────────────────────────────────────────────────'
        );
        if (filled === t) {
          // try simpler replacement
          filled = t.replace(marker, marker + '\n' + sol);
        }
      }
      if (this.editor) this.editor.value = filled;
      this.addOutputLine('info', `[ SOLUTION ] Shown for ${this.currentLang.toUpperCase()} — study the pattern.`);
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

// Exported reference — initialized from ORCA.html after DOM load
window.whiteboardController = null;

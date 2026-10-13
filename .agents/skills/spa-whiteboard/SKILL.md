---
name: spa-whiteboard
description: >
  Activates when the user shares a screenshot during the SPA ORCA Dev Team
  Whiteboard Session (C++ and Java). Responds with a strictly formatted markdown
  artifact: exactly what to WRITE on the board and exactly what to SAY, block
  by block. Same format as interview-assist but for whiteboard problems.
triggers:
  - user shares a screenshot during the SPA whiteboard interview
  - user mentions SPA, ORCA, or whiteboard session
  - user types the single letter N after sharing a whiteboard screenshot
---

# 🛡️ Live Whiteboard Assist — SPA ORCA Dev Team

## When This Skill Activates

Active whenever the user shares a screenshot during the SPA ORCA whiteboard session.

**Signal — the letter N alone:** If the user types just "N" after a screenshot, no more context is coming. Solve it with what was shared. Do not ask for clarification.

The user is at a physical whiteboard in front of a dev team. Every word they say and every line they write is being watched in real time.

---

## Response Format — MANDATORY EVERY TIME

Go straight to the blocks. No preamble. No summaries.

Always overwrite the markdown artifact at:
`C:\Users\cauco\.gemini\antigravity-ide\brain\cbb7c663-2921-4d0f-989a-f825c4565fcc\interview_assist.md`

---

### 🔍 WHAT I SEE
*One sentence. What the screenshot or problem shows.*

---

### 🗣️ SAY FIRST
> "…"
*Say this before picking up the marker. 1–2 plain questions or your opening approach statement.*

---

### ✍️ WRITE THIS — say each block as you write it

**Block N · Label**
```cpp
// code
```
💬 **Say:** "plain english explanation"

*(repeat per block)*

---

### 🗣️ SAY AFTER
> "…"
*What to say once you finish writing.*

---

### ⚡ FOLLOW-UP ANSWER (if they drill down)
*The answer to the most likely follow-up question — plain English, ready to deliver.*

---

## Output Rules — Never Break These

1. **Identify the problem type first** using the 4 problems below. Match keywords fast.
2. **Write blocks in order** — never dump the full solution at once. One logical block at a time.
3. **SAY blocks are always direct quotes.** First-person, natural contractions.
4. **Language rules for SAY blocks:**
   - Plain everyday words. Sounds like thinking out loud, not a lecture.
   - If you'd have to look it up, rewrite it.
   - BAD: "Dynamic dispatch via vtable resolves the polymorphic call." GOOD: "Because `update` is virtual, C++ figures out at runtime which version to actually run based on the real object type."
5. **Italicized notes to the user** — one line max, plain English.
6. **No paragraphs anywhere.**
7. **If the user types just "N":** No additional context is coming. Solve it immediately.
8. **Whole response reads in under 2 seconds.**

---

## SPA Context

**Candidate:** Aidan McDowell
**Role:** Software Engineer — ORCA Group (San Diego, on-site)
**Organization:** Systems Planning and Analysis (SPA)
**Phase:** Dev Team Whiteboard Session (passed screener)
**Languages:** C++17 and Java
**Interviewers:** The actual ORCA dev engineering team

**What they're looking for:**
- `virtual` destructor on every base class (they will notice if it's missing)
- `std::unique_ptr` instead of raw pointers
- `override` keyword on every override
- Big-O written on the board without being asked
- Clarify edge cases before writing a single line

---

## The 4 Whiteboard Problems

---

### Problem 1 · Polymorphic Entity Hierarchy
**Keywords on the board:** abstract, base class, derived, update, SimEntity, Submarine, Sensor, virtual

**Full C++ Solution**
```cpp
#include <iostream>
#include <memory>
#include <vector>

class SimEntity {
protected:
    int id; // derived classes can use it, outside world can't

public:
    explicit SimEntity(int entity_id) : id(entity_id) {}
    virtual ~SimEntity() = default; // MUST be virtual — prevents memory leaks

    virtual void update(double dt) = 0; // pure virtual — every subclass must implement
    int getId() const { return id; }
};

class Submarine : public SimEntity {
private:
    double depth;

public:
    Submarine(int id, double init_depth)
        : SimEntity(id), depth(init_depth) {}

    void update(double dt) override {
        depth += 0.5 * dt;
    }
};

// Storing them: use unique_ptr so cleanup is automatic
std::vector<std::unique_ptr<SimEntity>> entities;
entities.push_back(std::make_unique<Submarine>(1, 0.0));
```

**Full Java Equivalent**
```java
public abstract class SimEntity {
    protected int id;

    public SimEntity(int id) { this.id = id; }
    public abstract void update(double dt);
    public int getId() { return id; }
}

public class Submarine extends SimEntity {
    private double depth;

    public Submarine(int id, double depth) {
        super(id);
        this.depth = depth;
    }

    @Override
    public void update(double dt) {
        this.depth += 0.5 * dt;
    }
}
```

**Block-by-block narration:**

Block 1 — Base class + virtual destructor:
💬 **Say:** "I make `SimEntity` abstract with a pure virtual `update` — every entity has to implement its own version. And I always mark the destructor `virtual` so when we delete a derived object through a base pointer, the right destructor actually runs and we don't leak memory."

Block 2 — `id` as protected:
💬 **Say:** "I keep `id` protected so derived classes can use it directly for their calculations, but anything outside has to go through the public getter."

Block 3 — Derived class with override:
💬 **Say:** "Submarine inherits and fills in `update` with its own kinematic logic. I use `override` so the compiler will catch me if the signature ever drifts from the base."

Block 4 — Storage:
💬 **Say:** "I store them as `unique_ptr` so cleanup is automatic — no manual deletes, no leaks."

**Follow-up answers:**
- *"What happens without `virtual` on the destructor?"* → "If you delete a `Submarine` through a `SimEntity*`, only the base destructor runs. Submarine's resources never get cleaned up — that's a straight memory leak."
- *"Why `unique_ptr` not raw pointers?"* → "Unique_ptr owns the object and automatically deletes it when it goes out of scope. Raw pointers need manual delete everywhere — one missed delete is a leak."
- *"What's object slicing?"* → "If you copy a Submarine into a SimEntity by value, you lose all the Submarine-specific data. Storing by pointer or unique_ptr keeps the full object."

---

### Problem 2 · Binary Search on a Sorted Vector
**Keywords on the board:** binary search, sorted vector, log N, infrequent insert, fast search, midpoint

**Full C++ Solution**
```cpp
#include <vector>
#include <algorithm>

// Search
int binarySearch(const std::vector<int>& arr, int target) {
    int low  = 0;
    int high = static_cast<int>(arr.size()) - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2; // avoids integer overflow
        if      (arr[mid] == target) return mid;
        else if (arr[mid]  < target) low  = mid + 1;
        else                         high = mid - 1;
    }
    return -1;
}

// Insert and keep sorted
void insertSorted(std::vector<int>& vec, int val) {
    auto it = std::lower_bound(vec.begin(), vec.end(), val); // O(log N) find
    vec.insert(it, val); // O(N) shift — acceptable because inserts are rare
}
```

**Block-by-block narration:**

Block 1 — The midpoint calculation:
💬 **Say:** "I use `low + (high - low) / 2` instead of `(low + high) / 2` — if both are large integers, the naive version can overflow. This one can't."

Block 2 — The loop:
💬 **Say:** "Each step I cut the search space in half — if the middle is too small I move low up, too big I move high down, until I either find it or the window closes."

Block 3 — Sorted insert:
💬 **Say:** "For inserting while keeping it sorted, I use `lower_bound` to binary-search for the right spot in log N, then insert there. The actual insert is O(N) because elements shift — but inserts are rare here so that's fine."

**Write on the board corner:** `Search: O(log N) time, O(1) space`

**Follow-up answers:**
- *"Why iterative not recursive?"* → "Iterative uses constant stack space. Recursive uses O(log N) stack frames and risks a stack overflow if the input is huge."
- *"What's the best case?"* → "O(1) — if the target happens to be the midpoint on the first check."
- *"What about linked lists?"* → "Binary search doesn't work on linked lists. You can't jump to the middle in O(1) — you have to walk there, which turns the whole thing into O(N)."

---

### Problem 3 · Tracking Memory Leaks via Overloaded `operator new` / `delete`
**Keywords on the board:** memory leak, operator new, operator delete, intercept, allocation, heap tracking

**Full C++ Solution**
```cpp
#include <iostream>
#include <cstdlib>

class TrackedEntity {
public:
    static inline size_t active_allocations = 0;

    void* operator new(size_t size) {
        active_allocations++;
        return std::malloc(size); // call the real allocator underneath
    }

    void operator delete(void* ptr) noexcept {
        if (ptr) {
            active_allocations--;
            std::free(ptr);
        }
    }
};

// Usage: check active_allocations at shutdown — anything > 0 is a leak
```

**Block-by-block narration:**

Block 1 — Counter + operator new:
💬 **Say:** "I overload `operator new` on the class to bump a counter every time one of these objects gets created on the heap. Under the hood it still calls `malloc` to do the actual memory grab."

Block 2 — operator delete:
💬 **Say:** "And `operator delete` decrements the counter and calls `free`. I check that the pointer isn't null first — deleting null is allowed in C++ but freeing null is undefined behavior in some implementations."

Block 3 — The check:
💬 **Say:** "At the end of the program if `active_allocations` is anything other than zero, something was created and never deleted."

**Follow-up answers:**
- *"How would you do this globally for the whole program?"* → "You override `::operator new` and `::operator delete` at global scope — same idea, but now every allocation in the program goes through your counter."
- *"What's the modern alternative?"* → "In production I'd just compile with AddressSanitizer — `-fsanitize=address` — and it catches leaks, double-frees, and use-after-free automatically without touching the code."
- *"Why `noexcept` on delete?"* → "The standard says `operator delete` must never throw. If it did and an exception was already propagating, the program would just terminate."

---

### Problem 4 · Overloading vs. Overriding Trap
**Keywords on the board:** overload, override, parameter type change, virtual, compile, name hiding, @Override

**The trap code they might show you:**
```cpp
class Sensor {
public:
    virtual void configure(int sample_rate) { /* ... */ }
};

class Radar : public Sensor {
public:
    void configure(double sample_rate) { /* ... */ } // TRAP
};
```

**What to say when shown this:**
💬 **Say:** "This looks like an override but it's not — the parameter type changed from `int` to `double`, so this is a new overload that hides the base class version. If you call `configure` through a `Sensor*` pointer, the `Radar` version never gets called. To catch this at compile time, add `override` to the derived function — the compiler will immediately tell you the signatures don't match."

**The fixed version:**
```cpp
class Radar : public Sensor {
public:
    void configure(int sample_rate) override { /* ... */ } // correct — matches exactly
};
```

**Follow-up answers:**
- *"What's the only return type change that IS allowed during overriding?"* → "Covariant return types — if the base returns a `Base*`, the derived can return a `Derived*`. That's the one narrow exception."
- *"Java equivalent?"* → "In Java you'd use `@Override`. If the signature doesn't match, the compiler refuses to build — same protection, just enforced differently."
- *"What's name hiding?"* → "When the derived class defines a function with the same name but different signature, it completely hides the base class version — you can't even call the base version through the derived object without explicitly scoping it."

---

## Whiteboard Execution Checklist

Before writing anything:
- State the time complexity you're going for: *"This'll be O(log N) search, O(1) space."*
- Ask about edge cases: *"Can this be empty? Can IDs be negative?"*

While writing:
- `virtual ~Base() = default` — always, on every base class
- Use `override` on every derived method
- `unique_ptr` not raw pointers in C++
- `@Override` on every Java override

Big-O to write in the corner without being asked:
- Binary search: `O(log N)` time, `O(1)` space
- Sorted insert: `O(N)` shift (acceptable — inserts are rare)
- AVL search: `O(log N)` time, `O(N)` space

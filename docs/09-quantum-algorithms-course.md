# Quantum Algorithms — Full Course Content (Lesson & Screen Level)

**Status:** Finalized — Step 2 of content design, second of three courses
**Phase:** Task 2a, full lesson/screen breakdown 
**Last updated:** June 2026
**Depends on:** Course Narratives Spine (chapter-level spine, finalized); shares all structural conventions with the Quantum Machine Learning course

---

## How to Read This Document

Same conventions as the Quantum Machine Learning course: each chapter is broken into 4-5 lessons, each lesson into 5-9 screens tagged with a screen type (`explanation`, `question`, `simulation`), alternating explanation with embedded question, closing each lesson with a short unscaffolded practice set. Precision distinctions — "exact vs. approximate," "proven vs. conjectured," "today vs. theoretically possible" — are stated explicitly the first time they become relevant, rather than left implicit, the same standard applied throughout the QML course.

**Independence from the Quantum Machine Learning course:** this course is self-contained and does not assume QML has been taken. Chapter 1 reintroduces qubits, superposition, and the Bloch sphere from scratch, reusing the same interactive widget rather than re-deriving the physics from a different angle — consistent with Brilliant.org's own course-independence pattern.

**Source grounding:** content is written in the structural rhythm of Brilliant.org's quantum computing course material covering gates, entanglement, teleportation, superdense coding, oracle-based search, and quantum cryptography. Technical claims — Grover's algorithm's mechanics, Shor's algorithm's structure, current NIST post-quantum cryptography standards — were verified directly against current technical sources during content preparation, the same standard applied throughout the QML course.

---

## Chapter 1: Gates, Circuits, and What "Computing" Means Here

*Spine hook: a classical algorithm is a sequence of logic gates; a quantum algorithm is a sequence of quantum gates. This chapter reintroduces qubits/superposition/Bloch sphere from scratch (course independence), then moves into gates and circuits as the actual subject. The Bloch sphere widget is reused here exactly as specified in the QML course — same interaction modes, same `Screen.content` shape — not re-specified from zero.*

### Lesson 1.1 — Qubits, Quickly (A Self-Contained Refresher)

**Learning goal:** get a learner who has *not* taken the QML course to a working qubit/superposition/Bloch-sphere foundation fast, without re-deriving everything from a black-box puzzle the way QML Ch.2 did — this is deliberately a faster, more direct refresher, since this course's real subject is circuits and algorithms, not the foundations themselves.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | A qubit is a two-state quantum system, written \|0⟩ and \|1⟩, that can also exist in a **superposition** — a combination \|ψ⟩ = a\|0⟩ + b\|1⟩, where measuring it returns \|0⟩ with probability a² or \|1⟩ with probability b² (a²+b² = 1). Until measured, both possibilities are genuinely "in play" at once — not merely unknown to us. |
| 2 | simulation | Bloch sphere widget (free-placement mode, reused identically from the QML course). Learner drags the arrow around the sphere and watches the live a/b-coefficient and probability readout — the same widget, same interaction, no new engineering required. |
| 3 | question (MCQ) | "On the Bloch sphere, where does a qubit with exactly 50% probability of measuring \|0⟩ and 50% of measuring \|1⟩ sit?" Options: At the north pole · At the south pole · ✓ Somewhere on the equator · Outside the sphere. |
| 4 | explanation (reveal) | Confirms — and notes the scope honestly: this picture works for a single, isolated qubit's pure state. Once two qubits become entangled (Lesson 2.x of this chapter), neither one individually has its own arrow anymore — a different picture is needed, covered when it's actually relevant. |

### Lesson 1.2 — Gates: The Verbs of Quantum Computing

**Learning goal:** establish gates as the basic operations, covering X, H, Z explicitly and grounding them physically as Bloch-sphere rotations — same gates as QML Ch.2, same widget, presented at a slightly faster pace since this is a refresher for returning learners and a first pass for new ones.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | A quantum gate is an operation that transforms a qubit's state — visually, it rotates the Bloch arrow to a new position. Gates are the quantum equivalent of classical logic gates (AND, OR, NOT), but because a qubit's state is continuous (any point on the sphere, not just two values), gates can do more than flip a bit — they can create and manipulate superposition. |
| 2 | simulation | Bloch sphere widget, gate-application mode. Learner applies X (north→south flip), then H (creates \|+⟩ from \|0⟩), watching each transformation live. |
| 3 | question (MCQ) | "Which gate is the standard way to create an equal superposition from a definite state like \|0⟩?" Options: X · Z · ✓ Hadamard (H) · Measurement. |
| 4 | explanation | Introduces Z briefly, completing the trio used throughout this course: Z leaves \|0⟩ unchanged but flips the *phase* of \|1⟩ (a sign flip that isn't visible in simple \|0⟩/\|1⟩ probabilities, but matters enormously once interference comes into play, starting in Chapter 3's oracle-based algorithms). |
| 5 | explanation | One precision note worth planting now, since it becomes directly relevant later (Chapter 5's Quantum Fourier Transform specifically): the "phase flip" Z performs is a sign flip — multiplying by −1 — but that's actually a special case of something more general. In full generality, a quantum state's coefficients can be complex numbers, and "phase" can be any point on a circle (mathematically, e^iφ for any angle φ), not just +1 or −1. This course keeps the visuals simple by mostly using gates whose effects are sign flips or real-valued rotations, but the more general complex-phase picture is what's actually running underneath, and Chapter 5 will use it directly. |
| 6 | question (MCQ) | "Why might a Z gate's effect be invisible if you only check the probability of measuring \|0⟩ vs \|1⟩?" Options: Z doesn't actually change anything · ✓ Z changes phase, not measurement probability directly — its effect shows up through interference with other gates, not in isolation · Z only works on \|1⟩ · Z is identical to X. |

### Lesson 1.3 — Building Circuits: Gates in Sequence

**Learning goal:** move from single gates to circuits — sequences of gates across one or more qubits, read left to right, the standard circuit-diagram convention seen throughout the uploaded decks.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | A quantum circuit is a sequence of gates applied to one or more qubits, drawn left to right on horizontal lines (one line per qubit) — the same diagram convention used throughout the Brilliant materials referenced for this course. Reading a circuit diagram is mechanical: follow each qubit's line, apply each gate it passes through, in order. |
| 2 | explanation | A single-qubit circuit (H, then X, then measure) is simple to trace by hand. With two or more qubits, circuits can include gates that act on multiple qubits at once — these are where genuinely new behavior, not reachable with single-qubit gates alone, starts to appear (the subject of Lesson 1.4 and Chapter 2). |
| 3 | question (MCQ) | "In a quantum circuit diagram, what does each horizontal line represent?" Options: A classical bit · ✓ One qubit, tracked through the sequence of gates it passes through · A measurement event · A unit of time, unrelated to qubits. |
| 4 | explanation | One unifying fact worth knowing before circuits start getting more complex: a small handful of gates — including the ones already covered, plus CNOT (coming up next) — form what's called a **universal gate set**. This means any quantum operation whatsoever, no matter how complex, can be built (or at least closely approximated) by chaining together gates from that small set. This is the direct quantum analogue of how a handful of classical logic gates (like NAND alone) can build any classical circuit — it's the fact that turns "here are a few gates" into "here is everything you'll ever need," and is exactly why courses (and real hardware) focus on a small gate vocabulary rather than an endless list. |
| 5 | question (MCQ) | "What does it mean for a small set of gates to be 'universal'?" Options: They are the only gates that physically exist · ✓ Any quantum operation can be built, or closely approximated, by combining gates from that set · They can only be used once per circuit · They replace the need for qubits. |

### Lesson 1.4 — Two Qubits, and the First Genuinely Two-Qubit Gate

**Learning goal:** introduce the CNOT gate as the bridge to Chapter 2's entanglement content — the first gate in this course whose behavior cannot be understood one qubit at a time.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Every gate so far has acted on one qubit independently. The **CNOT** (controlled-NOT) gate acts on two: a control qubit and a target qubit. The rule: if the control qubit is \|1⟩, flip the target; if the control is \|0⟩, leave the target alone. On its own, this looks like a fancy classical conditional — the genuinely new behavior shows up when the control qubit is in superposition, not a definite \|0⟩ or \|1⟩. |
| 2 | question (MCQ) | "A CNOT gate has its control qubit in state \|1⟩ and its target in state \|0⟩. What happens to the target?" Options: ✓ It flips to \|1⟩ · It stays \|0⟩ · It becomes a superposition · It is measured immediately. |
| 3 | explanation (reveal) | Confirms — and poses the genuinely interesting follow-up question that Chapter 2 exists to answer: what happens if the control qubit is in *superposition* — neither definitely \|0⟩ nor definitely \|1⟩ — when CNOT is applied? The intuitive classical answer ("it depends, randomly") turns out to be wrong in a very specific and useful way, which is exactly where Chapter 2 begins. |

**End-of-chapter practice set (6 questions, unscaffolded):**
1. (MCQ) What does the Hadamard gate do to \|0⟩? → produces an equal superposition (the \|+⟩ state).
2. (MCQ) Why is the effect of a Z gate not visible in simple \|0⟩/\|1⟩ measurement probabilities? → it changes phase, which only shows up through interference, not direct measurement.
3. (MCQ) Is "phase" limited to just +1 and −1 in general quantum mechanics? → no — phase can be any point on a circle (complex e^iφ); sign flips are a special case.
4. (MCQ) What does it mean for a gate set to be universal? → any quantum operation can be built or closely approximated using only gates from that set.
5. (MCQ) In a circuit diagram, what does the left-to-right order of gates on a line represent? → the order in which operations are applied to that qubit, over time.
6. (MCQ) What makes CNOT fundamentally different from every single-qubit gate covered so far? → it acts on two qubits jointly, and its effect on the target depends on the control qubit's state.

---

## Chapter 2: Entanglement: Bell States and Teleportation

*Spine hook: two qubits can be correlated in a way that has no classical analogue — a genuine computational resource, not just a curiosity. This chapter is directly grounded in the uploaded `Entanglement.pptx`, `Quantum_Teleportation.pptx`, `Superdense_Coding.pptx`, and `Superdense_Coding_with_Q_.pptx` decks. **Bloch-sphere scope caveat applies starting here**, per the note seeded in Lesson 1.1: individual entangled qubits no longer have their own well-defined arrow.*

### Lesson 2.1 — Building a Bell State

**Learning goal:** construct the simplest entangled state directly, via the H+CNOT recipe, and show concretely why it can't be described as "qubit A is in some state, and qubit B is in some state" separately.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Take two qubits, both starting at \|0⟩. Apply a Hadamard to the first qubit (creating superposition), then a CNOT with that first qubit as control and the second as target. The result is called a **Bell state**: \|00⟩ + \|11⟩ (normalized), and it has a genuinely strange property worth sitting with: if you measure the first qubit and get \|0⟩, the second qubit is *guaranteed* to also read \|0⟩ if measured — and the same for \|1⟩. Yet before measurement, neither qubit individually was definitely \|0⟩ or \|1⟩. |
| 2 | question (MCQ) | "Two qubits are prepared in a Bell state. The first is measured and gives \|1⟩. What do you know about the second qubit, before even measuring it?" Options: Nothing — it's still completely random · ✓ It is now certain to measure \|1⟩ as well · It is now certain to measure \|0⟩ · It no longer exists. |
| 3 | explanation (reveal) | Confirms, and names the key conceptual point directly: this correlation is **entanglement**, and it's fundamentally different from a classical correlation (like two coins glued together, both always landing the same way) — a classical pair has a definite state all along, just unknown to you; an entangled pair genuinely has no definite individual states until measurement, only a definite *joint* outcome. |
| 4 | explanation | Names the scope limit flagged back in Lesson 1.1, now directly relevant: the Bloch sphere — one arrow per qubit — cannot represent either qubit of this Bell state individually. Describing an entangled pair properly requires tracking the *joint* two-qubit state, not two separate single-qubit pictures. This isn't a failure of the Bloch sphere; it's a sign that entanglement is information that doesn't live in either qubit alone. |
| 5 | explanation | A genuinely important misconception worth heading off right here, before any protocol built on entanglement is introduced: entanglement, by itself, **cannot be used to send any information at all.** If Alice does something to her qubit of a Bell pair — applies a gate, measures it — Bob's qubit's *measurement statistics*, considered on their own with no other information, are completely unaffected and look exactly the same either way. Bob has no way to detect, from his qubit alone, whether Alice has done anything yet. This is called the **no-communication theorem**, and it's the deeper reason teleportation still needs a classical channel: entanglement provides correlation, not signaling. |
| 6 | question (MCQ) | "Alice has a Bell pair partner with Bob. She applies a gate to her qubit. Without any classical message from Alice, can Bob detect that she did anything, just by looking at his own qubit's statistics?" Options: Yes, immediately · ✓ No — this is exactly what the no-communication theorem rules out; entanglement alone carries no signal · Only if they are far apart · Only if Alice measures first. |

### Lesson 2.2 — Entanglement Is a Resource, Not Just a Curiosity

**Learning goal:** make explicit why entanglement matters computationally — framing it as fuel for protocols, previewing teleportation and superdense coding as concrete payoffs.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Entanglement isn't just a strange phenomenon to marvel at — it's a genuine resource, the same way a classical shared secret key is a resource for cryptography. Once two parties share an entangled pair (one qubit each, possibly separated by a large distance), that shared entanglement enables protocols with no classical equivalent. This lesson previews two of the most famous: **quantum teleportation** (sending a qubit's exact state using entanglement plus two classical bits) and **superdense coding** (sending two classical bits using entanglement plus one qubit) — together, a clean illustration that entanglement, classical communication, and qubit transmission can substitute for each other in specific, precise ways. |
| 2 | question (MCQ) | "Why is entanglement described as a 'resource' rather than just an interesting effect?" Options: It can be bought and sold · ✓ Once established, it enables specific communication/computation protocols that are impossible without it · It makes qubits last longer · It only matters for cryptography. |

### Lesson 2.3 — Quantum Teleportation

**Learning goal:** walk the teleportation protocol step by step, directly modeled on the uploaded `Quantum_Teleportation.pptx` deck's pacing, while being precise about what "teleportation" does and does not mean (no faster-than-light signaling, no cloning).

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | The setup: Alice has a qubit in some unknown state she wants to send to Bob. She can't just measure it and tell Bob the result classically — measuring would collapse it and destroy the very superposition she's trying to send (the same collapse rule that applies throughout this course). Teleportation solves this using a shared Bell pair. |
| 2 | explanation | The protocol, in order: (1) Alice and Bob each hold one qubit of a pre-shared Bell pair. (2) Alice applies a CNOT gate using her unknown qubit as the control and her half of the Bell pair as the target, **then** applies a Hadamard gate specifically to the original unknown qubit (in that order — the Hadamard comes after the CNOT, and lands only on the unknown qubit, not the Bell-pair qubit). (3) She then measures both of her qubits, getting two classical bits. (4) Alice sends those two classical bits to Bob over an ordinary classical channel. (5) Bob applies one of four possible correction gates to his qubit, chosen based on which two bits he received. After this, Bob's qubit is in exactly the state Alice's original qubit was in. |
| 3 | question (drag-to-order) | "Order the steps of the teleportation protocol." Items: Alice measures her two qubits · Alice and Bob share a Bell pair · Bob applies a correction gate based on the received bits · Alice sends two classical bits to Bob · Alice applies CNOT (unknown qubit as control, her Bell-pair qubit as target) · Alice applies Hadamard to the unknown qubit. Correct order: share Bell pair → CNOT → Hadamard on the unknown qubit → Alice measures both her qubits → Alice sends two classical bits → Bob applies correction. |
| 4 | explanation (reveal) | Confirms the order, then closes two common misconceptions directly, since they trip up almost everyone learning this for the first time: **(1)** This is not faster-than-light communication — Bob's qubit isn't usable until he receives Alice's two classical bits, and those travel at or below light speed, same as any classical signal. **(2)** This is not cloning — Alice's original qubit is destroyed by her measurement in step 2 (consistent with no-cloning); only one copy of the state ever exists, it just moves from Alice's qubit to Bob's. |
| 5 | question (MCQ) | "Does quantum teleportation allow faster-than-light communication?" Options: Yes, that's the entire point · ✓ No — Bob needs Alice's classical bits, which travel no faster than light, before his qubit is usable · Only over short distances · Only if the qubits are pre-measured. |

### Lesson 2.4 — Superdense Coding: The Mirror-Image Protocol

**Learning goal:** show superdense coding as teleportation's structural inverse — directly grounded in the uploaded `Superdense_Coding.pptx` / `Superdense_Coding_with_Q_.pptx` decks — reinforcing the "entanglement substitutes for resources, precisely" framing from Lesson 2.2.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Teleportation sends one qubit's state using entanglement plus two classical bits. Superdense coding does roughly the reverse: it sends **two classical bits** of information using entanglement plus the transmission of just **one qubit**. The setup: Alice and Bob again share a Bell pair. Alice wants to send Bob one of four possible two-bit messages (00, 01, 10, or 11). |
| 2 | explanation | The protocol: Alice applies one of four specific gate combinations to her half of the Bell pair, depending on which two-bit message she wants to send (one combination per possible message). She then sends just that one qubit to Bob. Bob, now holding both qubits of the original Bell pair, applies a fixed two-qubit measurement that perfectly distinguishes which of the four operations Alice performed — recovering both bits exactly. |
| 3 | question (MCQ) | "What does superdense coding allow Alice to send, using one transmitted qubit plus pre-shared entanglement?" Options: One classical bit · ✓ Two classical bits · An unlimited amount of classical information · One full qubit of quantum information. |
| 4 | explanation (reveal) | Confirms, and draws the comparison explicit, since seeing both protocols side by side is what makes "entanglement as a substitutable resource" land: teleportation trades 2 classical bits + entanglement → 1 qubit of quantum information; superdense coding trades 1 transmitted qubit + entanglement → 2 classical bits. Same shared resource (a Bell pair), running in opposite directions to solve different problems — concrete evidence that entanglement isn't abstractly "powerful," it has a precise, quantifiable substitution value. |

**End-of-chapter practice set (6 questions, unscaffolded):**
1. (MCQ) What gate combination creates a Bell state from two \|0⟩ qubits? → Hadamard on the first qubit, then CNOT with that qubit as control.
2. (MCQ) Why can't the Bloch sphere represent either qubit of an entangled pair individually? → entanglement is information held jointly, not in either qubit's individual state.
3. (MCQ) What does the no-communication theorem say about shared entanglement alone? → it cannot be used to send any information; Bob's measurement statistics are unaffected by anything Alice does, without a classical message.
4. (MCQ) In teleportation, what is the correct gate order Alice applies, and to which qubits? → CNOT (unknown qubit as control, her Bell-pair qubit as target), then Hadamard on the unknown qubit specifically.
5. (MCQ) Why doesn't teleportation allow faster-than-light communication? → the receiver needs classical bits, which travel no faster than light, to complete the protocol.
6. (MCQ) How many classical bits can superdense coding send using one transmitted qubit plus a shared Bell pair? → two.

---

## Chapter 3: Search, But Quadratically Faster: Grover's Algorithm

*Spine hook: searching an unsorted list of N items classically takes, on average, N/2 checks; Grover's does it in roughly √N. This chapter's mechanics — phase-flip oracle, diffusion operator, (π/4)√N optimal iteration count — were verified directly against current sources during Step 2 prep, and are grounded structurally in the uploaded `Oracles_with_Q_.pptx`, `Problems_with_Oracle.pptx`, `Quantum_Parallelism.pptx`, and `Black_Box_Puzzle.pptx` decks.*

### Lesson 3.1 — The Search Problem, Stated Precisely

**Learning goal:** establish exactly what's being compared (classical unstructured search vs. Grover's) before any quantum mechanism is introduced, so the speedup claim lands precisely rather than vaguely.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | The problem: you have N items in no particular order (unsorted — no shortcuts like binary search apply), and exactly one of them satisfies some condition you can check. Classically, in the worst case you might have to check all N items; on average, about N/2. There's no cleverer classical approach for a *genuinely* unstructured search — this is a known, proven lower bound, not a temporary gap in classical algorithm design. |
| 2 | question (MCQ) | "Why can't a classical algorithm do better than roughly N/2 checks, on average, for a truly unstructured search of N items?" Options: Classical computers are too slow · ✓ With no structure to exploit, there's no way to rule out multiple candidates with a single check, unlike sorted-list search · It's possible, just not yet discovered · N must be very large for this to apply. |
| 3 | explanation | Grover's algorithm, published by Lov Grover in 1996, finds the marked item using roughly **√N** oracle queries — a quadratic speedup. Stated precisely, so it isn't oversold: this is a real, mathematically proven speedup for unstructured search specifically, and it's quadratic, not exponential — qualitatively different from (and much more modest than) the exponential speedups claimed for problems like factoring, covered later in this course. |

### Lesson 3.2 — The Oracle: Marking the Answer with Phase

**Learning goal:** introduce the phase-flip oracle precisely, as verified — marking via a sign flip on the amplitude, not a measurement or a label.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Grover's algorithm starts by putting all N possibilities into an equal superposition (via Hadamard gates on every qubit) — every candidate "exists" at once, each with the same small amplitude. The **oracle** is a black-box circuit that recognizes the correct answer and "marks" it — but it does this in a specifically quantum way: it flips the *sign* (phase) of the marked state's amplitude, leaving every other amplitude untouched. |
| 2 | explanation | This is genuinely strange the first time you see it: flipping a sign doesn't change a measurement probability at all (probability depends on the square of the amplitude, and (−a)² = a²) — so immediately after the oracle runs, if you measured right then, you'd see no difference whatsoever from before. The marking is real, but invisible until the next step does something with it. |
| 3 | question (MCQ) | "Immediately after the oracle phase-flips the marked state's amplitude, what would you observe if you measured the system right then?" Options: The marked state, with certainty · ✓ No detectable difference — the probabilities are unchanged, since squaring removes the sign · A classical error · The system collapses to all-zero. |

### Lesson 3.3 — The Diffusion Operator: Turning Phase Into Probability

**Learning goal:** explain the diffusion operator's "reflect about the average" mechanic, the step that actually converts the invisible phase-flip into a real, measurable probability boost.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | The second piece, the **diffusion operator**, takes the current set of amplitudes and reflects each one about their average. Picture a bar chart of all N amplitudes, all roughly equal in height, except one (the marked one) which is now negative instead of positive, from the oracle. Reflecting about the average pulls every amplitude toward — and the marked one *past* — the average, in a way that specifically boosts the marked amplitude's height while shrinking the others. |
| 2 | simulation | A simple bar-chart widget: learner sees N small bars (amplitudes), watches the oracle flip one bar negative, then watches the diffusion operator visually "reflect about the average," with the marked bar growing taller and the others shrinking slightly — directly visualizing the mechanism rather than asserting it. |
| 3 | question (MCQ) | "What does the diffusion operator do to the amplitudes after the oracle has phase-flipped the marked state?" Options: It measures the system · ✓ It reflects all amplitudes about their average, which amplifies the marked state's amplitude and shrinks the others · It deletes the unmarked states · It applies the oracle a second time. |
| 4 | explanation (reveal) | Confirms — and names the pairing explicitly: one application of "oracle, then diffusion operator" together is called a **Grover iteration**. A single iteration only boosts the marked amplitude a little; repeating the iteration boosts it further each time, which is exactly why this is an iterative algorithm, not a one-shot circuit. |

### Lesson 3.4 — How Many Iterations? And What Happens If You Do Too Many?

**Learning goal:** give the precise (π/4)√N iteration formula and the equally important, often-missed fact that *overshooting* makes things worse, not better — a genuinely good "pay attention" moment.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | The marked amplitude's growth across repeated Grover iterations follows a smooth, wave-like (sinusoidal) pattern — it rises toward a peak, but if you keep iterating past that peak, it actually starts falling back down again. The optimal number of iterations is approximately **(π/4)√N** — close to this number, the probability of measuring the correct answer approaches certainty; well past it, the probability degrades. |
| 2 | question (MCQ) | "What happens if you run significantly more Grover iterations than the optimal (π/4)√N?" Options: Nothing — more iterations always help · ✓ The success probability can actually decrease, since the amplitude oscillates past its peak and starts shrinking again · The algorithm crashes · It becomes exponentially faster. |
| 3 | explanation (reveal) | Confirms — and ties this back to the chapter's opening precision: the (π/4)√N scaling is exactly where the "quadratic speedup" claim comes from (√N iterations, each needing one oracle call, versus N classical checks) — but it also means Grover's algorithm isn't a "the more you run it, the better" tool; getting the iteration count right matters. |
| 4 | explanation | One practical limitation worth flagging directly: computing (π/4)√N requires actually **knowing N**, the size of the search space, in advance. If N isn't known precisely, the optimal iteration count can't be computed directly either — a real, practically relevant gap, not just a theoretical footnote. (There are workarounds, such as a related technique called quantum counting, that estimate N or the number of solutions without knowing it upfront — worth knowing such workarounds exist, even without covering them in depth here.) |
| 5 | explanation | A second generalization worth knowing: everything covered so far assumed exactly **one** marked item. If instead there are M marked items out of N (M known), the same oracle-and-diffusion approach still works, just with a different optimal iteration count: approximately (π/4)√(N/M) — fewer iterations needed as M grows, which matches intuition (more correct answers among the haystack should be easier to find). The mechanism is identical; only the iteration count formula changes. |
| 6 | question (MCQ) | "If a search space of size N has M marked (correct) items instead of just one, how does the optimal number of Grover iterations change?" Options: It stays exactly (π/4)√N regardless of M · ✓ It becomes approximately (π/4)√(N/M) — fewer iterations needed as M grows · It becomes (π/4)√(N×M) · Grover's algorithm cannot handle multiple marked items at all. |

**End-of-chapter practice set (7 questions, unscaffolded):**
1. (MCQ) What kind of speedup does Grover's algorithm provide over classical unstructured search? → quadratic (roughly √N vs. N), not exponential.
2. (MCQ) How does the Grover oracle "mark" the correct answer? → by flipping the sign (phase) of its amplitude, leaving measurement probability unchanged at that exact moment.
3. (MCQ) What does the diffusion operator do? → reflects all amplitudes about their average, amplifying the marked state's amplitude.
4. (MCQ) Roughly how many Grover iterations are optimal for a search space of size N (single marked item)? → approximately (π/4)√N.
5. (MCQ) What happens if you significantly exceed the optimal iteration count? → the success probability can decrease, since the amplitude oscillates past its peak.
6. (MCQ) What do you need to know in advance to compute the optimal iteration count directly? → N, the size of the search space (and M, the number of marked items, in the general case).
7. (MCQ) How does the optimal iteration count change with M marked items instead of one? → approximately (π/4)√(N/M).

---

## Chapter 4: The Crypto the Internet Runs On

*Spine hook: before showing how quantum computing breaks RSA, the learner needs to understand what RSA actually is and why it's considered secure today. This chapter is classical cryptography taught for a quantum payoff — every concept here exists specifically to set up Chapter 5's attack. The uploaded `Quantum_Cryptography.pptx` deck covers quantum key distribution (QKD, a genuinely different topic from RSA) rather than RSA itself, so this chapter is original content built to the spine's specification, cross-checked against standard cryptography references rather than adapted from a deck.*

### Lesson 4.1 — The Idea Behind Public-Key Cryptography

**Learning goal:** establish *why* RSA-style cryptography is structured the way it is — the "easy one way, hard the other way" asymmetry — before any specific math.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Classical (symmetric) encryption — like AES — uses the *same* secret key to lock and unlock a message. This works perfectly once both parties already share a key, but raises an obvious chicken-and-egg problem: how do you securely share that first key, over a channel someone might be listening to? |
| 2 | explanation | Public-key cryptography (RSA being the most famous example) solves this with a clever asymmetry: a mathematical operation that's easy to do in one direction, but extremely hard to undo without a special piece of information (the private key). Each user publishes a public key (anyone can use it to encrypt a message *to* them) and keeps a private key secret (needed to decrypt). The security of the whole system rests entirely on that "easy one way, hard to undo" asymmetry actually being hard. |
| 3 | question (MCQ) | "What's the core security idea behind public-key cryptography like RSA?" Options: The key is changed every few seconds · ✓ A mathematical operation that's easy to perform but extremely hard to reverse without a private key · Messages are sent through multiple servers · The key is physically hidden. |

### Lesson 4.2 — Modular Arithmetic and the Factoring Problem

**Learning goal:** introduce modular arithmetic concretely (clock arithmetic) and state the factoring problem precisely — the specific "hard to undo" operation RSA is built on.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Modular arithmetic is "clock arithmetic" — numbers wrap around after reaching a fixed value (the modulus). On a 12-hour clock, 9 + 5 = 2 (wrapping past 12), written 9 + 5 ≡ 2 (mod 12). RSA's math runs entirely in modular arithmetic, with a modulus that's the product of two large prime numbers. |
| 2 | explanation | RSA's specific "easy one way, hard to undo" operation is the **factoring problem**: multiplying two large prime numbers together is computationally easy (even by hand, for small examples), but given only the resulting product, finding the original two primes back out is, as far as anyone has proven, dramatically harder — and gets exponentially harder, classically, as the primes get larger. RSA's public key is built from that product; the private key requires knowing the original primes. |
| 3 | question (MCQ) | "What is the 'easy one way, hard to undo' operation that RSA's security is built on?" Options: Addition and subtraction · ✓ Multiplying two large primes (easy) versus factoring their product back into those primes (hard) · Encryption and decryption with the same key · Random number generation. |
| 4 | explanation (reveal) | Names the honest caveat directly, since this matters for how seriously to take the security claim: factoring being "hard" is not a mathematical proof — no one has proven a fast classical factoring algorithm is impossible, only that nobody has found one despite decades of serious effort. RSA's real-world security rests on this practical, empirical hardness, not a theorem. This distinction matters enormously once Chapter 5 shows a method that — on different hardware — provably changes the picture. |

### Lesson 4.3 — How RSA Actually Uses This (At a Working Level)

**Learning goal:** give the learner enough mechanical understanding of RSA's encrypt/decrypt structure to genuinely follow why factoring the modulus breaks it — without requiring them to derive the number theory from scratch.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | At a working level (not a full derivation): RSA's public key includes a number N, the product of two secret large primes p and q. To encrypt, a sender does modular exponentiation using N and a public exponent. To decrypt, the receiver needs a private exponent that can only be correctly computed if you know p and q individually — not just their product N. |
| 2 | question (MCQ) | "If an attacker could efficiently factor N back into its original primes p and q, what would that let them do?" Options: Nothing — p and q aren't useful on their own · ✓ Compute the private decryption exponent and read any message encrypted with that public key · Only forge new messages, not read old ones · Crash the encryption system. |
| 3 | explanation (reveal) | Confirms — and this is the precise mechanism Chapter 5 returns to directly: "breaking RSA" isn't a vague metaphor, it specifically means "efficiently factoring N," because everything else in the system follows mechanically once that's done. |

### Lesson 4.4 — The Wider Picture: Diffie-Hellman and AES

**Learning goal:** place RSA in context among the other algorithms actually protecting real traffic, so the learner understands the full picture Shor's algorithm threatens, not just RSA in isolation.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | RSA isn't the only algorithm doing this kind of work. **Diffie-Hellman** key exchange lets two parties agree on a shared secret over an open channel, using a *different* hard problem with a similar "easy one way, hard to undo" structure. **AES**, by contrast, is symmetric — same key both directions — and is normally used for the bulk of actual data encryption once a key has been agreed upon via RSA or Diffie-Hellman. |
| 2 | explanation | Worth being precise about exactly how Diffie-Hellman differs from RSA, since the next chapter will return to this distinction directly: RSA's hardness rests on **factoring** (recovering p and q from their product N, Lesson 4.2-4.3). Diffie-Hellman's hardness rests on a related but genuinely different problem called the **discrete logarithm problem** — given a result of repeated modular multiplication, finding how many times the multiplication was applied. Both problems are currently hard for classical computers, and both happen to be the kind of "hidden periodic structure" problem Shor's algorithm is built to exploit — but they are not the same problem, and Shor's algorithm has to be run as two distinct variants, one tuned for factoring and one for discrete logarithms, to break each in turn. |
| 3 | question (MCQ) | "What hard problem does Diffie-Hellman's security rest on, and how does it relate to RSA's?" Options: The exact same factoring problem as RSA · ✓ The discrete logarithm problem — related to factoring in spirit, but a genuinely different problem, requiring a different variant of Shor's algorithm to break · A problem unrelated to anything quantum algorithms can address · AES's key length. |
| 4 | explanation | A typical real connection (e.g. visiting an HTTPS website) uses several of these together: RSA or Diffie-Hellman to securely agree on a one-time shared key, then AES with that key to actually encrypt the browsing session, since AES is much faster for bulk data. This layered design is exactly why "is quantum computing a threat to encryption" has a more nuanced answer than a single yes/no — different algorithms in this stack turn out to be vulnerable to different degrees, which Chapter 5 and the capstone address precisely rather than lumping together. |
| 5 | question (MCQ) | "In a typical HTTPS connection, what is RSA or Diffie-Hellman typically used for, versus AES?" Options: They do the same job redundantly · ✓ RSA/Diffie-Hellman securely establishes a shared key; AES then uses that key for fast bulk encryption · AES establishes the key; RSA encrypts the data · Neither is used in HTTPS. |

**End-of-chapter practice set (6 questions, unscaffolded):**
1. (MCQ) What problem is RSA's security built on? → the difficulty of factoring the product of two large primes back into those primes.
2. (MCQ) Is RSA's hardness a mathematical proof or an empirical/practical observation? → empirical/practical — no proof that fast factoring is impossible exists.
3. (MCQ) What does an attacker gain by factoring RSA's public modulus N? → the ability to compute the private decryption exponent and read messages.
4. (MCQ) What hard problem underlies Diffie-Hellman, and is it the same as RSA's? → the discrete logarithm problem — related to, but distinct from, RSA's factoring problem.
5. (MCQ) Does breaking RSA via Shor's algorithm also automatically break Diffie-Hellman? → not automatically — a different variant of Shor's algorithm, tuned for discrete logarithms, is needed.
6. (MCQ) What's the typical division of labor between RSA/Diffie-Hellman and AES in a real connection? → RSA/Diffie-Hellman establishes a shared key; AES handles fast bulk encryption with that key.

---

## Chapter 5: Shor's Algorithm: Breaking RSA

*Spine hook: if factoring is the wall protecting RSA, what happens when an algorithm exists that factors efficiently? This chapter's structure — classical reduction to period-finding, quantum core via modular exponentiation + QFT, classical post-processing via GCD — was verified directly against multiple technical sources during Step 2 prep, ensuring the steps given here match the algorithm's actual structure rather than a simplified or slightly-wrong popular retelling.*

### Lesson 5.1 — Reframing Factoring as a Period-Finding Problem

**Learning goal:** the genuinely clever, non-obvious move Shor made — turning "factor N" into "find the period of a specific function" — before any quantum mechanism appears.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Shor's real insight wasn't a quantum factoring trick directly — it was realizing that factoring a number N can be **reduced** to a completely different-looking problem: finding the period of the function f(x) = aˣ mod N, for a cleverly chosen number a. ("Period" here means: the function's output repeats every r steps, for some r — find that r.) This reduction itself is pure classical number theory, no quantum computer needed yet. |
| 2 | explanation | "Cleverly chosen" deserves to be made concrete: before anything quantum happens, there's a quick classical pre-check. Pick a random number a, then classically compute the greatest common divisor of a and N (using an old, fast classical method called Euclid's algorithm). If that gcd happens to be anything other than 1, you've actually gotten lucky and stumbled onto a factor of N directly — no quantum step needed at all for that particular attempt. If the gcd is 1 (the much more common case), *then* the quantum period-finding step is needed, using that a. |
| 3 | question (MCQ) | "What does the classical pre-check (computing gcd(a, N)) accomplish before any quantum step runs?" Options: It computes the final answer directly, every time · ✓ It occasionally finds a factor of N by pure luck, with no quantum step needed; otherwise it confirms a is a valid choice to proceed with the quantum period-finding step · It verifies the qubits are working correctly · It encrypts the chosen value of a. |
| 4 | explanation | Once you have the period r, a small amount of further classical math (computing the greatest common divisor of a^(r/2)±1 and N) recovers the actual factors of N, with high probability — "with high probability" matters here and is returned to precisely in Lesson 5.4, since the procedure doesn't succeed with certainty on every single attempt. So the *only* genuinely hard step — the one that needs a quantum computer — is finding that period r efficiently. Everything before and after it is ordinary classical computation. |
| 5 | question (MCQ) | "What is the one specific sub-problem inside Shor's algorithm that actually requires a quantum computer?" Options: Multiplying the two primes together · Choosing the random number a · ✓ Finding the period of the function f(x) = aˣ mod N · Verifying the final answer. |

### Lesson 5.2 — Why Classical Period-Finding Is Slow

**Learning goal:** show concretely why finding this period classically is hard, motivating why a quantum approach is needed at all (not just "quantum is generically better").

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Classically, finding the period of f(x) = aˣ mod N for the large N's used in real RSA keys would require checking an enormous number of x values one at a time — the period can be close to the size of N itself, and N for real RSA keys is hundreds of digits long. This is exactly the kind of brute-force search problem that scales badly, the same flavor of difficulty (though not identical mechanism) as the unstructured search from Chapter 3. |
| 2 | question (MCQ) | "Why is finding the period of f(x) = aˣ mod N classically slow for cryptographically large N?" Options: The function is undefined for large N · ✓ The period can be enormous, and checking values one at a time doesn't scale to numbers hundreds of digits long · Modular arithmetic doesn't work for large numbers · There's no period for large N. |

### Lesson 5.3 — The Quantum Core: Superposition, Modular Exponentiation, and the Quantum Fourier Transform

**Learning goal:** walk the actual quantum steps in correct order — verified directly — at a conceptual level, without deriving the QFT's matrix mechanics.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | The quantum part of Shor's algorithm runs three steps, in order. **(1)** Prepare a register of qubits in an equal superposition of every possible value of x at once (via Hadamard gates — the same superposition-creation tool from Chapter 1, just applied to many qubits together). **(2)** Apply the function f(x) = aˣ mod N to this superposition, computed reversibly so all the results exist in superposition simultaneously — this step is where the function's periodic structure becomes baked into the quantum state's pattern, even though no single measurement has happened yet. |
| 2 | explanation | **(3)** Apply the **Quantum Fourier Transform (QFT)** to the superposition. The QFT's job, at a conceptual level, is exactly the same as a classical Fourier transform's: it doesn't add new information, it changes *how the existing information is organized* — turning a hidden periodic pattern (buried inside the superposition from step 2, not visible by inspection) into something that shows up clearly as a spike in measurement probability at specific, period-related values. After the QFT, measuring the register reveals a number directly related to the period r. |
| 3 | question (drag-to-order) | "Order the three quantum steps of Shor's algorithm's core." Items: Apply the Quantum Fourier Transform · Create an equal superposition of all possible x values · Compute f(x) = aˣ mod N on the superposition · Measure the register. Correct order: superposition → compute f(x) → QFT → measure. |
| 4 | explanation (reveal) | Confirms the order — and connects back to Chapter 1's framing of gates and circuits directly: the QFT is, mechanically, just another sequence of gates (a circuit), built specifically to perform this perspective-shift operation. It isn't a separate kind of "magic" outside everything covered so far in this course, even though what it accomplishes is genuinely remarkable. |

### Lesson 5.4 — Finishing the Job, and the Honest "How Close Are We" Question

**Learning goal:** close the loop back to classical post-processing, and give an honest, current answer to "could this actually break RSA today" — avoiding both under- and over-claiming.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | After measurement reveals (with high probability, not certainty — sometimes the procedure needs to be repeated) a number related to the period r, ordinary classical math attempts to finish the job: compute the greatest common divisor of a^(r/2)±1 and N. This succeeds in recovering N's actual prime factors *most* of the time — but not always, and the precise cases where it fails are worth knowing, not glossed over. |
| 2 | explanation | Two specific situations make this final step fail, requiring the whole procedure to restart with a freshly chosen random a: **(1)** if the period r turns out to be an **odd number**, the expression a^(r/2) isn't even a valid integer, and the method can't proceed. **(2)** even if r is even, if it happens that a^(r/2) ≡ −1 (mod N), the GCD calculation produces a trivial, useless result (either 1 or N itself, neither of which is an actual factor). Both cases are detected immediately from the math, not discovered later, so a restart costs only a fresh attempt — but it does mean the algorithm is correctly described as succeeding "with high probability per attempt," not as a guaranteed one-shot success. |
| 3 | question (MCQ) | "What are the two specific situations that require restarting Shor's algorithm with a new value of a?" Options: Whenever N is even · ✓ When the found period r is odd, or when a^(r/2) ≡ −1 (mod N) — both make the GCD step fail to produce a real factor · Whenever the qubits decohere · This never happens; the algorithm always succeeds on the first attempt. |
| 4 | explanation | Once a successful attempt does produce real factors, the attacker can reconstruct the private key and read anything encrypted with that public key, exactly as established in Chapter 4. |
| 5 | question (MCQ) | "After the quantum period-finding step succeeds and the GCD check passes, what kind of computation actually recovers the factors of N?" Options: Another quantum circuit · ✓ Ordinary classical computation (a greatest-common-divisor calculation) · A repeat of the QFT · No further computation is needed. |
| 6 | explanation | The honest, current state of things, stated precisely rather than vaguely: Shor's algorithm has been experimentally demonstrated, but only on very small numbers (factoring numbers like 15 or 21), nowhere near the hundreds-of-digits keys real RSA deployments use. Running Shor's algorithm at a cryptographically meaningful scale would require a quantum computer with far more qubits than exist today, and — critically — qubits protected by **error correction** robust enough to run a long, precise computation without the result being scrambled by noise (a topic the Quantum Computing Hardware course covers in depth). This is *not* available today. |
| 7 | question (MCQ) | "What's the honest current answer to 'can a quantum computer break real RSA encryption today'?" Options: Yes, this happens routinely already · ✓ No — Shor's algorithm is proven correct and demonstrated on tiny numbers, but breaking real RSA keys requires far more qubits and error correction than currently exist · No, and it never will be possible · Yes, but only for AES, not RSA. |
| 8 | explanation | This honest gap is exactly *why* the field is acting now rather than waiting, which the capstone covers directly: data encrypted today, even if uncrackable in 2026, could be recorded and decrypted later once sufficiently powerful quantum computers exist — a real, named concern called **"harvest now, decrypt later."** For data that needs to stay confidential for years or decades (state secrets, long-term medical records, certain financial data), this future threat is being treated as actionable today, not dismissed as too far off to matter. |

**End-of-chapter practice set (7 questions, unscaffolded):**
1. (MCQ) What classical problem does Shor's algorithm reduce factoring to? → finding the period of f(x) = aˣ mod N.
2. (MCQ) What does the classical gcd(a, N) pre-check accomplish? → occasionally finds a factor by luck with no quantum step, otherwise confirms a is valid to proceed with.
3. (MCQ) What does the Quantum Fourier Transform do, conceptually? → reorganizes the information in a superposition so a hidden periodic pattern becomes visible upon measurement.
4. (MCQ) What two conditions cause the final GCD step to fail, requiring a restart with a new a? → an odd period r, or a^(r/2) ≡ −1 (mod N).
5. (MCQ) Is Shor's algorithm guaranteed to succeed on the first attempt? → no — it succeeds with high probability per attempt, not with certainty.
6. (MCQ) Has Shor's algorithm broken real, cryptographically-sized RSA keys as of today? → no — demonstrated only on small numbers; real-scale RSA requires far more qubits and error correction than currently exist.
7. (MCQ) What is "harvest now, decrypt later"? → the practice of recording currently-encrypted data today with the intent of decrypting it once sufficiently powerful quantum computers exist in the future.

---

## Chapter 6: After Shor's: A World Preparing (Capstone)

*Spine hook: if today's encryption is vulnerable in principle, what is the world actually doing about it right now? Per the spine's design note, this capstone is lighter-weight than Chapters 1-5 — map-of-the-field framing, oriented toward further study. All claims below were checked directly against current 2026 sources during Step 2 prep, including the specific FIPS standard numbers and a real June 2026 federal policy development — this is the chapter most likely to go stale, so precision and current sourcing matter most here.*

### Lesson 6.1 — Not All Encryption Is Equally Threatened

**Learning goal:** correct a common oversimplification directly — Shor's threatens RSA/Diffie-Hellman specifically, not "encryption" generically; AES is affected differently, via Grover's, not Shor's.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | A precise distinction worth making explicit, since "quantum computers will break encryption" is often stated too broadly: Shor's algorithm specifically threatens RSA and Diffie-Hellman, because both rely on problems (factoring, discrete logarithms) that Shor's solves efficiently. AES — the symmetric algorithm from Chapter 4 — is not vulnerable to Shor's at all, since it isn't built on either of those problems. |
| 2 | explanation | AES does face a *different*, much smaller threat: Grover's algorithm (Chapter 3) could, in principle, speed up a brute-force key search against AES quadratically. Since this is only a quadratic — not exponential — speedup, the practical fix is comparatively simple: doubling AES's key length restores its original security margin against a quantum attacker. This is a far less dramatic problem than RSA's, which can't be fixed by simply using bigger keys, since Shor's exponential speedup eats any feasible key-size increase. |
| 3 | question (MCQ) | "How does the quantum threat to AES differ from the quantum threat to RSA?" Options: They're identical · ✓ AES only faces a quadratic speedup from Grover's, fixable by longer keys; RSA faces an exponential break from Shor's, which longer keys can't fix · AES is completely unaffected, RSA is completely safe · RSA is more secure against quantum attacks than AES. |
| 4 | explanation | One piece of formal vocabulary worth having, for reading further: the class of problems a quantum computer can solve efficiently has a name — **BQP** (Bounded-error Quantum Polynomial time), the quantum analogue of the classical complexity class **P** (problems classical computers solve efficiently). Whether BQP is *strictly larger* than P — whether quantum computers can efficiently solve problems classical computers provably cannot — is itself a major open question in theoretical computer science, closely tied to the famous P vs. NP problem. Factoring (Shor's) is believed, but not proven, to be in BQP and not in P; this is the precise, formal version of the "structurally cannot compute efficiently" question this entire course opened with. |
| 5 | question (MCQ) | "What does the complexity class BQP represent?" Options: All problems that are impossible to solve · ✓ The class of problems a quantum computer can solve efficiently — the quantum analogue of the classical class P · Only cryptography problems · A specific quantum algorithm. |

### Lesson 6.2 — Post-Quantum Cryptography: New Hard Problems

**Learning goal:** introduce the actual current NIST-standardized algorithms by name and FIPS number, replacing the spine's original looser "Kyber/lattice cryptography" framing with the precise, verified current state.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | The fix for RSA's vulnerability isn't to patch RSA — it's to replace it with algorithms built on *different* hard problems that, as far as anyone currently knows, Shor's algorithm (and no other known quantum algorithm) can efficiently solve. This is called **post-quantum cryptography (PQC)**: classical algorithms, runnable on ordinary computers today, designed specifically to resist quantum attack. |
| 2 | explanation | After a multi-year public evaluation process, the US National Institute of Standards and Technology (NIST) finalized its first PQC standards in August 2024: **ML-KEM** (for key exchange, replacing RSA/Diffie-Hellman's role — based on the lattice-based algorithm formerly called Kyber), **ML-DSA** (for digital signatures, formerly Dilithium), and **SLH-DSA** (a hash-based signature scheme kept deliberately independent of lattice math, as a backup in case weaknesses are ever found there). A further backup key-exchange algorithm, HQC, based on different math than ML-KEM, was selected in 2025 as additional insurance. |
| 3 | question (MCQ) | "What is ML-KEM, and what does it replace?" Options: A new symmetric encryption algorithm replacing AES · ✓ A NIST-standardized post-quantum key-exchange algorithm, replacing the role RSA/Diffie-Hellman currently play · A faster version of Shor's algorithm · A quantum hardware standard. |
| 4 | explanation (reveal) | Names the underlying hard problem at a conceptual level, without deriving the math: ML-KEM is **lattice-based** — its security rests on problems involving high-dimensional geometric lattices that, as far as currently known, don't reduce to the kind of periodic structure Shor's algorithm is built to exploit. This is genuinely different math from factoring, not just a bigger version of the same idea — which is exactly the property needed. |
| 5 | explanation | Worth connecting back to Lesson 6.1 directly, since it's the actual reason SLH-DSA exists as a deliberately separate backup: **hash functions** (the building block SLH-DSA is built from) are, like AES, only vulnerable to a Grover's-style quadratic speedup — not to anything resembling Shor's. This is precisely *why* hash-based signatures are trusted as the conservative fallback option: even in a scenario where unexpected weaknesses are someday found in lattice-based math (undermining ML-KEM/ML-DSA), SLH-DSA's hash-based security would still only face the comparatively modest, well-understood Grover's threat — the same kind of threat AES already withstands today by using longer keys. |
| 6 | question (MCQ) | "Why is SLH-DSA (hash-based) considered a particularly conservative, trustworthy backup against future surprises?" Options: It's the newest algorithm available · ✓ Hash functions, like AES, are only vulnerable to Grover's modest quadratic speedup, not to anything like Shor's exponential break · It uses the same lattice math as ML-KEM, doubled for safety · It doesn't require any key at all. |

### Lesson 6.3 — Why This Is Happening Now, Not Later

**Learning goal:** close the loop on "harvest now, decrypt later" from Chapter 5 with concrete urgency, including the real current policy response.

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | This migration is already actively underway, not a distant future plan. Major browsers, operating systems, and messaging platforms have begun deploying **hybrid** approaches — combining a classical algorithm (like RSA) with a post-quantum one (like ML-KEM) for the same connection, so security holds even if either approach alone is later found to have a weakness. Governments have set concrete deadlines: U.S. national security systems, for instance, are required to fully migrate to post-quantum algorithms by 2030, and broader federal migration deadlines exist as a matter of current policy. |
| 2 | question (MCQ) | "Why are organizations deploying 'hybrid' classical-plus-post-quantum encryption right now, rather than waiting and switching directly later?" Options: Hybrid approaches are required for performance reasons only · ✓ It protects against both a classical break and an unforeseen weakness in the new post-quantum algorithms, while addressing harvest-now-decrypt-later today · Post-quantum algorithms don't work without a classical algorithm present · It's a temporary testing phase with no real security purpose. |
| 3 | explanation | Closes the course by returning to its opening frame from Chapter 1: this course set out to answer what a quantum computer can compute that a classical one structurally cannot, and why that threatens cryptography the internet runs on. The honest answer, now fully earned rather than asserted upfront: Grover's gives a real but modest, fixable speedup; Shor's gives a real, exponential, much harder-to-fix break — proven correct, demonstrated at small scale, not yet achievable at cryptographic scale, but close enough that the world is actively migrating away from vulnerable algorithms today rather than waiting for the threat to fully arrive. |

### Lesson 6.4 — The Other Quantum Response: Quantum Key Distribution

**Learning goal:** cover the genuinely distinct third quantum-crypto story — using quantum mechanics *defensively*, to detect eavesdropping, rather than offensively (Shor's) or as a classical replacement (PQC). Directly grounded in the uploaded `Quantum_Cryptography.pptx` deck's content (entangled-key generation, Alice/Bob/Eve framing, the one-time pad).

| Screen | Type | Content |
|---|---|---|
| 1 | explanation | Post-quantum cryptography (Lesson 6.2) replaces vulnerable classical algorithms with *different classical* algorithms believed to resist quantum attack — still running on ordinary computers. There's a genuinely separate approach, called **Quantum Key Distribution (QKD)**, that uses quantum mechanics itself, not just better math, to establish a shared secret key — and its security guarantee comes from physics, not computational hardness. |
| 2 | explanation | The core idea, using entangled qubits (Chapter 2's Bell pairs, put to a new use): Alice and Bob share entangled qubit pairs and each measure their half. Because measuring a quantum state generally **disturbs** it (the collapse rule from Chapter 1, applied here as a security feature rather than an inconvenience), any eavesdropper, Eve, who tries to intercept and measure the qubits in transit unavoidably disturbs them — leaving statistical evidence Alice and Bob can detect by comparing a subset of their results afterward over an ordinary public channel. |
| 3 | question (MCQ) | "What makes QKD's security fundamentally different from RSA's or even post-quantum cryptography's?" Options: It uses larger keys · ✓ Its security comes from the physical fact that measuring quantum states disturbs them, not from a computational problem being hard to solve · It doesn't require any secret key at all · It only works over very short distances. |
| 4 | explanation (reveal) | Confirms — and states the resulting key insurance directly: QKD's eavesdropping-detection guarantee doesn't rely on factoring, discrete logs, or lattice problems being hard at all — it relies on a property of quantum measurement itself (collapse), which no future algorithm, classical or quantum, can get around, since it's not a computational assumption to begin with. Once Alice and Bob have confirmed (via the public comparison) that no eavesdropping occurred, the resulting shared key can be used with a **one-time pad** — a classical encryption method that is itself provably perfectly secure, *if and only if* the key is truly random, used only once, and kept secret, which QKD is specifically designed to guarantee. |
| 5 | question (MCQ) | "Why is QKD combined with a one-time pad considered such a strong security combination, in principle?" Options: It's the fastest encryption method available · ✓ QKD provides a provably eavesdropping-detectable shared key, and the one-time pad is provably perfectly secure given such a key — neither link relies on an unproven computational hardness assumption · It doesn't require Alice and Bob to share anything in advance · It works without any quantum hardware at all. |
| 6 | explanation | An honest practical caveat, consistent with this course's standard of not overselling: QKD's physics-based guarantee is real, but deploying it has real practical costs PQC doesn't — it requires actual quantum hardware (photon sources, detectors) and typically dedicated fiber links or satellite connections with real distance limitations, unlike PQC, which is pure software running on existing classical infrastructure. This is why PQC, not QKD, is the primary near-term answer for migrating the broader internet (Lesson 6.3), while QKD sees more targeted use in high-security links (e.g. government, financial backbone connections) where the hardware investment is justified. |
| 7 | question (MCQ) | "Why is post-quantum cryptography (PQC), not QKD, the primary near-term solution for migrating the broader internet?" Options: QKD is less secure than PQC · ✓ PQC is pure software deployable on existing classical infrastructure, while QKD requires real quantum hardware and has practical distance limitations · QKD has been proven insecure · PQC and QKD solve completely unrelated problems. |

**End-of-chapter practice set (8 questions, unscaffolded — intentionally lighter than other chapters per capstone design):**
1. (MCQ) Why is AES's quantum vulnerability far less severe than RSA's? → it only faces a quadratic (Grover's) speedup, fixable by longer keys, not an exponential (Shor's) break.
2. (MCQ) What does BQP represent, and how does it relate to the question this course opened with? → the class of problems quantum computers solve efficiently; whether it's strictly larger than classical P is the formal version of "what can quantum computers do that classical ones structurally cannot."
3. (MCQ) Name the three NIST-finalized post-quantum standards (2024) and what each does. → ML-KEM (key exchange), ML-DSA (signatures), SLH-DSA (hash-based signature backup).
4. (MCQ) Why is SLH-DSA considered a particularly safe backup? → it's hash-based, so it only faces Grover's modest quadratic threat, not Shor's, even if lattice math is someday weakened.
5. (MCQ) What underlying type of hard problem is ML-KEM built on? → lattice-based problems, structurally different from the factoring/discrete-log problems Shor's algorithm solves.
6. (MCQ) Why are organizations deploying hybrid classical+post-quantum encryption now, rather than waiting? → it addresses harvest-now-decrypt-later today while hedging against unforeseen weaknesses in either algorithm alone.
7. (MCQ) What does QKD's security guarantee rest on, instead of a computational hardness assumption? → the physical fact that measuring a quantum state disturbs it, making eavesdropping detectable.
8. (MCQ) Why is PQC, not QKD, the primary near-term solution for the broader internet's migration? → PQC is software-only and deployable on existing infrastructure; QKD requires real quantum hardware with practical distance limitations.

---

## Widget and Screen-Type Reference

| Widget/type | First used | Reused from / in |
|---|---|---|
| `explanation` / `question` (MCQ) screens | Throughout | Standard pattern, all lessons |
| `question` (drag-to-order) | Lesson 2.3 (teleportation steps), Lesson 5.3 (Shor's quantum steps) | Same pattern introduced in the QML course |
| Bloch sphere widget (`bloch_sphere`) | Lesson 1.1 (free placement), Lesson 1.2 (gate application) | Reused identically from the QML course; the scope caveat that entangled qubits have no individual arrow becomes directly relevant starting Chapter 2 |
| Bar-chart amplitude widget | Lesson 3.3 (Grover's diffusion operator visualization) | New to this course; reused for amplitude/probability visualization where applicable in the Hardware course |

## Course Summary

This course follows one escalating, real-stakes story: from the basic gates and circuits that make a computation "quantum" at all, through entanglement as a genuine computational resource (teleportation, superdense coding), to Grover's algorithm as a clean, well-understood case study in quantum speedup. It then builds the classical cryptography the internet actually runs on, before showing precisely how and why Shor's algorithm threatens it — including the algorithm's real internal structure and its genuine failure modes, not a simplified retelling. The capstone closes with the two real, current responses the world is deploying today: NIST-standardized post-quantum cryptography (ML-KEM, ML-DSA, SLH-DSA) and Quantum Key Distribution, a physics-based alternative. A learner completing this course can explain precisely what kind of speedup Grover's and Shor's algorithms each provide, walk through Shor's algorithm's actual steps, and evaluate current claims about quantum threats to encryption with genuine technical grounding.
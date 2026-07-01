# EduTech Quantum Platform — Course Narratives (Spine)

**Status:** Finalized — Step 1 of content design (chapter-level spine)
**Phase:** Task 2a — Narrative & Storyline Design
**Last updated:** June 2026
**Audience:** STEM learner with basic programming/math background, no prior linear algebra or quantum mechanics assumed. Visual and intuitive explanations come first in every course; formal notation is introduced gradually, once it can attach to an intuition the learner already has.
**Scope:** 6 chapters per course, 4-5 lessons per chapter. The deepest material from the supervisor's workshop syllabus (control electronics engineering detail, lattice cryptography internals, circuit transpilation internals) is treated as a ceiling, not a floor — it appears as a capstone teaser pointing toward further study, rather than as examined core content. A small, reusable set of interactive widgets (a Bloch sphere, a topology diagram, an amplitude bar chart, MCQ, drag-to-order, numeric input) is shared across all three courses rather than inventing a new widget per concept.

---

## How to Read This Document

Each course below has the same structure: a **core question** (the single thing the course is fundamentally answering), a **narrative throughline** (the motivating thread that gives chapters a reason to follow one another, not just a topic list), and a **chapter table** (6 chapters, each with its own motivating hook and what it leaves the learner able to do). Full lesson-by-lesson, screen-by-screen breakdowns for all three courses follow this spine as companion documents.

---

## Course 1: Quantum Machine Learning

### Core question
*If a quantum computer can hold and transform exponentially more information than a classical bit register, can it learn patterns the way a neural network does — and what does "learning" even mean when the model is a quantum circuit?*

### Narrative throughline
The course is framed as solving one recurring problem: **classical machine learning hits a wall when the data itself has quantum structure, or when the search/optimization space is too large to brute-force.** Each chapter introduces one more piece of the QML toolkit by showing where classical ML's assumptions start to strain, then asking "what if the model itself were quantum?" QML is presented from the outset as a genuinely different way of representing and transforming data — not "machine learning, but faster" — so that distinction lands early rather than being implied as a simple speed upgrade.

### Chapters

| # | Chapter | Motivating Hook | Learner Comes Out Able To... |
|---|---|---|---|
| 1 | **Why Quantum, Why Now** | A classical ML model's parameter space grows linearly; certain real problems (molecular simulation, some optimization landscapes) grow exponentially with classical resources. What does it mean for a *model* to live in a space that grows that way too? | Explain in plain language why QML is a different paradigm, not a faster version of classical ML; identify problem types where quantum structure is a natural fit. |
| 2 | **The Quantum Bit, Visually** | Before any "learning" can happen, the learner needs the substrate: what is a qubit, really, and how is it different from a classical bit with extra steps? | Read and reason about a single-qubit state on the Bloch sphere; understand superposition and measurement as the core operations a model will manipulate. |
| 3 | **From Bits to Circuits: Encoding Data** | A neural net takes a vector as input. A quantum circuit takes... a quantum state. How does classical data (an image, a number, a feature vector) become a quantum state at all? | Describe and compare the major encoding strategies (basis, amplitude, angle encoding) and explain why encoding choice is itself a design decision with real consequences. |
| 4 | **The Variational Circuit: A Quantum Model That Learns** | If a quantum circuit has tunable parameters (rotation angles), and you can measure an output and compare it to a target — you have the bones of a trainable model. | Explain how a parameterized quantum circuit (PQC) functions as a trainable model; connect this conceptually to gradient-based training in classical ML (the parameter-shift rule, at an intuitive level). |
| 5 | **Quantum Kernels and Quantum Neural Networks** | Two dominant QML approaches exist: use a quantum circuit to compute a kernel (a similarity measure) for a classical algorithm, or build an end-to-end quantum neural network. Why two approaches, and when does each make sense? | Distinguish quantum kernel methods from QNNs; reason about which approach fits a given problem shape. |
| 6 | **Where This Goes Next (Capstone)** | Real QML today runs on noisy intermediate-scale quantum (NISQ) hardware with real limitations. What's hype, what's genuinely promising, and what does the frontier look like? | Critically evaluate a QML claim (separating "theoretically faster" from "practically faster today"); understand barren plateaus as the field's central open training problem, and the live debate over its connection to classical simulability, as a map for further study. |

---

## Course 2: Quantum Algorithms

### Core question
*What can a quantum computer actually compute that a classical computer structurally cannot do efficiently — and why does that threaten the cryptography the entire internet currently relies on?*

### Narrative throughline
This course is framed as a **single escalating story with real stakes**: it starts with the building blocks of quantum circuits, builds to Grover's algorithm as a clean, contained "quantum speedup" case study, then pivots into the higher-stakes story at the center of the supervisor's workshop syllabus — how Shor's algorithm threatens RSA, why that matters for everyone who uses HTTPS, and what the world is doing about it today, both through new classical cryptography and through quantum mechanics used defensively.

### Chapters

| # | Chapter | Motivating Hook | Learner Comes Out Able To... |
|---|---|---|---|
| 1 | **Gates, Circuits, and What "Computing" Means Here** | A classical algorithm is a sequence of logic gates. A quantum algorithm is a sequence of quantum gates acting on qubits. What are the basic gates, and what can one or two qubits actually do? | Read and construct simple 1- and 2-qubit circuits; explain common single-qubit gates (X, H, Z) and what superposition does to a circuit's possibilities. |
| 2 | **Entanglement: Bell States and Teleportation** | Two qubits can be correlated in a way that has no classical analogue. This isn't a curiosity — it's the resource that makes several quantum algorithms (and quantum teleportation) possible at all. | Construct a Bell state; explain quantum teleportation step by step as a protocol; articulate why entanglement is a genuine computational resource, not just a strange phenomenon. |
| 3 | **Search, But Quadratically Faster: Grover's Algorithm** | Searching an unsorted list of N items classically takes, on average, N/2 checks. Grover's algorithm does it in roughly √N. How — and what does "phase oracle" actually mean? | Walk through Grover's algorithm conceptually and via circuit diagram; explain phase oracles and amplitude amplification at an intuitive level; state precisely what kind of speedup this is (quadratic, not exponential) and why that distinction matters. |
| 4 | **The Crypto the Internet Runs On** | Before showing how quantum computing breaks RSA, the learner needs to understand what RSA actually is and why it's considered secure today. | Explain modular arithmetic and the factoring problem; explain (at a working level) how RSA, Diffie-Hellman, and AES relate to each other, and why factoring and discrete logarithms are currently considered classically hard. |
| 5 | **Shor's Algorithm: Breaking RSA** | If factoring is the wall protecting RSA, what happens when an algorithm exists that factors efficiently? | Explain the structure of Shor's algorithm (period-finding via quantum Fourier transform, at a conceptual level) and why it threatens RSA specifically; state realistically what "breaking RSA" would currently require (qubit counts, error correction) versus what's possible today. |
| 6 | **After Shor's: A World Preparing (Capstone)** | If today's encryption is vulnerable in principle, what is the world actually doing about it right now — both by replacing the math, and by using quantum mechanics itself defensively? | Describe NIST's standardized post-quantum cryptography (ML-KEM, ML-DSA, SLH-DSA) at a conceptual level; describe Quantum Key Distribution as a physics-based alternative response; understand this as an active, unresolved transition the learner is now equipped to follow. |

---

## Course 3: Quantum Computing Hardware

### Core question
*A qubit is a delicate physical thing, not just a mathematical symbol — so what does it actually take, physically, to build, control, and keep one alive long enough to compute anything useful?*

### Narrative throughline
This course is the most physically grounded of the three, framed as **descending from theory into engineering reality**: it starts where Course 2 leaves the qubit as an abstraction, then asks "okay, but what *is* this thing, physically?" Each chapter follows the actual lifecycle of a real quantum computation on real hardware — build the qubit, connect it to others, control it, watch it decay, and fight to protect it from decaying. This mirrors the supervisor's own workshop sequence (physical implementation → QPU layout → control electronics → decoherence and error correction), compressed to fit the course's scope, with the most engineering-dense material (pulse-level control design, circuit transpilation) pushed to the capstone as a "here's the next layer down" pointer for further study.

### Chapters

| # | Chapter | Motivating Hook | Learner Comes Out Able To... |
|---|---|---|---|
| 1 | **What a Qubit Is, Physically** | "Qubit" has been an abstract two-level system so far. What physical systems can actually serve as one, and why does the field currently favor superconducting circuits for large-scale efforts? | Name and compare the major physical qubit implementations (superconducting, trapped-ion, photonic, neutral atom); explain why superconducting qubits lead current large-scale efforts specifically on the metric of qubit count. |
| 2 | **Inside a Superconducting Qubit** | What is a transmon, concretely, and why does it need to be cooled to near absolute zero to work at all? | Describe the basic physical structure of a superconducting (transmon) qubit; explain why extreme cold and isolation from the environment are non-negotiable requirements, not engineering preferences. |
| 3 | **From One Qubit to a Processor: Layout and Topology** | A useful quantum computer needs many qubits working together, not one isolated qubit. How are qubits physically arranged on a chip, and why does the arrangement (topology) matter for which circuits can run efficiently? | Read a simple QPU topology diagram; explain why qubit connectivity constraints affect which two-qubit operations are "native" versus requiring extra routing. |
| 4 | **Talking to a Qubit: Control and Measurement** | A qubit doesn't respond to a keyboard. How do you actually send it a gate operation, and how do you read out a result? | Explain, at a conceptual level, how microwave pulses implement gate operations on superconducting qubits and how measurement collapses a qubit's state into a classical readout. |
| 5 | **The Enemy: Decoherence** | Qubits don't stay in superposition forever — the environment "leaks in" and destroys the quantum information. What is decoherence, and why is it the field's central obstacle, alongside gate error rate? | Explain decoherence (T1/T2) and gate error rate as two distinct, complementary metrics of qubit quality; explain why neither qubit count alone, nor either metric alone, fully captures a quantum computer's real near-term capability. |
| 6 | **Fighting Back: Error Correction and What's Next (Capstone)** | If qubits inevitably decohere and gates inevitably introduce error, how does the field plan to build reliable computers anyway? | Explain the basic idea of quantum error correction (redundancy across physical qubits to protect one logical qubit) at a conceptual level, distinguish it from error mitigation, and understand pulse-level control engineering and circuit transpilation as the next layer of depth available for further independent study. |

---

## Cross-Course Design Notes

- **Shared visual language:** the Bloch sphere, introduced in QML Chapter 2, is the same interactive widget reused in Algorithms Chapter 1 and Hardware Chapter 1 — reinforcing one consistent mental model across all three courses, rather than three separate explanations of the same thing.
- **Course independence:** each course is self-contained and does not assume either of the others has been taken. QML Chapter 2 and Algorithms Chapter 1 both teach qubit fundamentals independently, by design — a deliberate choice consistent with how Brilliant.org structures its own course catalog, made so a learner can enter through any of the three courses without a gap in their foundation.
- **Where the "advanced" tier lands:** by the end of all three courses, a learner can explain Shor's threat to RSA and the world's two-pronged response (post-quantum cryptography and QKD); describe how a variational quantum circuit trains via the parameter-shift rule, and the open barren-plateau problem that limits it; and explain why decoherence and gate error rate, not qubit count alone, are the central engineering bottlenecks in the field today. That is a genuinely advanced conceptual endpoint, reached without requiring the learner to derive quantum Fourier transform mathematics or design a real error-correcting code by hand.
- **Capstone chapters (#6 in each course)** are intentionally lighter-weight than chapters 1-5 — fewer embedded questions, more "map of the field" framing — since their role is orientation toward further study, not examined mastery, consistent with the project's decision to treat the deepest workshop content as a ceiling rather than core curriculum.

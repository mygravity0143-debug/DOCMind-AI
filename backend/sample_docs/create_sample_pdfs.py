"""
Generates realistic multi-page sample PDFs using PyMuPDF (fitz)
for testing and benchmark evaluation of DocMind AI.
"""
from pathlib import Path
import fitz

SAMPLE_DIR = Path(__file__).parent

def create_quantum_computing_pdf():
    file_path = SAMPLE_DIR / "quantum_computing_advancements.pdf"
    doc = fitz.open()

    # Page 1: Abstract & Quantum Supremacy
    p1 = doc.new_page()
    text_p1 = """Quantum Computing: Breakthroughs, Architecture, and Error Correction
Dr. Eleanor Vance, Quantum Systems Laboratory
Published: October 2024

Abstract:
Quantum computing represents a paradigm shift from classical von Neumann computational models.
By utilizing quantum bits (qubits) capable of existing in superpositions of basis states |0> and |1>,
quantum processors achieve exponential speedups for specialized computational classes, including
integer factorization, quantum chemistry simulations, and discrete optimization problems.

1. Quantum Supremacy and Coherence Time
Recent superconducting quantum processors with 128 physical qubits have demonstrated coherence times
reaching 140 microseconds under cryogenic conditions of 15 millikelvin. Coherence time is strictly
limited by environmental thermal noise, dielectric losses in the substrate, and stray magnetic fields.
The system employs transmon qubit architecture with tunable capacitive couplers to minimize crosstalk.
Benchmarking on random circuit sampling verified a linear cross-entropy benchmarking fidelity of 0.72,
surpassing the computational capability of classical supercomputing clusters by an estimated factor of 10,000.
"""
    p1.insert_text((50, 60), text_p1, fontsize=11)

    # Page 2: Quantum Error Correction (Surface Codes)
    p2 = doc.new_page()
    text_p2 = """2. Quantum Error Correction and Fault Tolerance
Physical qubits are notoriously susceptible to decoherence and phase-flip errors. To realize practical,
fault-tolerant quantum computation, logical qubits are synthesized using surface codes.
The distance-5 surface code requires 49 physical qubits per logical qubit to correct arbitrary single-qubit
Pauli X and Z errors per syndrome cycle.

Empirical measurements indicate that the physical error threshold for surface codes is approximately
0.57% under depolarizing noise models. Our experiments demonstrated that lowering two-qubit gate error rates
below 0.1% enables exponential suppression of logical error rates as code distance increases from d=3 to d=5.
The decoder uses minimum-weight perfect matching (MWPM) algorithms executing on real-time FPGA co-processors
with a sub-microsecond latency budget of 420 nanoseconds.
"""
    p2.insert_text((50, 60), text_p2, fontsize=11)

    # Page 3: Algorithms and Cryptographic Implications
    p3 = doc.new_page()
    text_p3 = """3. Algorithmic Scaling and Cryptographic Implications
Shor's algorithm provides polynomial-time factorization of composite integers in O((log N)^3) operations,
posing an existential challenge to classical asymmetric cryptography including RSA-2048 and Elliptic Curve Diffie-Hellman (ECDH).
Breaking RSA-2048 in under 8 hours requires an estimated 4,096 fault-tolerant logical qubits and approximately 20 million physical qubits.

In contrast, Grover's algorithm provides a quadratic speedup O(sqrt(N)) for unstructured database search,
reducing symmetric AES-256 security to an effective 128-bit key strength.
Consequently, post-quantum cryptographic standards based on lattice-based cryptography (CRYSTALS-Kyber and CRYSTALS-Dilithium)
must be adopted across enterprise infrastructure before fault-tolerant quantum hardware reaches maturity.
"""
    p3.insert_text((50, 60), text_p3, fontsize=11)

    doc.save(str(file_path))
    doc.close()
    print(f"Created {file_path}")

def create_distributed_systems_pdf():
    file_path = SAMPLE_DIR / "distributed_systems_consensus.pdf"
    doc = fitz.open()

    # Page 1: Introduction and Paxos vs Raft
    p1 = doc.new_page()
    text_p1 = """Architectural Foundations of Distributed Consensus and Fault-Tolerant Storage
Systems Engineering Technical Report
Lead Engineer: Marcus Brody

1. Overview of Consensus Protocols
In distributed state machine replication, ensuring safety and liveness across asynchronous networks
subject to network partitions is governed by the CAP theorem and the FLP impossibility result.
While Multi-Paxos has served as the theoretical gold standard, its operational complexity and underspecified
cluster membership changes led to the widespread adoption of the Raft consensus algorithm.

Raft decomposes distributed consensus into three distinct subproblems: leader election, log replication,
and safety invariants. Raft guarantees that at any given term, at most one leader can be elected,
and leader election requires an affirmative vote from a strict majority quorum: Q = floor(N/2) + 1.
"""
    p1.insert_text((50, 60), text_p1, fontsize=11)

    # Page 2: Heartbeats, Election Timeouts, and Log Compaction
    p2 = doc.new_page()
    text_p2 = """2. Election Timeouts and Heartbeat Mechanisms
To prevent split-vote scenarios, Raft utilizes randomized election timeouts between 150ms and 300ms.
The leader continuously broadcasts periodic heartbeats with an interval of 50ms to maintain authority.
If a follower receives no heartbeat within its randomized election timeout window, it transitions to the
Candidate state, increments the current term, votes for itself, and broadcasts RequestVote RPCs.

Log compaction is implemented via asynchronous snapshotting. Once the write-ahead log exceeds 50 megabytes,
the state machine serializes an immutable memory snapshot to persistent NVMe storage and truncates preceding log entries.
"""
    p2.insert_text((50, 60), text_p2, fontsize=11)

    doc.save(str(file_path))
    doc.close()
    print(f"Created {file_path}")

if __name__ == "__main__":
    create_quantum_computing_pdf()
    create_distributed_systems_pdf()

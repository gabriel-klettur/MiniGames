/** English overrides for concept definitions and keyPoints (architecture + dataStructures + testing + ML) */
interface ConceptOverride {
  definition: string;
  keyPoints: string[];
}

export const enConceptsB: Record<string, ConceptOverride> = {
  // --- Architecture ---
  'separation-of-concerns': {
    definition: 'Design principle that states each module should have a single well-defined responsibility. In game AI: separate move generation, evaluation, search and time management.',
    keyPoints: ['Each module with a single responsibility', 'Modules interact through clear interfaces', 'Facilitates testing, maintenance and extensibility'],
  },
  'dependency-injection': {
    definition: 'Design pattern implementing Inversion of Control (IoC). Dependencies are "injected" from the outside rather than created internally, facilitating testing and implementation swapping.',
    keyPoints: ['Implements Inversion of Control (IoC)', 'Dependencies received as constructor parameters', 'Facilitates testing with mocks and swapping implementations'],
  },
  'worker-pool': {
    definition: 'Pattern that manages a set of reusable worker threads to execute tasks concurrently. Reduces thread creation overhead and controls the level of parallelism.',
    keyPoints: ['Reuses workers instead of creating/destroying per task', 'Task queue when all workers are busy', 'Ideal for CPU-intensive tasks like AI searches'],
  },
  'root-parallelization': {
    definition: 'Technique that distributes root-level moves among multiple workers, allowing different principal moves to be evaluated simultaneously to reduce total time.',
    keyPoints: ['Distributes root moves among workers', 'Each worker evaluates a subset of moves', 'Results are combined to select the best'],
  },
  'second-ply-split': {
    definition: 'Alternative technique to root parallelization, used when there are few root moves. Parallelizes the search at the second level of the tree, distributing opponent responses among workers.',
    keyPoints: ['Alternative when there are few root moves', 'Parallelizes at the second tree level', 'Better worker utilization with few moves'],
  },
  'adaptive-time': {
    definition: 'System that dynamically adjusts search time based on position complexity, game phase, time pressure and urgency. Optimizes decision quality within time constraints.',
    keyPoints: ['Adjusts by complexity (±50%), game phase, urgency', 'Maximum 10% of remaining time per move', 'Safety margin of 10% and minimum of 50ms'],
  },
  'runtime-config': {
    definition: 'System that allows modifying AI parameters without recompiling. Supports presets for different difficulty levels, deep merge of partial configurations and dynamic in-game adjustment.',
    keyPoints: ['Predefined presets (beginner, expert)', 'Modify parameters without recompiling', 'Deep merge for partial updates'],
  },

  // --- Data Structures ---
  bitboards: {
    definition: 'Board representation using binary integers where each bit represents a cell. Allows extremely fast bitwise operations to manipulate and query wall state.',
    keyPoints: ['Each bit represents a board cell', 'AND, OR, XOR operations for fast manipulation', 'Can evaluate millions of positions per second'],
  },
  'object-pool': {
    definition: 'Pattern that reuses objects instead of constantly creating and destroying them. Reduces garbage collector pressure and improves performance in high-frequency creation applications.',
    keyPoints: ['Pre-allocates objects at initialization', 'acquire() obtains, release() returns to pool', 'Reduces garbage collector pressure'],
  },
  'simd-operations': {
    definition: 'Single Instruction, Multiple Data. Operations that perform the same calculation on multiple data simultaneously using processor vector registers to accelerate parallel evaluations.',
    keyPoints: ['One instruction processes multiple data at once', 'Uses vector registers (e.g.: Float32x4)', 'Fallback to scalar evaluation if unavailable'],
  },

  // --- Testing ---
  'search-testing': {
    definition: 'Test framework validating search algorithms using predefined positions with known expected moves, measuring correctness and execution time.',
    keyPoints: ['Positions with known solution (e.g.: mate in 2)', 'Validates exact move + time limit', 'Complete suite with tactical and strategic cases'],
  },
  'evaluation-testing': {
    definition: 'Tests verifying the numerical evaluation of positions against expected values with configurable tolerance. Measure average, maximum and per-position error.',
    keyPoints: ['Positions with expected score + tolerance', 'Metrics: average error, maximum error', 'Validates coherence (winning position > losing position)'],
  },
  'game-integration-test': {
    definition: 'Simulation of complete games where the AI plays against itself, validating that all moves are legal, measuring times and verifying that the game terminates correctly.',
    keyPoints: ['Runs complete AI vs AI games', 'Validates legality of each move', 'Measures average and maximum time per move'],
  },
  'performance-benchmark': {
    definition: 'Set of benchmarks measuring nodes/second, time per depth, transposition table hit rate and evaluation performance to detect regressions.',
    keyPoints: ['Measures NPS (nodes per second) by depth', 'Measures transposition table hit rate', 'Benchmark of evaluations per second'],
  },
  'elo-rating': {
    definition: 'Statistical system for measuring the relative strength of different AI versions through tournaments. Calculates expected rating and updates with K factor based on actual results.',
    keyPoints: ['Expected rating: 1/(1 + 10^((Rb-Ra)/400))', 'Update: Ra + K × (result - expected)', 'Round-robin tournament between different configurations'],
  },
  'performance-monitor': {
    definition: 'Monitoring system that collects real-time metrics: search times, explored nodes, memory usage and TT hit rate. Generates statistical reports.',
    keyPoints: ['Metrics: min, max, mean, median per operation', 'Maintains last 1000 values per metric', 'Reports NPS, TT hit rate and memory usage'],
  },

  // --- Machine Learning ---
  'neural-network-eval': {
    definition: 'Use of neural networks to evaluate game positions, learning complex patterns from training data that capture nuances that traditional evaluation functions miss.',
    keyPoints: ['Learns patterns from training data', 'Game state converted to tensor (one-hot encoding)', 'Fallback to traditional evaluation if model fails'],
  },
  'reinforcement-learning': {
    definition: 'ML paradigm where an agent learns to make optimal decisions by interacting with an environment, receiving rewards or punishments and adjusting its strategy to maximize cumulative reward.',
    keyPoints: ['Learns by interacting with environment (trial and error)', 'Maximizes long-term cumulative reward', 'Uses discount factor (gamma) for future rewards'],
  },
  'self-play': {
    definition: 'Method where the AI plays against itself to generate training data. Stores experiences in a buffer, distributes rewards with temporal discount and trains periodically.',
    keyPoints: ['AI plays against itself to generate experiences', 'Circular experience buffer (100K entries)', 'Rewards distributed with temporal discount (γ=0.99)'],
  },
  'epsilon-greedy': {
    definition: 'Exploration strategy that with probability ε chooses a random move (exploration) and with probability 1-ε chooses the best move according to the model (exploitation).',
    keyPoints: ['ε = probability of random exploration', '1-ε = probability of model exploitation', 'Balance between discovering new strategies and using known ones'],
  },
  'hybrid-evaluator': {
    definition: 'Combination of traditional evaluation (rules) with neural evaluation (ML). The blend factor adjusts dynamically: more traditional in opening (0.3), balanced in middlegame (0.5), more neural in endgame (0.7).',
    keyPoints: ['Dynamic blend: opening→traditional, endgame→neural', 'Leverages traditional interpretability + neural learning', 'Configurable factor from 0 (100% traditional) to 1 (100% neural)'],
  },
  'evaluation-tapering': {
    definition: 'Technique that smoothly interpolates evaluation weights between game phases instead of switching abruptly, creating continuous transitions that better reflect the gradual evolution of a game.',
    keyPoints: ['Smooth interpolation between opening and endgame weights', 'Avoids abrupt changes between phases', 'Uses continuous factor based on remaining material'],
  },
};

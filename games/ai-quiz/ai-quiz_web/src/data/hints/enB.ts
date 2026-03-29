import type { HelpSpec } from './types';

/** English hint overrides for architecture + data structures + testing + ML */
export const enHintsB: HelpSpec[] = [
  // --- Architecture ---
  { id: 'separation-of-concerns', context: 'Good software design divides AI into independent modules that collaborate through clear interfaces.',
    glossary: [
      { term: 'Module', explanation: 'A code unit with a specific, well-delimited responsibility.' },
      { term: 'Interfaces', explanation: 'Contracts defining how modules communicate without exposing internal details.' },
      { term: 'Testing', explanation: 'Process of verifying each code part works correctly in isolation.' },
      { term: 'Extensibility', explanation: 'Ability to add new features without modifying existing code.' },
    ] },
  { id: 'dependency-injection', context: 'Controlling how modules connect allows greater flexibility and easier automated testing.',
    glossary: [
      { term: 'Inversion of Control (IoC)', explanation: 'Principle where a module doesn\'t create its dependencies but receives them from outside.' },
      { term: 'Constructor', explanation: 'Function that initializes an object, receiving its dependencies as parameters.' },
      { term: 'Mocks', explanation: 'Simulated objects replacing real dependencies to facilitate testing.' },
      { term: 'Swappable implementations', explanation: 'Being able to change a component for a compatible one without altering the rest.' },
    ] },
  { id: 'worker-pool', context: 'Efficiently managing worker threads allows leveraging modern hardware for heavy computation.',
    glossary: [
      { term: 'Workers (threads)', explanation: 'Independent execution units processing tasks in parallel.' },
      { term: 'Concurrency', explanation: 'Simultaneous execution of multiple tasks to use all processor cores.' },
      { term: 'Task queue', explanation: 'Pending work list assigned to workers as they become free.' },
      { term: 'CPU-intensive', explanation: 'Tasks requiring heavy processing, like deep game tree searches.' },
    ] },
  { id: 'root-parallelization', context: 'Dividing work among multiple processors reduces total time to find the best move.',
    glossary: [
      { term: 'Root level', explanation: 'First level of the search tree with immediately available moves.' },
      { term: 'Workers', explanation: 'Independent execution units processing tasks in parallel.' },
      { term: 'Move subset', explanation: 'Portion of total moves assigned to each worker.' },
    ] },
  { id: 'second-ply-split', context: 'When there are few main options, distributing work at deeper levels better utilizes resources.',
    glossary: [
      { term: 'Second tree level', explanation: 'Opponent responses to each root-level move.' },
      { term: 'Few root moves', explanation: 'Situation with limited first-level options, restricting parallelization.' },
      { term: 'Worker utilization', explanation: 'Percentage of time workers are actively processing tasks.' },
    ] },
  { id: 'adaptive-time', context: 'Deciding how much time to spend on each move is an optimization problem in itself.',
    glossary: [
      { term: 'Position complexity', explanation: 'Number of options and factors to consider in a board situation.' },
      { term: 'Time pressure', explanation: 'Situation with little clock time remaining, requiring faster decisions.' },
      { term: 'Safety margin', explanation: 'Reserved time to avoid losing on time.' },
    ] },
  { id: 'runtime-config', context: 'Adjusting AI without recompiling allows rapid experimentation and real-time difficulty tuning.',
    glossary: [
      { term: 'Presets', explanation: 'Predefined configurations for different difficulty levels or play styles.' },
      { term: 'Recompile', explanation: 'Generating a new program version, requiring execution to stop.' },
      { term: 'Deep merge', explanation: 'Recursive config combination where partial values overwrite without destroying the rest.' },
      { term: 'Dynamic adjustment', explanation: 'Modifying parameters while the program is running.' },
    ] },

  // --- Data Structures ---
  { id: 'bitboards', context: 'Compact game state representation enables much faster evaluations.',
    glossary: [
      { term: 'Binary integers', explanation: 'Numbers in base 2, where each digit (bit) can be 0 or 1.' },
      { term: 'Bitwise operations', explanation: 'AND, OR, XOR — operations manipulating individual bits, extremely fast.' },
      { term: 'Board cell', explanation: 'Each individual position on a game board.' },
    ] },
  { id: 'object-pool', context: 'Reusing objects instead of creating and destroying them reduces garbage collector pauses.',
    glossary: [
      { term: 'Garbage collector', explanation: 'Automatic system freeing memory from objects no longer in use.' },
      { term: 'acquire() / release()', explanation: 'Operations to obtain an object from the pool and return it when no longer needed.' },
      { term: 'Pre-allocate', explanation: 'Creating needed objects at startup instead of on demand.' },
    ] },
  { id: 'simd-operations', context: 'Data-level parallel processing accelerates repetitive calculations like position evaluations.',
    glossary: [
      { term: 'Vector registers', explanation: 'Processor spaces storing multiple values for parallel processing.' },
      { term: 'Scalar evaluation', explanation: 'Calculating one value at a time (the opposite of SIMD).' },
      { term: 'Fallback', explanation: 'Backup alternative when an advanced feature isn\'t available.' },
      { term: 'Float32x4', explanation: 'Type representing 4 simultaneous 32-bit floating-point numbers.' },
    ] },

  // --- Testing ---
  { id: 'search-testing', context: 'Verifying the AI finds correct moves in known positions is fundamental to validate its operation.',
    glossary: [
      { term: 'Predefined positions', explanation: 'Board situations prepared with a known solution beforehand.' },
      { term: 'Mate in 2', explanation: 'Position where a forced 2-move winning sequence exists.' },
      { term: 'Test suite', explanation: 'Organized set of tests covering different scenarios.' },
      { term: 'Tactical/strategic cases', explanation: 'Tests verifying both combat moves and planning moves.' },
    ] },
  { id: 'evaluation-testing', context: 'Measuring numerical accuracy of evaluations ensures the AI correctly values positions.',
    glossary: [
      { term: 'Configurable tolerance', explanation: 'Acceptable margin of error when comparing numeric values.' },
      { term: 'Average/maximum error', explanation: 'Metrics measuring deviation between calculated and expected values.' },
      { term: 'Coherence', explanation: 'Property that a winning position always scores higher than a losing one.' },
    ] },
  { id: 'game-integration-test', context: 'Integration tests simulate complete games to verify all components work together.',
    glossary: [
      { term: 'AI vs AI', explanation: 'Simulation where two AI instances play against each other.' },
      { term: 'Move legality', explanation: 'Verifying each move follows the game rules.' },
      { term: 'Average/maximum time', explanation: 'Performance metrics detecting excessively slow moves.' },
    ] },
  { id: 'performance-benchmark', context: 'Performance benchmarks detect degradations before they affect the gaming experience.',
    glossary: [
      { term: 'Nodes/second (NPS)', explanation: 'How many positions the AI can evaluate per second.' },
      { term: 'Hit rate', explanation: 'Percentage of times a useful already-stored result is found in cache.' },
      { term: 'Regressions', explanation: 'Performance degradations caused by recent code changes.' },
    ] },
  { id: 'elo-rating', context: 'Comparing different AI versions in tournaments allows objectively measuring which changes improve play.',
    glossary: [
      { term: 'Rating', explanation: 'Number representing the playing strength of an AI or player.' },
      { term: 'K factor', explanation: 'Constant determining how much the rating changes after each game.' },
      { term: 'Round-robin tournament', explanation: 'Format where each participant plays against all others.' },
      { term: 'Expected rating', explanation: 'Statistical prediction of outcome based on rating difference.' },
    ] },
  { id: 'performance-monitor', context: 'Monitoring runtime performance identifies bottlenecks and verifies efficiency.',
    glossary: [
      { term: 'Real-time metrics', explanation: 'Performance data collected while the program runs.' },
      { term: 'Min, max, mean, median', explanation: 'Descriptive statistics summarizing data distribution.' },
      { term: 'NPS (nodes per second)', explanation: 'AI processing speed measured in evaluated positions per second.' },
      { term: 'TT hit rate', explanation: 'Percentage of transposition table queries finding useful data.' },
    ] },

  // --- Machine Learning ---
  { id: 'neural-network-eval', context: 'Neural networks can learn subtle patterns that are difficult to program manually.',
    glossary: [
      { term: 'Neural network', explanation: 'Brain-inspired computational model that learns patterns from data.' },
      { term: 'Tensor', explanation: 'Multidimensional data structure representing game state for the network.' },
      { term: 'One-hot encoding', explanation: 'Representation where each possible value is encoded as a binary vector.' },
      { term: 'Traditional evaluation', explanation: 'Rule-based function manually programmed by a human.' },
    ] },
  { id: 'reinforcement-learning', context: 'Learning from own experience allows the AI to improve without human-labeled examples.',
    glossary: [
      { term: 'Agent', explanation: 'The entity that makes decisions (in this case, the game AI).' },
      { term: 'Environment', explanation: 'The space where the agent acts and receives feedback.' },
      { term: 'Reward/punishment', explanation: 'Signals telling the agent whether its action was good or bad.' },
      { term: 'Discount factor (gamma)', explanation: 'Value reducing the importance of distant future rewards.' },
    ] },
  { id: 'self-play', context: 'Generating training data without human intervention allows scaling the learning process.',
    glossary: [
      { term: 'Experience buffer', explanation: 'Circular store saving moves and results from previous games.' },
      { term: 'Temporal discount', explanation: 'Technique assigning more value to actions near the result than initial ones.' },
      { term: 'Training data', explanation: 'Examples of moves and results the AI uses to learn.' },
    ] },
  { id: 'epsilon-greedy', context: 'Balancing between discovering and utilizing is essential in systems that learn from experience.',
    glossary: [
      { term: 'Exploration vs. exploitation', explanation: 'Dilemma between trying new options (explore) and using the best known (exploit).' },
      { term: 'Epsilon (ε)', explanation: 'Parameter controlling the probability of choosing a random action.' },
      { term: 'Random move', explanation: 'Move chosen randomly without considering the model\'s evaluation.' },
    ] },
  { id: 'hybrid-evaluator', context: 'Combining traditional and machine learning approaches can leverage the strengths of both.',
    glossary: [
      { term: 'Blend factor', explanation: 'Proportion determining how much weight each evaluation type has.' },
      { term: 'Traditional evaluation (rules)', explanation: 'Function manually programmed with defined criteria.' },
      { term: 'Neural evaluation (ML)', explanation: 'Score generated by a machine learning model.' },
      { term: 'Interpretability', explanation: 'Ability to understand why the AI made a specific decision.' },
    ] },
  { id: 'evaluation-tapering', context: 'Gradual transitions between game phases produce more natural and consistent evaluations.',
    glossary: [
      { term: 'Smooth interpolation', explanation: 'Gradual transition between two values instead of an abrupt change.' },
      { term: 'Evaluation weights', explanation: 'Multipliers determining the importance of each factor.' },
      { term: 'Continuous factor', explanation: 'Numeric value changing gradually, not in discrete jumps.' },
      { term: 'Remaining material', explanation: 'Pieces on the board, used as an indicator of game phase.' },
    ] },
];

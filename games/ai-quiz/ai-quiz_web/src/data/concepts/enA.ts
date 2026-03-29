/** English overrides for concept definitions and keyPoints (search + evaluation + optimization) */
interface ConceptOverride {
  definition: string;
  keyPoints: string[];
}

export const enConceptsA: Record<string, ConceptOverride> = {
  // --- Search Algorithms ---
  minimax: {
    definition: 'Recursive decision algorithm for two-player zero-sum games. Explores the entire game tree to a specified depth, assuming optimal play from both players.',
    keyPoints: ['Explores entire game tree to specified depth', 'Assumes optimal play from both players', 'Exponential complexity: O(b^d)'],
  },
  'alpha-beta': {
    definition: 'Minimax optimization that prunes branches that won\'t affect the final decision, reducing complexity from O(b^d) to O(b^(d/2)) and enabling much deeper searches.',
    keyPoints: ['Reduces complexity from O(b^d) to O(b^(d/2))', 'Enables much deeper searches', 'Critical for real-time performance'],
  },
  negamax: {
    definition: 'Minimax variant that simplifies code by using perspective switching. Uses a single function (multiplying by -1) instead of two separate branches for maximizing and minimizing.',
    keyPoints: ['Cleaner code with a single function', 'Uses -1 multiplication for perspective switching', 'Easier to maintain than standard minimax'],
  },
  'iterative-deepening': {
    definition: 'Progressive depth search with time management. Increases depth each iteration, guaranteeing an available move and adapting to remaining time.',
    keyPoints: ['Always has a move available', 'Improves move ordering for deeper searches', 'Adapts to available time'],
  },
  'quiescence-search': {
    definition: 'Search extension that only explores tactical moves (captures, promotions, checks) when normal search reaches depth zero, to avoid the "horizon effect" where the AI ignores imminent threats.',
    keyPoints: ['Avoids the "horizon effect"', 'Only explores tactical moves at depth zero', 'Improves evaluation accuracy in unstable positions'],
  },
  'bfs-pathfinding': {
    definition: 'Breadth-First Search algorithm that explores the board level by level to find the shortest path from the current pawn position to the goal, considering placed obstacles.',
    keyPoints: ['Explores level by level guaranteeing shortest path', 'Crucial for evaluating wall effectiveness in Quoridor', 'Complexity O(V + E) where V are vertices and E are edges'],
  },

  // --- Evaluation ---
  'multi-component-eval': {
    definition: 'Combines multiple strategic factors (material, positional, tactical, mobility, potential) into a single weighted score to evaluate the quality of a game position.',
    keyPoints: ['Combines material, position, tactics, mobility and potential', 'Each component multiplied by a configurable weight', 'Foundation of every modern evaluation function'],
  },
  'phase-based-eval': {
    definition: 'Adjusts evaluation weights based on the game phase (opening, middlegame, endgame), recognizing that the relative importance of each factor changes throughout the game.',
    keyPoints: ['Opening: more positional weight, less tactical', 'Middlegame: balanced weights', 'Endgame: more weight on material and potential'],
  },
  'fusion-evaluation': {
    definition: 'System that analyzes opportunities to merge pieces of the same type and level in Soluna. Evaluates immediate, potential, and chain fusions, considering impact on board control.',
    keyPoints: ['Evaluates immediate, potential and chain fusions', 'Calculates height advantage between players', 'Specific to the Soluna game'],
  },
  '12-signal-system': {
    definition: 'Sophisticated multi-factor evaluation system for Squadro that analyzes 12 distinct features: race, done, clash, chain, sprint, block, parity, struct, ones, ret, waste and mob.',
    keyPoints: ['Analyzes 12 signals: race, done, clash, chain, sprint, block, parity, struct, ones, ret, waste, mob', 'Each signal combined with specific weights', 'Designed specifically for asymmetric race games'],
  },
  'wall-merit': {
    definition: 'Algorithm that evaluates how effective a wall is at blocking the opponent in Quoridor. Considers the path distance increase, whether the wall is on a critical route, and its positional value.',
    keyPoints: ['Measures path distance delta when placing a wall', 'Evaluates if the wall is on the opponent\'s critical route', 'Combines factors: distance (70%), blocking (20%), position (10%)'],
  },
  'recovery-evaluation': {
    definition: 'Evaluates piece recovery opportunities in Pylos: immediate recoveries (high value), future recoveries (lower value) and opponent threats (negative value).',
    keyPoints: ['Immediate recovery: +15 points per opportunity', 'Future recovery: +5 points', 'Opponent threats: -10 points'],
  },
  'collision-chain': {
    definition: 'Algorithm that analyzes chain reactions when a piece collides with another in Squadro. Calculates immediate, secondary and tertiary collisions, evaluating the total tactical impact.',
    keyPoints: ['Analyzes direct collisions and chain reactions', 'Calculates maximum chain depth', 'Evaluates total impact on positional advantage'],
  },

  // --- Optimization ---
  'transposition-table': {
    definition: 'Data structure that caches results of already-evaluated positions to avoid recomputation. Uses hashing to identify identical positions reached by different move sequences.',
    keyPoints: ['Caches evaluations to avoid redundant work', 'Identifies transpositions (same position, different path)', 'Uses flags EXACT, ALPHA, BETA for result type'],
  },
  'zobrist-hashing': {
    definition: 'Efficient hashing technique that generates unique keys for board positions using XOR of pre-generated random numbers. Allows quick identification of identical positions without comparing the entire state.',
    keyPoints: ['Uses XOR operations with pre-generated random numbers', 'Allows incremental hash updating (very efficient)', 'Each piece at each position has a unique random number'],
  },
  'killer-moves': {
    definition: 'Moves that caused beta cutoffs at previous levels of the search tree. They are stored because they tend to be good moves in similar positions at the same depth.',
    keyPoints: ['Stores the 2 best moves per depth (ply)', 'Moves that caused cutoffs at the same level', 'Significantly improve move ordering'],
  },
  'history-heuristic': {
    definition: 'Technique that records which moves have been historically good in similar positions, assigning higher priority to moves that have previously produced good evaluations.',
    keyPoints: ['Records move successes weighted by depth²', 'Improves ordering for more efficient pruning', 'Complements killer moves with global information'],
  },
  'move-ordering': {
    definition: 'Strategy of ordering moves before searching them to maximize alpha-beta pruning. Prioritizes: TT move, tactical moves (captures), killer moves and history heuristic.',
    keyPoints: ['Priority: TT move > captures > killer moves > history', 'Uses MVV-LVA to order tactical moves', 'Better ordering = more pruning = faster search'],
  },
  'mvv-lva': {
    definition: 'Most Valuable Victim – Least Valuable Attacker. Heuristic that prioritizes captures where the most valuable piece is captured by the least valuable piece to optimize branch prediction.',
    keyPoints: ['Prioritizes capturing valuable pieces with cheap pieces', 'Improves processor branch prediction', 'Separates tactical from normal moves for better prediction'],
  },
  'age-based-replacement': {
    definition: 'Replacement policy in transposition tables that considers entry age. Replaces if the entry is empty, the new one has greater depth, or the current entry is too old.',
    keyPoints: ['Three criteria: empty, greater depth, excessive age', 'Updates age on successful lookups (approx LRU)', 'Keeps relevant entries, discards obsolete ones'],
  },
};

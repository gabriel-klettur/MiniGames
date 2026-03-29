import type { HelpSpec } from '../hints/types';

/** English hint overrides for search algorithms + evaluation + optimization */
export const enHintsA: HelpSpec[] = [
  // --- Search Algorithms ---
  { id: 'minimax', context: 'In game theory, search algorithms explore possible future moves to make decisions.',
    glossary: [
      { term: 'Zero-sum game', explanation: 'A game where one player\'s gain is exactly the other\'s loss.' },
      { term: 'Game tree', explanation: 'Structure representing all possible move sequences from a position.' },
      { term: 'Depth', explanation: 'Number of moves ahead the algorithm analyzes.' },
      { term: 'Optimal play', explanation: 'Assuming both players always choose the best possible move.' },
    ] },
  { id: 'alpha-beta', context: 'Search optimizations aim to reduce positions evaluated without losing decision quality.',
    glossary: [
      { term: 'Pruning', explanation: 'Discarding search tree branches that won\'t affect the final result.' },
      { term: 'Branches', explanation: 'Each possible move from a game position.' },
      { term: 'Complexity O(b^d)', explanation: 'Notation describing how many positions are evaluated, where b is branching factor and d is depth.' },
      { term: 'Real-time', explanation: 'Ability to respond within an acceptable time for the player.' },
    ] },
  { id: 'negamax', context: 'In two-player games, what benefits one harms the other, allowing code simplifications.',
    glossary: [
      { term: 'Perspective switching', explanation: 'Evaluating the position from the active player\'s point of view.' },
      { term: 'Multiply by -1', explanation: 'Operation that inverts the evaluation: good for one player is bad for the other.' },
      { term: 'Maximize/Minimize', explanation: 'The two players seek to maximize and minimize the score, respectively.' },
    ] },
  { id: 'iterative-deepening', context: 'Time management is crucial in timed games: better an acceptable answer than running out of time.',
    glossary: [
      { term: 'Progressive search', explanation: 'Strategy starting with short searches and gradually deepening.' },
      { term: 'Depth', explanation: 'Number of future moves analyzed.' },
      { term: 'Remaining time', explanation: 'Game clock limiting how long the AI can think.' },
      { term: 'Move ordering', explanation: 'Organizing moves by likelihood of being good before searching.' },
    ] },
  { id: 'quiescence-search', context: 'Positions with active tactical action require extra analysis beyond the normal depth limit.',
    glossary: [
      { term: 'Horizon effect', explanation: 'When the AI misses a threat because it falls just past its depth limit.' },
      { term: 'Tactical moves', explanation: 'Direct action moves like captures, promotions, or checks.' },
      { term: 'Depth zero', explanation: 'The point where normal search stops deepening.' },
      { term: 'Unstable positions', explanation: 'Board situations with active exchanges or threats.' },
    ] },
  { id: 'bfs-pathfinding', context: 'Pathfinding algorithms compute distances and optimal routes on a board with constraints.',
    glossary: [
      { term: 'Breadth-First Search', explanation: 'Exploration visiting all neighbors of a node before moving to the next level.' },
      { term: 'Level by level', explanation: 'Exploring all positions at distance 1 first, then distance 2, etc.' },
      { term: 'Shortest path', explanation: 'The route requiring the fewest steps between two points.' },
      { term: 'Obstacles', explanation: 'Board elements that block certain paths.' },
    ] },

  // --- Evaluation ---
  { id: 'multi-component-eval', context: 'Evaluating a game position requires combining multiple aspects into a single number.',
    glossary: [
      { term: 'Weighted score', explanation: 'Numeric value calculated by multiplying each factor by its relative importance.' },
      { term: 'Material', explanation: 'Quantity and value of pieces a player has.' },
      { term: 'Mobility', explanation: 'Number of legal moves available to a player in a position.' },
      { term: 'Configurable weight', explanation: 'Multiplier determining the relative importance of each component.' },
    ] },
  { id: 'phase-based-eval', context: 'The importance of each strategic factor varies depending on the stage of the game.',
    glossary: [
      { term: 'Game phase', explanation: 'Stage of the game (opening, middlegame, endgame) where strategic priorities change.' },
      { term: 'Evaluation weights', explanation: 'Multipliers determining how much each factor influences the score.' },
      { term: 'Opening/Middlegame/Endgame', explanation: 'The three traditional game stages based on progress.' },
    ] },
  { id: 'fusion-evaluation', context: 'In games with fusion mechanics, evaluating piece-combining opportunities is key.',
    glossary: [
      { term: 'Merge pieces', explanation: 'Combining two pieces of the same type and level to create a higher-level piece.' },
      { term: 'Chain', explanation: 'Sequence of consecutive fusions triggered one after another.' },
      { term: 'Board control', explanation: 'Dominance over strategic areas of the game board.' },
      { term: 'Height advantage', explanation: 'Difference in piece levels between players.' },
    ] },
  { id: '12-signal-system', context: 'Multi-signal systems evaluate many game aspects simultaneously to capture strategic complexity.',
    glossary: [
      { term: 'Signal', explanation: 'Each measurable characteristic analyzed to evaluate a position.' },
      { term: 'Asymmetric race games', explanation: 'Games where players compete to reach a goal but in different directions.' },
      { term: 'Specific weights', explanation: 'Calibrated multipliers determining the importance of each signal.' },
    ] },
  { id: 'wall-merit', context: 'Evaluating obstacle effectiveness requires measuring their impact on player routes.',
    glossary: [
      { term: 'Distance delta', explanation: 'Change in shortest path length when placing an obstacle.' },
      { term: 'Critical route', explanation: 'Current shortest path a player uses to reach their goal.' },
      { term: 'Positional value', explanation: 'Strategic importance of a specific board location.' },
    ] },
  { id: 'recovery-evaluation', context: 'In games where pieces can be recovered, evaluating these opportunities gives strategic advantage.',
    glossary: [
      { term: 'Piece recovery', explanation: 'Action of removing one\'s own piece from the board for later reuse.' },
      { term: 'Opponent threats', explanation: 'Opportunities the rival has to make advantageous moves.' },
      { term: 'Negative value', explanation: 'Score penalizing unfavorable situations for the evaluated player.' },
    ] },
  { id: 'collision-chain', context: 'Analyzing event chains helps foresee the total impact of a single action.',
    glossary: [
      { term: 'Collision', explanation: 'Event where a moving piece impacts an opposing piece.' },
      { term: 'Chain reaction', explanation: 'Series of collisions triggered one after another from an initial one.' },
      { term: 'Tactical impact', explanation: 'Total effect of a move considering all its immediate consequences.' },
      { term: 'Positional advantage', explanation: 'Improvement in the relative position of a player\'s pieces.' },
    ] },

  // --- Optimization ---
  { id: 'transposition-table', context: 'Avoiding recomputation of already-evaluated positions is one of the most important AI search optimizations.',
    glossary: [
      { term: 'Cache', explanation: 'Temporary storage of results to avoid recalculating them.' },
      { term: 'Hashing', explanation: 'Generating a unique compact identifier for a board state.' },
      { term: 'Transposition', explanation: 'Same board position reached by different move sequences.' },
      { term: 'Flags EXACT, ALPHA, BETA', explanation: 'Indicators of stored evaluation type (exact or upper/lower bound).' },
    ] },
  { id: 'zobrist-hashing', context: 'A good hashing system allows quick position identification without comparing the full board state.',
    glossary: [
      { term: 'XOR', explanation: 'Bitwise logical operation that combines values reversibly and efficiently.' },
      { term: 'Pre-generated random numbers', explanation: 'Table of random values created at startup to represent each piece at each cell.' },
      { term: 'Incremental update', explanation: 'Modifying the existing hash with only the changes, without recalculating everything.' },
      { term: 'Unique key', explanation: 'Numeric identifier representing a specific board position.' },
    ] },
  { id: 'killer-moves', context: 'Remembering which moves were effective earlier lets you try them first in similar positions.',
    glossary: [
      { term: 'Beta cutoff', explanation: 'When a branch is discarded because a sufficiently good move was found.' },
      { term: 'Level (ply)', explanation: 'Specific layer or depth within the search tree.' },
      { term: 'Move ordering', explanation: 'Organizing moves to evaluate starting from the most promising.' },
    ] },
  { id: 'history-heuristic', context: 'Tracking historical move performance helps order them better in future searches.',
    glossary: [
      { term: 'Heuristic', explanation: 'Practical rule based on experience for making better search decisions.' },
      { term: 'Successes weighted by depth²', explanation: 'Successful moves in deeper searches receive greater weight.' },
      { term: 'Global information', explanation: 'Statistics accumulated across the entire search, not just the current level.' },
    ] },
  { id: 'move-ordering', context: 'Evaluating the most promising moves first allows discarding more branches and searching faster.',
    glossary: [
      { term: 'Alpha-beta pruning', explanation: 'Technique discarding tree branches that won\'t affect the final decision.' },
      { term: 'TT move', explanation: 'Best move stored in the transposition table for that position.' },
      { term: 'Captures', explanation: 'Moves that remove an opponent\'s piece from the board.' },
    ] },
  { id: 'mvv-lva', context: 'Prioritizing advantageous captures improves search efficiency by exploring impactful moves first.',
    glossary: [
      { term: 'Most valuable victim', explanation: 'The captured piece of highest value in an exchange.' },
      { term: 'Least valuable attacker', explanation: 'The piece making the capture, ideally of lesser value.' },
      { term: 'Branch prediction', explanation: 'Processor optimization predicting condition outcomes for faster code execution.' },
      { term: 'Tactical vs. normal moves', explanation: 'Distinction between captures/exchanges and positional moves.' },
    ] },
  { id: 'age-based-replacement', context: 'When space is limited, deciding what data to keep directly affects performance.',
    glossary: [
      { term: 'Replacement policy', explanation: 'Rule deciding which old entry to remove when the table is full.' },
      { term: 'Greater depth', explanation: 'Deeper searches generate more valuable results worth preserving.' },
      { term: 'LRU (Least Recently Used)', explanation: 'Strategy discarding items that have gone the longest without use.' },
      { term: 'Obsolete entries', explanation: 'Stored data no longer relevant to the current search.' },
    ] },
];

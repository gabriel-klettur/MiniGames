# 🧠 IA de Quoridor: Análisis Técnico Profundo

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Algoritmo Minimax con Alpha-Beta](#algoritmo-minimax-con-alpha-beta)
3. [Función de Evaluación](#función-de-evaluación)
4. [Heurísticas de Paredes](#heurísticas-de-paredes)
5. [Transposition Table](#transposition-table)
6. [Move Ordering Avanzado](#move-ordering-avanzado)
7. [Estrategias de Apertura](#estrategias-de-apertura)
8. [Control de Tiempo Adaptativo](#control-de-tiempo-adaptativo)
9. [Telemetry y Tracing](#telemetry-y-tracing)
10. [Web Workers](#web-workers)

---

## 🏗️ Arquitectura General

### **Estructura Modular**
```
src/ia/
├── minimax.ts              # Motor de búsqueda principal
├── eval.ts                 # Función de evaluación
├── moves.ts                # Generación de movimientos
├── hash.ts                 # Zobrist hashing
├── telemetry.ts            # Métricas y tracing
├── types.ts                # Tipos y interfaces
└── worker/
    └── aiWorker.ts         # Web Worker
```

### **Integración con Redux**
```typescript
// store/iaSlice.ts
interface IAState {
  depth: number;
  timeMode: 'auto' | 'manual';
  timeSeconds: number;
  preset: IAPreset;
  config: IAConfig;
  stats: IAStats;
  bySide: Record<'L' | 'D', SideConfig>;
}
```

---

## 🔍 Algoritmo Minimax con Alpha-Beta

### **Implementación Principal**

El motor está implementado en `minimax.ts` con las siguientes características:

```typescript
function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: Player,
  deadline?: number,
  config?: SearchConfig,
  tt?: Map<string, TTEntry>,
  ply: number = 0,
  killers?: AIMove[][],
  history?: Map<string, number>,
  lastMove?: AIMove | null,
  qPlies: number = 0,
  tracer?: Tracer,
  shouldStop?: (() => boolean)
): ABResult
```

### **Características del Algoritmo**

#### **1. Iterative Deepening**
```typescript
function iterativeDeepening(state: GameState, maxDepth: number, timeLimit: number): SearchResult {
  let bestResult: SearchResult = { score: 0, pv: [], nodes: 0 };
  
  for (let depth = 1; depth <= maxDepth; depth++) {
    const result = alphaBeta(state, depth, -∞, +∞, rootPlayer, deadline, config);
    
    if (shouldStop()) break;
    
    bestResult = result;
    updateTelemetry(depth, result);
  }
  
  return bestResult;
}
```

#### **2. Quiescence Extension**
```typescript
// Extensión para movimientos de pared
if (config?.enableQuiescence && lastMove && lastMove.kind === 'wall' && qPlies < (config.quiescenceMaxPlies ?? 0)) {
  depth = 1;  // Extender una capa
  qPlies += 1;
}
```

#### **3. Time Management**
```typescript
if ((shouldStop && shouldStop()) || (deadline !== undefined && performance.now() >= deadline)) {
  const score = evaluate(state, rootPlayer);
  return { score, pv: [], nodes: 1 };
}
```

---

## 📊 Función de Evaluación

### **Arquitectura Multi-Componente**

```typescript
export function evaluate(state: GameState, rootPlayer: Player): number {
  const me = rootPlayer;
  const opp = me === 'L' ? 'D' : 'L';
  
  // Componentes principales
  const distanceScore = evaluateDistance(state, me, opp);
  const wallScore = evaluateWalls(state, me, opp);
  const mobilityScore = evaluateMobility(state, me, opp);
  const centerScore = evaluateCenterControl(state, me, opp);
  
  return (
    distanceScore * DISTANCE_WEIGHT +
    wallScore * WALL_WEIGHT +
    mobilityScore * MOBILITY_WEIGHT +
    centerScore * CENTER_WEIGHT
  );
}
```

### **Componentes Detallados**

#### **1. Evaluación de Distancia**
```typescript
function evaluateDistance(state: GameState, me: Player, opp: Player): number {
  const myDistance = shortestPathToGoal(state, me);
  const oppDistance = shortestPathToGoal(state, opp);
  
  // Distance advantage (negative is better for me)
  const distanceDelta = oppDistance - myDistance;
  
  // Normalize to [-100, 100] range
  return Math.max(-100, Math.min(100, distanceDelta * 10));
}

function shortestPathToGoal(state: GameState, player: Player): number {
  // BFS implementation for shortest path
  const start = state.pawns[player];
  const goalRow = goalRow(state.size, player);
  
  const queue = [{ pos: start, dist: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;
    
    if (pos.row === goalRow) return dist;
    
    if (visited.has(`${pos.row},${pos.col}`)) continue;
    visited.add(`${pos.row},${pos.col}`);
    
    // Generate pawn moves (no walls considered)
    const moves = generatePawnMoves(state, player, pos);
    for (const move of moves) {
      queue.push({ pos: move, dist: dist + 1 });
    }
  }
  
  return Infinity;  // No path found
}
```

#### **2. Evaluación de Paredes**
```typescript
function evaluateWalls(state: GameState, me: Player, opp: Player): number {
  let score = 0;
  
  // Wall count advantage
  const myWalls = state.walls[me].length;
  const oppWalls = state.walls[opp].length;
  score += (myWalls - oppWalls) * WALL_COUNT_WEIGHT;
  
  // Wall quality (blocking potential)
  score += evaluateWallQuality(state, me, opp);
  
  return score;
}

function evaluateWallQuality(state: GameState, me: Player, opp: Player): number {
  let score = 0;
  
  for (const wall of state.walls[me]) {
    // Check if wall blocks opponent's path
    const blocksOpponent = doesWallBlockPath(state, wall, opp);
    if (blocksOpponent) {
      score += WALL_BLOCK_WEIGHT;
    }
    
    // Check if wall is in opponent's path area
    const inPathArea = isInPathArea(state, wall, opp);
    if (inPathArea) {
      score += WALL_PATH_AREA_WEIGHT;
    }
  }
  
  return score;
}

function doesWallBlockPath(state: GameState, wall: Wall, opponent: Player): boolean {
  // Remove wall temporarily and check path difference
  const pathWithoutWall = shortestPathToGoal(state, opponent);
  const stateWithoutWall = removeWall(state, wall);
  const pathWithWall = shortestPathToGoal(stateWithoutWall, opponent);
  
  return pathWithWall > pathWithoutWall;
}
```

#### **3. Evaluación de Movilidad**
```typescript
function evaluateMobility(state: GameState, me: Player, opp: Player): number {
  const myMoves = generatePawnMoves(state, me, state.pawns[me]).length;
  const oppMoves = generatePawnMoves(state, opp, state.pawns[opp]).length;
  
  return (myMoves - oppMoves) * MOBILITY_WEIGHT;
}
```

---

## 🧱 Heurísticas de Paredes

### **Wall Merit Function**

```typescript
function calculateWallMerit(state: GameState, wall: Wall, player: Player): number {
  const opponent = player === 'L' ? 'D' : 'L';
  
  // Distance impact
  const distanceDelta = calculateDistanceImpact(state, wall, opponent);
  
  // Path blocking potential
  const blockingPotential = calculateBlockingPotential(state, wall, opponent);
  
  // Position value
  const positionValue = calculatePositionValue(wall);
  
  return (
    distanceDelta * config.wallMeritLambda +
    blockingPotential * (1 - config.wallMeritLambda) +
    positionValue
  );
}

function calculateDistanceImpact(state: GameState, wall: Wall, opponent: Player): number {
  const currentDistance = shortestPathToGoal(state, opponent);
  const stateWithWall = placeWall(state, wall);
  const newDistance = shortestPathToGoal(stateWithWall, opponent);
  
  return newDistance - currentDistance;  // Positive = good for player
}

function calculateBlockingPotential(state: GameState, wall: Wall, opponent: Player): number {
  // Check if wall is in critical path area
  const opponentPos = state.pawns[opponent];
  const goalRow = goalRow(state.size, opponent);
  
  // Calculate if wall is between opponent and goal
  const wallRow = wall.orientation === 'h' ? wall.row : wall.row;
  const wallCol = wall.orientation === 'v' ? wall.col : wall.col;
  
  const blocksPath = 
    (opponent.row < goalRow && wallRow > opponent.row && wallRow < goalRow) ||
    (opponent.row > goalRow && wallRow < opponent.row && wallRow > goalRow);
  
  return blocksPath ? 1 : 0;
}
```

### **Wall Path Filtering**

```typescript
function filterWallsByPath(state: GameState, walls: Wall[], opponent: Player, radius: number): Wall[] {
  const opponentPath = getShortestPath(state, opponent);
  
  return walls.filter(wall => {
    return isNearPath(wall, opponentPath, radius);
  });
}

function isNearPath(wall: Wall, path: Position[], radius: number): boolean {
  for (const pos of path) {
    const distance = Math.abs(wall.row - pos.row) + Math.abs(wall.col - pos.col);
    if (distance <= radius) return true;
  }
  return false;
}
```

---

## 🗄️ Transposition Table

### **Implementación Simple**

```typescript
interface TTEntry {
  depth: number;
  score: number;
  alpha: number;
  beta: number;
  best?: AIMove;
}

// Simple TT without flags (exact bounds only)
const key = config?.enableTT ? stateKey(state) : undefined;
if (key && tt) {
  telemetry.incTTLookup();
  const e = tt.get(key);
  if (e && e.depth >= depth && e.alpha <= alpha && e.beta >= beta) {
    telemetry.incTTHit();
    return { score: e.score, pv: [], nodes: 1 };
  }
}
```

### **Zobrist Hashing**

```typescript
function stateKey(state: GameState): string {
  let hash = 0;
  
  // Hash pawn positions
  hash ^= ZOBRIST_PAWN[state.pawns.L.row][state.pawns.L.col][0];
  hash ^= ZOBRIST_PAWN[state.pawns.D.row][state.pawns.D.col][1];
  
  // Hash walls
  for (const wall of state.walls.L) {
    hash ^= ZOBRIST_WALL[wall.row][wall.col][wall.orientation][0];
  }
  for (const wall of state.walls.D) {
    hash ^= ZOBRIST_WALL[wall.row][wall.col][wall.orientation][1];
  }
  
  // Hash current player
  hash ^= ZOBRIST_TURN[state.current];
  
  return hash.toString();
}
```

---

## 🎯 Move Ordering Avanzado

### **Sistema de Prioridades Multi-Nivel**

```typescript
function orderMoves(moves: AIMove[], config: SearchConfig, hints: MoveHints): AIMove[] {
  return moves.sort((a, b) => {
    // 1. TT move (highest priority)
    if (hints.ttMove) {
      if (moveKey(a) === moveKey(hints.ttMove)) return -1;
      if (moveKey(b) === moveKey(hints.ttMove)) return 1;
    }
    
    // 2. Killer moves
    if (config.enableKillerHeuristic) {
      const aIsKiller = hints.killers?.includes(a);
      const bIsKiller = hints.killers?.includes(b);
      if (aIsKiller && !bIsKiller) return -1;
      if (!aIsKiller && bIsKiller) return 1;
    }
    
    // 3. History heuristic
    if (config.enableHistoryHeuristic) {
      const aHistory = hints.history?.get(moveKey(a)) || 0;
      const bHistory = hints.history?.get(moveKey(b)) || 0;
      if (aHistory !== bHistory) return bHistory - aHistory;
    }
    
    // 4. Move ordering heuristics
    if (config.enableMoveOrdering) {
      return compareMoveHeuristics(a, b, state);
    }
    
    return 0;
  });
}

function compareMoveHeuristics(a: AIMove, b: AIMove, state: GameState): number {
  // Prefer pawn moves over wall moves for progress
  if (a.kind === 'pawn' && b.kind === 'wall') return -1;
  if (a.kind === 'wall' && b.kind === 'pawn') return 1;
  
  // For pawn moves, prefer forward progress
  if (a.kind === 'pawn' && b.kind === 'pawn') {
    const aProgress = calculateProgress(a.to, state.pawns[state.current]);
    const bProgress = calculateProgress(b.to, state.pawns[state.current]);
    return bProgress - aProgress;
  }
  
  // For wall moves, prefer strategic positions
  if (a.kind === 'wall' && b.kind === 'wall') {
    const aMerit = calculateWallMerit(state, a.wall, state.current);
    const bMerit = calculateWallMerit(state, b.wall, state.current);
    return bMerit - aMerit;
  }
  
  return 0;
}
```

### **Killer Heuristic Implementation**

```typescript
interface Killers {
  [ply: number]: AIMove[];
}

function updateKillers(killers: Killers, ply: number, move: AIMove): void {
  const plyKillers = killers[ply] || [];
  
  // Move to front if already exists
  const existingIndex = plyKillers.findIndex(m => moveEquals(m, move));
  if (existingIndex >= 0) {
    plyKillers.splice(existingIndex, 1);
  }
  
  // Add to front, maintain max 2 killers per ply
  plyKillers.unshift(move);
  if (plyKillers.length > 2) {
    plyKillers.length = 2;
  }
  
  killers[ply] = plyKillers;
}
```

---

## 🚪 Estrategias de Apertura

### **Sistema de Aperturas**

```typescript
interface OpeningStrategy {
  type: 'random' | 'aggressive' | 'defensive' | 'balanced';
  plyLimit: number;
  wallProbability: number;
  centerBias: number;
}

function selectOpeningMove(state: GameState, strategy: OpeningStrategy): AIMove {
  const moves = generateMoves(state);
  
  if (strategy.type === 'random') {
    return selectRandomOpening(moves);
  }
  
  // Filter and score moves based on strategy
  const scoredMoves = moves.map(move => ({
    move,
    score: scoreOpeningMove(move, state, strategy)
  }));
  
  // Select by weighted probability
  return selectWeightedRandom(scoredMoves);
}

function scoreOpeningMove(move: AIMove, state: GameState, strategy: OpeningStrategy): number {
  let score = 0;
  
  if (move.kind === 'pawn') {
    // Pawn moves: prefer center advancement
    const centerDistance = Math.abs(move.to.col - state.size / 2);
    score += (4 - centerDistance) * strategy.centerBias;
    
    // Forward progress
    const forwardProgress = move.to.row - state.pawns[state.current].row;
    score += Math.abs(forwardProgress) * 10;
  } else if (move.kind === 'wall') {
    // Wall moves: based on strategy
    if (strategy.type === 'aggressive') {
      score += calculateBlockingPotential(state, move.wall, getOpponent(state.current)) * 15;
    } else if (strategy.type === 'defensive') {
      score += calculateDefensiveValue(state, move.wall, state.current) * 15;
    }
    
    // Center preference
    const centerDistance = Math.abs(move.wall.row - state.size / 2) + 
                          Math.abs(move.wall.col - state.size / 2);
    score += (4 - centerDistance) * strategy.centerBias;
  }
  
  return score;
}
```

### **Apertura Rápida (Fast Opening)**

```typescript
function fastOpeningEnabled(state: GameState, config: IAConfig): boolean {
  return config.openingFastEnabled && 
         state.moveCount < config.openingFastPlies;
}

function getFastOpeningTimeLimit(baseTime: number, config: IAConfig): number {
  return Math.min(baseTime, config.openingFastSeconds * 1000);
}
```

---

## ⏱️ Control de Tiempo Adaptativo

### **Time Management Algorithm**

```typescript
interface TimeManager {
  allocateTime(state: GameState, baseTime: number, config: IAConfig): number;
}

function allocateTime(state: GameState, baseTime: number, config: IAConfig): number {
  const complexity = calculatePositionComplexity(state);
  const phase = detectGamePhase(state);
  
  let allocatedTime = baseTime;
  
  // Adjust based on complexity
  if (complexity > 0.8) {
    allocatedTime *= 1.5;  // Complex positions need more time
  } else if (complexity < 0.3) {
    allocatedTime *= 0.7;  // Simple positions need less time
  }
  
  // Adjust based on game phase
  if (phase === 'opening') {
    allocatedTime *= 0.8;  // Opening moves are faster
  } else if (phase === 'endgame') {
    allocatedTime *= 1.3;  // Endgame needs more precision
  }
  
  // Apply safety margin
  const safetyMargin = config.safetyMarginSeconds || 0.15;
  allocatedTime = Math.max(allocatedTime - safetyMargin * 1000, 100);
  
  return allocatedTime;
}

function calculatePositionComplexity(state: GameState): number {
  let complexity = 0;
  
  // Wall count contributes to complexity
  const totalWalls = state.walls.L.length + state.walls.D.length;
  complexity += totalWalls * 0.1;
  
  // Path congestion adds complexity
  const myPathLength = shortestPathToGoal(state, state.current);
  const oppPathLength = shortestPathToGoal(state, getOpponent(state.current));
  const pathCongestion = (myPathLength + oppPathLength) / (state.size * 2);
  complexity += pathCongestion * 0.3;
  
  // Center control adds complexity
  const centerControl = calculateCenterControl(state);
  complexity += centerControl * 0.2;
  
  return Math.min(complexity, 1.0);
}
```

---

## 📊 Telemetry y Tracing

### **Sistema de Métricas**

```typescript
class Telemetry {
  private nodes = 0;
  private ttHits = 0;
  private ttLookups = 0;
  private cutoffs = 0;
  private startTime = 0;
  
  incNodes(count: number = 1): void {
    this.nodes += count;
  }
  
  incTTHit(): void {
    this.ttHits++;
  }
  
  incTTLookup(): void {
    this.ttLookups++;
  }
  
  incCutoff(): void {
    this.cutoffs++;
  }
  
  getStats(): SearchStats {
    const elapsed = performance.now() - this.startTime;
    return {
      nodes: this.nodes,
      ttHits: this.ttHits,
      ttReads: this.ttLookups,
      cutoffs: this.cutoffs,
      ttHitRate: this.ttLookups > 0 ? this.ttHits / this.ttLookups : 0,
      nps: this.nodes / (elapsed / 1000),
      elapsedMs: elapsed
    };
  }
}
```

### **Tracing System**

```typescript
interface TraceEvent {
  type: 'node_enter' | 'node_exit' | 'eval' | 'tt_hit' | 'cutoff';
  timestamp: number;
  depth: number;
  ply: number;
  nodeId: number;
  score?: number;
  alpha?: number;
  beta?: number;
  move?: string;
}

class Tracer {
  private events: TraceEvent[] = [];
  private nodeIdCounter = 0;
  private nodeStack: number[] = [];
  
  nodeEnter(depth: number, ply: number, alpha: number, beta: number, maximizing: boolean): void {
    const nodeId = this.nodeIdCounter++;
    this.nodeStack.push(nodeId);
    
    this.events.push({
      type: 'node_enter',
      timestamp: performance.now(),
      depth,
      ply,
      nodeId,
      alpha,
      beta
    });
  }
  
  nodeExit(depth: number, ply: number, score: number): void {
    const nodeId = this.nodeStack.pop();
    
    this.events.push({
      type: 'node_exit',
      timestamp: performance.now(),
      depth,
      ply,
      nodeId,
      score
    });
  }
  
  emitNode(event: Omit<TraceEvent, 'timestamp' | 'nodeId'>): void {
    this.events.push({
      ...event,
      timestamp: performance.now(),
      nodeId: this.nodeStack[this.nodeStack.length - 1]
    });
  }
  
  getTrace(): TraceEvent[] {
    return this.events;
  }
}
```

---

## 🔄 Web Workers

### **Arquitectura del Worker**

```typescript
// aiWorker.ts
self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'search':
      handleSearch(payload);
      break;
    case 'stop':
      handleStop();
      break;
    case 'configure':
      handleConfigure(payload);
      break;
  }
};

function handleSearch(payload: SearchRequest): void {
  const { state, options, config } = payload;
  
  try {
    const result = minimax(state, options.depth, options.timeLimit, config);
    
    self.postMessage({
      type: 'result',
      payload: {
        ...result,
        stats: telemetry.getStats(),
        trace: tracer.getTrace()
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: { message: error.message }
    });
  }
}
```

### **Integración con Main Thread**

```typescript
class QuoridorAI {
  private worker: Worker;
  private searchController: SearchController;
  
  constructor() {
    this.worker = new Worker('/src/ia/worker/aiWorker.ts');
    this.searchController = new SearchController(this.worker);
  }
  
  async findBestMove(state: GameState, options: SearchOptions): Promise<SearchResult> {
    return this.searchController.search(state, options);
  }
  
  stopSearch(): void {
    this.searchController.stop();
  }
  
  configure(config: IAConfig): void {
    this.worker.postMessage({
      type: 'configure',
      payload: config
    });
  }
}

class SearchController {
  private searching = false;
  private currentSearch: Promise<SearchResult> | null = null;
  
  constructor(private worker: Worker) {
    this.setupMessageHandlers();
  }
  
  async search(state: GameState, options: SearchOptions): Promise<SearchResult> {
    if (this.searching) {
      throw new Error('Search already in progress');
    }
    
    this.searching = true;
    
    this.currentSearch = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Search timeout'));
      }, options.timeLimit + 1000);
      
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        
        if (type === 'result') {
          clearTimeout(timeout);
          this.cleanup();
          resolve(payload);
        } else if (type === 'error') {
          clearTimeout(timeout);
          this.cleanup();
          reject(new Error(payload.message));
        } else if (type === 'progress') {
          // Handle progress updates
          this.onProgress(payload);
        }
      };
      
      this.worker.addEventListener('message', handleMessage);
      
      this.worker.postMessage({
        type: 'search',
        payload: { state, options }
      });
    });
    
    return this.currentSearch;
  }
  
  stop(): void {
    if (this.searching) {
      this.worker.postMessage({ type: 'stop' });
      this.cleanup();
    }
  }
  
  private cleanup(): void {
    this.searching = false;
    this.currentSearch = null;
    // Remove event listeners, etc.
  }
  
  private onProgress(progress: any): void {
    // Emit progress events
  }
  
  private setupMessageHandlers(): void {
    // Setup message handling
  }
}
```

---

## 📈 Optimizaciones de Rendimiento

### **Memory Management**

```typescript
class MemoryPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  
  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Usage for move generation
const movePool = new MemoryPool(
  () => ({ kind: 'pawn', to: { row: 0, col: 0 } }),
  (move) => { move.to = { row: 0, col: 0 }; }
);
```

### **Cache Optimization**

```typescript
class PathCache {
  private cache = new Map<string, number>();
  private maxSize = 1000;
  
  get(state: GameState, player: Player): number | null {
    const key = this.generateKey(state, player);
    return this.cache.get(key) || null;
  }
  
  set(state: GameState, player: Player, distance: number): void {
    const key = this.generateKey(state, player);
    
    if (this.cache.size >= this.maxSize) {
      // Simple LRU: clear oldest entries
      const keysToDelete = Array.from(this.cache.keys()).slice(0, 100);
      for (const k of keysToDelete) {
        this.cache.delete(k);
      }
    }
    
    this.cache.set(key, distance);
  }
  
  private generateKey(state: GameState, player: Player): string {
    // Generate compact key for position
    return `${state.pawns[player].row},${state.pawns[player].col}_${this.wallsKey(state)}`;
  }
  
  private wallsKey(state: GameState): string {
    // Generate compact representation of walls
    return [...state.walls.L, ...state.walls.D]
      .map(w => `${w.row}${w.col}${w.orientation}`)
      .join('');
  }
}
```

---

## 🔮 Extensiones y Mejoras Futuras

### **Plan de Mejoras**

1. **Principal Variation Search (PVS)**
   - Implementar búsqueda con ventanas estrechas
   - Mejorar eficiencia en búsquedas profundas

2. **Null-Move Pruning**
   - Detectar zugzwang positions
   - Reducir factor de ramificación

3. **Monte Carlo Tree Search**
   - Complementar alpha-beta para ciertas posiciones
   - Mejor handling de incertidumbre

4. **Learning Integration**
   - Ajuste automático de pesos de evaluación
   - Adaptación a estilo del oponente

---

## 📝 Conclusión

La IA de Quoridor implementa un **motor minimax completo** con **alpha-beta pruning** y múltiples optimizaciones específicas para juegos de tablero con paredes. Las características clave incluyen:

- **Evaluación multi-componente** con distancia, control de paredes y movilidad
- **Heurísticas especializadas** para placement estratégico de paredes
- **Sistema de aperturas configurable** con diferentes estrategias
- **Control de tiempo adaptativo** basado en complejidad posicional
- **Telemetry completa** para análisis y debugging
- **Arquitectura modular** que permite fácil extensión

El sistema está diseñado para ser **configurable en runtime** a través de Redux, permitiendo experimentación con diferentes combinaciones de parámetros sin recompilación, lo que lo hace ideal tanto para juego competitivo como para investigación en IA de juegos abstractos.

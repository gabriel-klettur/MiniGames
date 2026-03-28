/* AI Telemetry — lightweight counters and timers for Minimax/MCTS.
 * Collects timings and counts across generateMoves, validateWallPlacement,
 * shortestDistanceToGoal, TT lookups/hits, node visits, and alpha/beta cutoffs.
 * Prints a clean summary after each search.
 */

export type IterationStats = {
  depth: number;
  nodes: number;
  cutAlpha: number;
  cutBeta: number;
  timeMs: number;
};

export type TelemetrySnapshot = {
  total: {
    nodes: number;
    cutAlpha: number;
    cutBeta: number;
    ttLookups: number;
    ttHits: number;
    generateMovesMs: number;
    generateMovesCount: number;
    validateWallMs: number;
    validateWallCount: number;
    shortestDistMs: number;
    shortestDistCount: number;
  };
  perIter: IterationStats[];
};

class Telemetry {
  private _nodes = 0;
  private _cutA = 0;
  private _cutB = 0;
  private _ttLookups = 0;
  private _ttHits = 0;
  private _genMovesMs = 0;
  private _genMovesCount = 0;
  private _validateWallMs = 0;
  private _validateWallCount = 0;
  private _shortestDistMs = 0;
  private _shortestDistCount = 0;
  private _iters: Map<number, IterationStats> = new Map();

  reset(): void {
    this._nodes = 0;
    this._cutA = 0;
    this._cutB = 0;
    this._ttLookups = 0;
    this._ttHits = 0;
    this._genMovesMs = 0;
    this._genMovesCount = 0;
    this._validateWallMs = 0;
    this._validateWallCount = 0;
    this._shortestDistMs = 0;
    this._shortestDistCount = 0;
    this._iters.clear();
  }

  // --- Counters ---
  incNodes(n = 1): void { this._nodes += n; }
  incCutAlpha(n = 1): void { this._cutA += n; }
  incCutBeta(n = 1): void { this._cutB += n; }
  incTTLookup(): void { this._ttLookups += 1; }
  incTTHit(): void { this._ttHits += 1; }

  // --- Timers ---
  addGenerateMoves(durationMs: number): void {
    this._genMovesMs += Math.max(0, durationMs);
    this._genMovesCount += 1;
  }
  addValidateWall(durationMs: number): void {
    this._validateWallMs += Math.max(0, durationMs);
    this._validateWallCount += 1;
  }
  addShortestDistance(durationMs: number): void {
    this._shortestDistMs += Math.max(0, durationMs);
    this._shortestDistCount += 1;
  }

  // --- Iteration stats ---
  startIter(depth: number): void {
    if (!this._iters.has(depth)) {
      this._iters.set(depth, { depth, nodes: 0, cutAlpha: 0, cutBeta: 0, timeMs: 0 });
    }
  }
  addIterSample(depth: number, nodes: number, cutAlpha: number, cutBeta: number, timeMs: number): void {
    const it = this._iters.get(depth) ?? { depth, nodes: 0, cutAlpha: 0, cutBeta: 0, timeMs: 0 };
    it.nodes += Math.max(0, nodes);
    it.cutAlpha += Math.max(0, cutAlpha);
    it.cutBeta += Math.max(0, cutBeta);
    it.timeMs += Math.max(0, timeMs);
    this._iters.set(depth, it);
  }

  snapshot(): TelemetrySnapshot {
    const perIter = Array.from(this._iters.values()).sort((a, b) => a.depth - b.depth);
    return {
      total: {
        nodes: this._nodes,
        cutAlpha: this._cutA,
        cutBeta: this._cutB,
        ttLookups: this._ttLookups,
        ttHits: this._ttHits,
        generateMovesMs: this._genMovesMs,
        generateMovesCount: this._genMovesCount,
        validateWallMs: this._validateWallMs,
        validateWallCount: this._validateWallCount,
        shortestDistMs: this._shortestDistMs,
        shortestDistCount: this._shortestDistCount,
      },
      perIter,
    };
  }

  logSummary(totalElapsedMs: number | undefined): void {
    const s = this.snapshot();
    const T = Math.max(1e-6, totalElapsedMs ?? 0);
    const pct = (ms: number) => ((ms / T) * 100).toFixed(1) + '%';
    const hitRate = s.total.ttLookups ? (100 * s.total.ttHits / s.total.ttLookups).toFixed(1) + '%' : 'n/a';

    console.groupCollapsed('[IA][Telemetry] Resumen de búsqueda');
    if (totalElapsedMs != null) console.log('Tiempo total:', totalElapsedMs.toFixed(2), 'ms');
    console.table({
      'Nodos totales': s.total.nodes,
      'Cortes alpha': s.total.cutAlpha,
      'Cortes beta': s.total.cutBeta,
      'TT lookups': s.total.ttLookups,
      'TT hits': s.total.ttHits,
      'TT hit rate': hitRate,
      'generateMoves (ms)': s.total.generateMovesMs.toFixed(2),
      'generateMoves (%)': totalElapsedMs != null ? pct(s.total.generateMovesMs) : 'n/a',
      'validateWall (ms)': s.total.validateWallMs.toFixed(2),
      'shortestDistance (ms)': s.total.shortestDistMs.toFixed(2),
    });

    if (s.perIter.length) {
      console.groupCollapsed('Por iteración (profundidad)');
      const rows = s.perIter.map(it => ({
        depth: it.depth,
        nodes: it.nodes,
        cutAlpha: it.cutAlpha,
        cutBeta: it.cutBeta,
        timeMs: Number(it.timeMs.toFixed(2)),
      }));
      console.table(rows);
      console.groupEnd();
    }

    // Guía de diagnóstico
    console.log('Diagnóstico sugerido:');
    console.log('- Si generateMoves domina: recorta candidatos de vallas y cachea caminos.');
    console.log('- Si alpha/beta domina: activa aspiración + killer/history + LMR.');
    console.log('- Si hay pocos TT hits: adopta Zobrist/incremental hash y aumenta ttSize.');

    console.groupEnd();
  }
}

export const telemetry = new Telemetry();

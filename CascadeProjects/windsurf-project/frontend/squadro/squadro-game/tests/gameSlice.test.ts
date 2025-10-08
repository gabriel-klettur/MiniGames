import { describe, it, expect } from 'vitest';
import reducer, {
  resetGame,
  movePiece,
  setPieceWidth,
  setPieceHeight,
  setOrientation,
  toggleOrientation,
  setAIEnabled,
  setAIDifficulty,
  setAISpeed,
  setAIUseWorkers,
  aiSearchStarted,
  aiSearchProgress,
  aiSearchIter,
  aiSearchEnded,
  aiSearchReset,
} from '../src/store/gameSlice';
import { createInitialState } from '../src/game/pieces';

function getPieceById<T extends { pieces: any[] }>(s: T, id: string) {
  const p = s.pieces.find((x: any) => x.id === id);
  if (!p) throw new Error('pieza no encontrada: ' + id);
  return p;
}

describe('store/gameSlice reducers', () => {
  it('movePiece: aplica reglas y alterna turno', () => {
    const s0 = createInitialState();
    const s1 = reducer(s0, movePiece('L0'));

    const l0 = getPieceById(s1, 'L0');
    expect(l0.pos).toBeGreaterThan(0); // speedOut >= 1
    expect(s1.turn).toBe('Dark');
  });

  it('resetGame: reinicia tablero y preserva UI y AI (con ephemerals reseteados)', () => {
    let s = createInitialState();
    // Cambiamos UI y AI
    s = reducer(s, setOrientation('bga'));
    s = reducer(s, setPieceWidth(40));
    s = reducer(s, setPieceHeight(80));

    s = reducer(s, setAIEnabled(true));
    s = reducer(s, setAIDifficulty(7));
    s = reducer(s, setAISpeed('rapido'));
    s = reducer(s, setAIUseWorkers(false));
    s = reducer(s, aiSearchStarted(Date.now()));
    s = reducer(s, aiSearchProgress(1234));
    s = reducer(s, aiSearchIter({ depth: 3, score: 10 }));
    s = reducer(s, aiSearchEnded({ durationMs: 55, depthReached: 4, score: 12, nodesVisited: 2222 }));

    // Forzamos algún cambio de tablero
    s = reducer(s, movePiece('L0'));

    const s2 = reducer(s, resetGame());

    // Tablero reiniciado
    expect(s2.pieces).toHaveLength(10);
    for (const p of s2.pieces) {
      expect(['Light', 'Dark']).toContain(p.owner);
      expect(p.pos).toBe(0);
      expect(p.state).toBe('en_ida');
    }
    expect(s2.turn).toBe('Light');
    expect(s2.winner).toBeUndefined();

    // UI preservada
    expect(s2.ui.orientation).toBe('bga');
    expect(s2.ui.pieceWidth).toBe(40);
    expect(s2.ui.pieceHeight).toBe(80);

    // AI preservada + ephemerals reseteados
    expect(s2.ai).toBeDefined();
    expect(s2.ai!.enabled).toBe(true);
    expect(s2.ai!.difficulty).toBe(7);
    expect(s2.ai!.speed).toBe('rapido');
    expect(s2.ai!.useWorkers).toBe(false);
    expect(s2.ai!.busy).toBe(false);
    expect(s2.ai!.nodesVisited).toBe(0);
    expect(s2.ai!.startedAt).toBeUndefined();
    expect(s2.ai!.lastDurationMs).toBeUndefined();
    expect(s2.ai!.depthReached).toBe(0);
    expect(s2.ai!.lastScore).toBeUndefined();
  });

  it('setPieceWidth/Height: clamp y redondeo', () => {
    let s = createInitialState();
    s = reducer(s, setPieceWidth(1000));
    expect(s.ui.pieceWidth).toBe(48); // max
    s = reducer(s, setPieceWidth(7.6));
    expect(s.ui.pieceWidth).toBe(8); // min y redondeo

    s = reducer(s, setPieceHeight(1000));
    expect(s.ui.pieceHeight).toBe(120); // max
    s = reducer(s, setPieceHeight(23.3));
    expect(s.ui.pieceHeight).toBe(24); // min y redondeo
  });

  it('toggleOrientation: alterna entre classic y bga', () => {
    let s = createInitialState();
    expect(s.ui.orientation).toBe('classic');
    s = reducer(s, toggleOrientation());
    expect(s.ui.orientation).toBe('bga');
    s = reducer(s, toggleOrientation());
    expect(s.ui.orientation).toBe('classic');
  });
});

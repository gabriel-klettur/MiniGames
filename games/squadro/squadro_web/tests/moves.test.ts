import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/game/pieces';
import { generateMoves, applyMove } from '../src/ia/moves';

describe('ia/moves.generateMoves & applyMove', () => {
  it('generateMoves lista sólo piezas no retiradas del lado en turno y cambia con el turno', () => {
    const gs = createInitialState();
    // Inicio: turno Light con 5 piezas no retiradas
    const m0 = generateMoves(gs);
    expect(m0.length).toBe(5);
    expect(m0.every((id) => id.startsWith('L'))).toBe(true);

    // Retiramos L0 manualmente y verificamos que desaparece de generateMoves
    const l0 = gs.pieces.find((p) => p.id === 'L0')!;
    l0.state = 'retirada';
    const m1 = generateMoves(gs);
    expect(m1.length).toBe(4);
    expect(m1.includes('L0')).toBe(false);

    // Tras aplicar un movimiento de Light, turno pasa a Dark y generateMoves devuelve 5 de Dark
    const next = applyMove(gs, m1[0]);
    const m2 = generateMoves(next);
    expect(m2.length).toBe(5);
    expect(m2.every((id) => id.startsWith('D'))).toBe(true);
  });

  it('applyMove no muta el estado original y alterna el turno en el resultado', () => {
    const gs = createInitialState();
    const moves = generateMoves(gs);
    const beforeTurn = gs.turn;
    const next = applyMove(gs, moves[0]);
    // Original intacto en propiedades clave
    expect(gs.turn).toBe(beforeTurn);
    expect(gs.winner).toBeUndefined();
    // Resultado con turno alternado
    expect(next.turn).not.toBe(beforeTurn);
  });
});

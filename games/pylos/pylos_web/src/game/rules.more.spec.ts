import { describe, it, expect } from 'vitest';
import { initialState, placeFromReserve, selectMoveSource, cancelMoveSelection, validMoveDestinations, recoverablePositions } from './rules';
import { createEmptyBoard, setCell } from './board';
import type { GameState, Position } from './types';

const p = (level: number, row: number, col: number): Position => ({ level, row, col });

/**
 * Extras para cubrir ramas/funciones pendientes de rules.ts
 */
describe('rules.ts – funciones extra', () => {
  it('cancelMoveSelection vuelve a phase=play y borra selectedSource', () => {
    let s: GameState = initialState();
    // Construir un tablero donde seleccionar (0,0,0) deja al menos un destino válido en nivel 1
    // que NO depende de la pieza fuente: destino (1,0,1) con soportes (0,0,1),(0,0,2),(0,1,1),(0,1,2)
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L'); // source
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,0,2), 'L');
    b = setCell(b, p(0,1,1), 'L');
    b = setCell(b, p(0,1,2), 'L');
    s = { ...s, board: b };
    const sel = selectMoveSource(s, p(0,0,0));
    expect(sel.error).toBeUndefined();
    const s2 = sel.state;
    const can = validMoveDestinations(s2.board, s2.selectedSource!);
    expect(can.length).toBeGreaterThan(0);
    const back = cancelMoveSelection(s2);
    expect(back.state.phase).toBe('play');
    expect(back.state.selectedSource).toBeUndefined();
  });

  it('recoverablePositions devuelve piezas libres del jugador', () => {
    let b = createEmptyBoard();
    // Colocar 3 L en base libres y un soporte arriba para fijar algunas
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'L');
    // Aun no hay pieza arriba; todas libres
    let recs = recoverablePositions(b, 'L');
    expect(recs.length).toBe(3);
    // Al poner arriba, las 3 soportan; se vuelven no libres.
    // Puede aparecer una nueva pieza libre en el nivel superior, pero
    // nos interesa comprobar que las de base ya no son recuperables.
    b = setCell(b, p(1,0,0), 'L');
    recs = recoverablePositions(b, 'L');
    const keys = new Set(recs.map((q) => `${q.level}-${q.row}-${q.col}`));
    expect(keys.has('0-0-0')).toBe(false);
    expect(keys.has('0-0-1')).toBe(false);
    expect(keys.has('0-1-0')).toBe(false);
  });

  it('formar línea de 4 en nivel 0 activa recuperación en jugada de colocación', () => {
    let s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 4, D: 15 } as any;
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,0,2), 'L');
    s = { ...s, board: b };
    const res = placeFromReserve(s, p(0,0,3));
    expect(res.state.phase).toBe('recover');
    expect(res.state.recovery?.player).toBe('L');
  });

  it('formar línea de 3 en nivel 1 activa recuperación en jugada de colocación', () => {
    let s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 3, D: 15 } as any;
    // Preparar soporte base completo para nivel 1
    let b = createEmptyBoard();
    for (let r=0; r<4; r++) for (let c=0; c<4; c++) b = setCell(b, p(0,r,c), 'L');
    // Dos en fila en nivel 1 y completar con la tercera
    b = setCell(b, p(1,0,0), 'L');
    b = setCell(b, p(1,0,1), 'L');
    s = { ...s, board: b };
    const res = placeFromReserve(s, p(1,0,2));
    expect(res.state.phase).toBe('recover');
    expect(res.state.recovery?.player).toBe('L');
  });
});

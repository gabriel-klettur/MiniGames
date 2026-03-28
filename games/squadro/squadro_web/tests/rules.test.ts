import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/game/pieces';
import { movePiece } from '../src/game/rules';
import { DEFAULT_LANE_LENGTH } from '../src/game/board';

function getPieceById(gs: ReturnType<typeof createInitialState>, id: string) {
  const p = gs.pieces.find(x => x.id === id);
  if (!p) throw new Error('pieza no encontrada: ' + id);
  return p;
}

describe('rules.movePiece', () => {
  it('mueve una pieza Light hacia adelante según speedOut y alterna el turno', () => {
    const gs = createInitialState();
    // L0 en laneIndex 0 tiene speedOut 3 con tablero por defecto
    movePiece(gs, 'L0');
    const p = getPieceById(gs, 'L0');
    expect(p.pos).toBe(3);
    expect(p.state).toBe('en_ida');
    expect(gs.turn).toBe('Dark');
  });

  it('con dos bloques separados, salta sólo el primero y termina', () => {
    const gs = createInitialState();
    const L = DEFAULT_LANE_LENGTH; // 6
    // Usamos L2 (fila i+1 = 3). Para Dark, fijamos row = 3 => pos = 3.
    // Colocamos dos oponentes en j=4 (col=5) y j=2 (col=3) para crear dos bloques separados.
    const d4 = gs.pieces.find(p => p.id === 'D4')!; d4.pos = 3; // (row=3,col=5)
    const d2 = gs.pieces.find(p => p.id === 'D2')!; d2.pos = 3; // (row=3,col=3)
    // Ejecutar movimiento de L2 (speedOut=2). Debe saltar el primer bloque (col=5) y parar en pos=2.
    movePiece(gs, 'L2');
    const l2 = gs.pieces.find(p => p.id === 'L2')!;
    expect(l2.pos).toBe(2);
    // D4 vuelve a su borde de salida
    expect(d4.pos).toBe(0);
    // D2 permanece donde estaba (no saltado)
    expect(d2.pos).toBe(3);
  });

  it('al saltar, un rival en_vuelta vuelve a su borde opuesto (pos = lane.length)', () => {
    const gs = createInitialState();
    const L = DEFAULT_LANE_LENGTH; // 6
    // Usamos L4 (fila i+1 = 5). Para Dark, row=5 => pos = 1.
    const d4 = gs.pieces.find(p => p.id === 'D4')!; d4.pos = 1; (d4 as any).state = 'en_vuelta';
    // Ejecutar movimiento de L4 (speedOut=3) para cruzar por row=5 y saltar a D4.
    movePiece(gs, 'L4');
    // Como D4 estaba en_vuelta, debe volver al borde opuesto (pos = L)
    expect(d4.pos).toBe(L);
  });

  it('en vuelta con velocidad que excede, se clampea a 0 y se retira', () => {
    const gs = createInitialState();
    // Tomamos L1 (speedBack=3). Forzamos estado en_vuelta en pos=2 para exceder.
    const l1 = gs.pieces.find(p => p.id === 'L1')!; (l1 as any).state = 'en_vuelta'; l1.pos = 2;
    // Aseguramos turno Light
    gs.turn = 'Light';
    movePiece(gs, 'L1');
    expect(l1.pos).toBe(0);
    expect(l1.state).toBe('retirada');
  });

  it('gira en el borde lejano y pasa a en_vuelta', () => {
    const gs = createInitialState();
    const L = DEFAULT_LANE_LENGTH;
    const p = getPieceById(gs, 'L1');
    // L1 speedOut = 1, lo dejamos a 5 y hará 1 paso hasta 6 (borde) y girará
    p.pos = L - 1; // 5
    movePiece(gs, 'L1');
    expect(p.pos).toBe(L); // en el borde
    expect(p.state).toBe('en_vuelta');
    expect(gs.turn).toBe('Dark');
  });

  it('salta bloque(s) de oponentes contiguos y los devuelve a su borde', () => {
    const gs = createInitialState();
    const L = DEFAULT_LANE_LENGTH; // 6

    // Caso: mover L2 (speedOut = 2). Colocamos oponentes en las intersecciones de pos 1 y 2.
    // Intersección Light (i=2) en t: row = i+1 = 3, col = L - t -> t=1 -> col=5, t=2 -> col=4
    // Para Dark: row = L - pos, col = j+1
    // Igualamos col: j = col-1 y row: pos = L - (i+1) = 3
    const d4 = getPieceById(gs, 'D4'); d4.pos = 3; // j=4
    const d3 = getPieceById(gs, 'D3'); d3.pos = 3; // j=3

    // Ejecutar movimiento
    movePiece(gs, 'L2');

    const l2 = getPieceById(gs, 'L2');
    expect(l2.state).toBe('en_ida');
    // Debe parar en la primera casilla libre tras el último bloque: pos 3
    expect(l2.pos).toBe(3);
    // Oponentes saltados vuelven a su borde de salida (en_ida -> pos 0)
    expect(d4.pos).toBe(0);
    expect(d3.pos).toBe(0);
  });

  it('retira la pieza al volver a pos 0 y puede disparar victoria', () => {
    const gs = createInitialState();
    // Preparamos 4 piezas Light retiradas y una lista para completar la 4ª con el movimiento
    const l0 = getPieceById(gs, 'L0'); l0.state = 'retirada';
    const l1 = getPieceById(gs, 'L1'); l1.state = 'retirada';
    const l2 = getPieceById(gs, 'L2'); l2.state = 'retirada';
    const l3 = getPieceById(gs, 'L3'); // esta la retiraremos ahora
    l3.state = 'en_vuelta';
    l3.pos = 1; // un paso para llegar a 0

    // Aseguramos el turno Light para mover L3
    gs.turn = 'Light';

    movePiece(gs, 'L3');

    expect(l3.state).toBe('retirada');
    expect(l3.pos).toBe(0);
    expect(gs.winner).toBe('Light');
  });

  it('lanza error si no es el turno de la pieza', () => {
    const gs = createInitialState();
    // Turno inicial es Light; mover Dark debe fallar
    expect(() => movePiece(gs, 'D0')).toThrow();
  });
});

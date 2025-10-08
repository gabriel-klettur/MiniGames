import { describe, it, expect } from 'vitest';
import { createInitialPieces, createInitialState } from '../src/game/pieces';
import { PLAYERS, STARTING_PLAYER } from '../src/game/types';

describe('pieces.createInitialPieces', () => {
  it('crea 10 piezas, 5 por jugador, con ids y estados correctos', () => {
    const pieces = createInitialPieces();
    expect(pieces).toHaveLength(10);

    for (const owner of PLAYERS) {
      const ownerPieces = pieces.filter(p => p.owner === owner);
      expect(ownerPieces).toHaveLength(5);
      // ids: L0..L4 para Light, D0..D4 para Dark según implementación
      const prefix = owner[0];
      for (let i = 0; i < 5; i++) {
        const id = `${prefix}${i}`;
        const found = ownerPieces.find(p => p.id === id);
        expect(found).toBeTruthy();
        expect(found!.state).toBe('en_ida');
        expect(found!.pos).toBe(0);
        expect(found!.laneIndex).toBe(i);
      }
    }
  });
});

describe('pieces.createInitialState', () => {
  it('inicializa carriles, piezas, turno y UI/AI por defecto', () => {
    const s = createInitialState();
    expect(s.lanesByPlayer.Light).toHaveLength(5);
    expect(s.lanesByPlayer.Dark).toHaveLength(5);
    expect(s.pieces).toHaveLength(10);
    expect(s.turn).toBe(STARTING_PLAYER);
    expect(s.ui).toEqual({ pieceWidth: 16, pieceHeight: 44, orientation: 'classic' });
    expect(s.ai).toBeDefined();
    expect(s.ai!.enabled).toBe(false);
  });
});

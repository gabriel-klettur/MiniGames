import React from 'react';
import type { TurnSubphase, PlayerId } from '../../game/types';

export interface InfoPanelProps {
  currentPlayer: PlayerId;
  subphase: TurnSubphase;
  p1Reserve: number;
  p2Reserve: number;
  removalsAllowed: number;
  removalsTaken: number;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  currentPlayer,
  subphase,
  p1Reserve,
  p2Reserve,
  removalsAllowed,
  removalsTaken,
}) => {
  return (
    <div style={{ color: '#ddd', display: 'grid', gap: 6, textAlign: 'center' }}>
      <div>Turno: Jugador {currentPlayer} — Subfase: {subphase}</div>
      <div>Reservas: P1 {p1Reserve} | P2 {p2Reserve}</div>
      <div>Retiradas: permitidas {removalsAllowed}, tomadas {removalsTaken}</div>
    </div>
  );
};

export default React.memo(InfoPanel);

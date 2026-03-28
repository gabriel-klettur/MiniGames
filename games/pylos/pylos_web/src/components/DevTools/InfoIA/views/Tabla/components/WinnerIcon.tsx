import React from 'react';
import bolaA from '../../../../../../assets/bola_a.webp';
import bolaB from '../../../../../../assets/bola_b.webp';

type Props = {
  winner?: 'L' | 'D' | null;
  size?: number;
};

export default function WinnerIcon({ winner, size = 14 }: Props) {
  if (!winner) return <>—</>;
  const src = winner === 'L' ? bolaB : bolaA;
  const alt = winner === 'L' ? 'Claras (L)' : 'Oscuras (D)';
  return <img src={src} alt={alt} style={{ width: size, height: size }} />;
}

import type { SymbolType } from '../game/types';
import imgSol from '../assets/fichas/default/ficha_sol.png';
import imgLuna from '../assets/fichas/default/ficha_luna.png';
import imgEstrella from '../assets/fichas/default/ficha_estrella.png';
import imgFugaz from '../assets/fichas/default/ficha_fugaz.png';

/**
 * SymbolIcon — renders a token symbol image based on the symbol type.
 * Replaces the previous inline SVGs with PNG assets so designers can swap art easily.
 */
export function SymbolIcon({ type }: { type: SymbolType }) {
  switch (type) {
    case 'sol':
      return <img src={imgSol} alt="Sol" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    case 'luna':
      return <img src={imgLuna} alt="Luna" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    case 'estrella':
      return <img src={imgEstrella} alt="Estrella" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    case 'fugaz':
      return <img src={imgFugaz} alt="Fugaz" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    default:
      return null;
  }
}

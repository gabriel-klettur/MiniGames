import React from 'react';
import styles from '../AssetsPopover.module.css';

export interface TokenSetImages {
  sol: string;
  luna: string;
  estrella: string;
  fugaz: string;
}

export interface TokenSetData {
  name: string;
  images: TokenSetImages;
}

export interface TokenSetCardProps {
  set: TokenSetData;
  selected: boolean;
  onClick: () => void;
}

export const TokenSetCard: React.FC<TokenSetCardProps> = ({ set, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-selected={selected}
      title={set.name}
      className={[styles.tokenSetCard, selected ? styles.tokenSetCardSelected : ''].join(' ').trim()}
    >
      <img src={set.images.sol} alt={`Sol - ${set.name}`} className={styles.tokenImg} />
      <img src={set.images.luna} alt={`Luna - ${set.name}`} className={styles.tokenImg} />
      <img src={set.images.estrella} alt={`Estrella - ${set.name}`} className={styles.tokenImg} />
      <img src={set.images.fugaz} alt={`Fugaz - ${set.name}`} className={styles.tokenImg} />
    </button>
  );
};

export default TokenSetCard;

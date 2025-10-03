import React from 'react';
import { useTokenSet } from '../../../../contexts/TokenSetContext';
import styles from '../AssetsPopover.module.css';
import TokenSetCard from '../components/TokenSetCard';

export const TokenSetSection: React.FC = () => {
  const { sets, selectedSet, selectSet } = useTokenSet();

  return (
    <div className="vsai-section" aria-label="Seleccionar set de fichas">
      <div className="vsai-title">Fichas</div>
      <div role="listbox" aria-label="Catálogo de sets de fichas" className={styles.tokenSetGrid}>
        {sets.map((set) => (
          <TokenSetCard
            key={set.name}
            set={set}
            selected={set.name === selectedSet}
            onClick={() => selectSet(set.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default TokenSetSection;

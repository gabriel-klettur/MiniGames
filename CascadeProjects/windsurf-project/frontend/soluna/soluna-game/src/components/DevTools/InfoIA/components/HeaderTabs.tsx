import type { FC } from 'react';

interface HeaderTabsProps {
  activeTab: 'repeats' | 'sim' | 'charts' | 'books';
  onChangeTab: (t: 'repeats' | 'sim' | 'charts' | 'books') => void;
}

const HeaderTabs: FC<HeaderTabsProps> = ({ activeTab, onChangeTab }) => (
  <div className="infoia__tabs segmented" role="tablist" aria-label="Secciones de InfoIA">
    <button className={activeTab === 'repeats' ? 'active' : ''} role="tab" aria-selected={activeTab === 'repeats'} onClick={() => onChangeTab('repeats')}>Jugadas Repetidas</button>
    <button className={activeTab === 'sim' ? 'active' : ''} role="tab" aria-selected={activeTab === 'sim'} onClick={() => onChangeTab('sim')}>Simulaciones y Métricas</button>
    <button className={activeTab === 'charts' ? 'active' : ''} role="tab" aria-selected={activeTab === 'charts'} onClick={() => onChangeTab('charts')}>Gráficos</button>
    <button className={activeTab === 'books' ? 'active' : ''} role="tab" aria-selected={activeTab === 'books'} onClick={() => onChangeTab('books')}>Books</button>
  </div>
);

export default HeaderTabs;

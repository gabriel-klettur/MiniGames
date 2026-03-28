import React from 'react';

const DatasetTabs: React.FC<{ activeId?: string; onSelect?: (id: string) => void }>
= ({ activeId = 'local', onSelect = () => {} }) => (
  <div className="dataset-tabs" style={{ display: 'flex', gap: 8 }}>
    <button className={`btn ${activeId === 'local' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onSelect('local')}>Local</button>
  </div>
);

export default DatasetTabs;

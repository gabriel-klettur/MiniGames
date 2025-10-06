
export interface SearchSettingsProps {
  aiEnableTT: boolean; onToggleAiEnableTT: () => void;
  aiFailSoft: boolean; onToggleAiFailSoft: () => void;
  aiPreferHashMove: boolean; onToggleAiPreferHashMove: () => void;
  aiEnablePVS: boolean; onToggleAiEnablePVS: () => void;
  aiEnableKillers: boolean; onToggleAiEnableKillers: () => void;
  aiEnableHistory: boolean; onToggleAiEnableHistory: () => void;
}

// Using JSX runtime; no React import needed
export default function SearchSettings(props: SearchSettingsProps) {
  const {
    aiEnableTT, onToggleAiEnableTT,
    aiFailSoft, onToggleAiFailSoft,
    aiPreferHashMove, onToggleAiPreferHashMove,
    aiEnablePVS, onToggleAiEnablePVS,
    aiEnableKillers, onToggleAiEnableKillers,
    aiEnableHistory, onToggleAiEnableHistory,
  } = props;
  return (
    <div className="panel small" style={{ minWidth: 280 }}>
      <h4 style={{ marginTop: 0 }}>Búsqueda base</h4>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiEnableTT} onChange={onToggleAiEnableTT} /> TT
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiFailSoft} onChange={onToggleAiFailSoft} /> Fail-soft
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiPreferHashMove} onChange={onToggleAiPreferHashMove} /> Hash move
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiEnablePVS} onChange={onToggleAiEnablePVS} /> PVS
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiEnableKillers} onChange={onToggleAiEnableKillers} /> Killers
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiEnableHistory} onChange={onToggleAiEnableHistory} /> History
        </label>
      </div>
    </div>
  );
}

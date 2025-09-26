import type { AIAdvancedConfig } from '../../types';

export interface QuiescenceSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function QuiescenceSettings({ iaConfig, onChangeIaConfig }: QuiescenceSettingsProps) {
  return (
    <>
      <label>Quiescence</label>
      <div>
        <input id="ia-q" type="checkbox" checked={iaConfig.quiescence} onChange={(e) => onChangeIaConfig({ quiescence: e.target.checked })} />
        <label htmlFor="ia-q" style={{ marginLeft: 6 }}>Activado</label>
      </div>

      <label>Q depth máx</label>
      <div>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={iaConfig.qDepthMax}
          onChange={(e) => onChangeIaConfig({ qDepthMax: Number(e.target.value) })}
        />
        <span style={{ marginLeft: 8 }}>{iaConfig.qDepthMax}</span>
      </div>

      <label>Q hijos por nodo</label>
      <div>
        <input
          type="range"
          min={1}
          max={128}
          step={1}
          value={iaConfig.qNodeCap}
          onChange={(e) => onChangeIaConfig({ qNodeCap: Number(e.target.value) })}
        />
        <span style={{ marginLeft: 8 }}>{iaConfig.qNodeCap}</span>
      </div>

      <label>Futility margin</label>
      <div>
        <input
          type="range"
          min={0}
          max={1000}
          step={10}
          value={iaConfig.futilityMargin}
          onChange={(e) => onChangeIaConfig({ futilityMargin: Number(e.target.value) })}
        />
        <span style={{ marginLeft: 8 }}>{iaConfig.futilityMargin}</span>
      </div>
    </>
  );
}


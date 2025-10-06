
export interface QuiescenceSettingsProps {
  aiEnableQuiescence: boolean;
  onToggleAiEnableQuiescence: () => void;
  aiQuiescenceDepth: number;
  onChangeAiQuiescenceDepth: (n: number) => void;
  aiQuiescenceHighTowerThreshold?: number;
  onChangeAiQuiescenceHighTowerThreshold?: (n: number) => void;
}

export default function QuiescenceSettings(props: QuiescenceSettingsProps) {
  const {
    aiEnableQuiescence, onToggleAiEnableQuiescence,
    aiQuiescenceDepth, onChangeAiQuiescenceDepth,
    aiQuiescenceHighTowerThreshold, onChangeAiQuiescenceHighTowerThreshold,
  } = props;
  return (
    <div className="panel small" style={{ minWidth: 280 }}>
      <h4 style={{ marginTop: 0 }}>Quiescence</h4>
      <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={
          'Quiescence — Extiende la búsqueda en hojas sólo en posiciones tácticas (p.ej. cierre de ronda).\n' +
          'Beneficio: estabiliza la evaluación y reduce el efecto horizonte.'
        }>
          <input type="checkbox" checked={aiEnableQuiescence} onChange={onToggleAiEnableQuiescence} /> Activar
        </label>
        <label title="Profundidad adicional en quiescence (recomendado 2–3, 4 defensivo)">
          profundidad
          <input type="number" min={1} step={1} value={aiQuiescenceDepth} onChange={(e) => onChangeAiQuiescenceDepth(Math.max(1, Number(e.target.value) || 1))} style={{ width: 64, marginLeft: 6 }} />
        </label>
        {typeof aiQuiescenceHighTowerThreshold === 'number' && (
          <label title="Umbral de torre alta para considerar una fusión como táctica">
            torre≥
            <input
              type="number"
              min={2}
              step={1}
              value={aiQuiescenceHighTowerThreshold}
              onChange={(e) => onChangeAiQuiescenceHighTowerThreshold && onChangeAiQuiescenceHighTowerThreshold(Math.max(2, Number(e.target.value) || 2))}
              style={{ width: 64, marginLeft: 6 }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

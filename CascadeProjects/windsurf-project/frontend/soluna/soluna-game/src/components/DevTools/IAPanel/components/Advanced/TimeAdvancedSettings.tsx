
export interface TimeAdvancedSettingsProps {
  timeMode: 'auto' | 'manual';
  aiTimeMinMs?: number; onChangeAiTimeMinMs?: (n: number) => void;
  aiTimeMaxMs?: number; onChangeAiTimeMaxMs?: (n: number) => void;
  aiTimeBaseMs?: number; onChangeAiTimeBaseMs?: (n: number) => void;
  aiTimePerMoveMs?: number; onChangeAiTimePerMoveMs?: (n: number) => void;
  aiTimeExponent?: number; onChangeAiTimeExponent?: (n: number) => void;
}

export default function TimeAdvancedSettings(props: TimeAdvancedSettingsProps) {
  const {
    timeMode,
    aiTimeMinMs, onChangeAiTimeMinMs,
    aiTimeMaxMs, onChangeAiTimeMaxMs,
    aiTimeBaseMs, onChangeAiTimeBaseMs,
    aiTimePerMoveMs, onChangeAiTimePerMoveMs,
    aiTimeExponent, onChangeAiTimeExponent,
  } = props;

  if (timeMode !== 'auto') {
    return (
      <div className="panel small" style={{ minWidth: 300 }}>
        <h4 style={{ marginTop: 0 }}>Tiempo (auto)</h4>
        <p className="kpi kpi--muted">El modo actual es Manual. Cambia a Auto para ver estos parámetros.</p>
      </div>
    );
  }

  return (
    <div className="panel small" style={{ minWidth: 300 }}>
      <h4 style={{ marginTop: 0 }}>Tiempo (auto)</h4>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <label title="Tiempo mínimo por jugada (ms)">
          min
          <input type="number" value={aiTimeMinMs ?? 0} onChange={(e) => onChangeAiTimeMinMs && onChangeAiTimeMinMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: '100%' }} />
        </label>
        <label title="Tiempo máximo por jugada (ms)">
          max
          <input type="number" value={aiTimeMaxMs ?? 0} onChange={(e) => onChangeAiTimeMaxMs && onChangeAiTimeMaxMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: '100%' }} />
        </label>
        <label title="Tiempo base independiente del branching (ms)">
          base
          <input type="number" value={aiTimeBaseMs ?? 0} onChange={(e) => onChangeAiTimeBaseMs && onChangeAiTimeBaseMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: '100%' }} />
        </label>
        <label title="Multiplicador por movimiento raíz (ms)">
          perMove
          <input type="number" value={aiTimePerMoveMs ?? 0} onChange={(e) => onChangeAiTimePerMoveMs && onChangeAiTimePerMoveMs(Number(e.target.value) || 0)} style={{ width: '100%' }} />
        </label>
        <label title="Exponente aplicado al factor de ramificación">
          exp
          <input type="number" step={0.1} value={aiTimeExponent ?? 1} onChange={(e) => onChangeAiTimeExponent && onChangeAiTimeExponent(Number(e.target.value) || 1)} style={{ width: '100%' }} />
        </label>
      </div>
    </div>
  );
}

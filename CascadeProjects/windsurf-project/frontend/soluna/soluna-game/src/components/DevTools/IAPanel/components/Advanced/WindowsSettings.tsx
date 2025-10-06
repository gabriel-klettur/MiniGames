// Using JSX runtime; no React import needed

export interface WindowsSettingsProps {
  aiEnableAspiration: boolean;
  onToggleAiEnableAspiration: () => void;
  aiAspirationDelta: number;
  onChangeAiAspirationDelta: (n: number) => void;
}

export default function WindowsSettings(props: WindowsSettingsProps) {
  const { aiEnableAspiration, onToggleAiEnableAspiration, aiAspirationDelta, onChangeAiAspirationDelta } = props;
  return (
    <div className="panel small" style={{ minWidth: 280 }}>
      <h4 style={{ marginTop: 0 }}>Ventanas</h4>
      <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={
          'Aspiration Windows — Busca alrededor del score previo y reintenta con ventana completa si falla.\n' +
          'Beneficio: acelera la poda con primeras iteraciones. Riesgo: re-búsquedas si el score varía mucho.'
        }>
          <input type="checkbox" checked={aiEnableAspiration} onChange={onToggleAiEnableAspiration} /> Aspiration
        </label>
        <label title="Margen Δ alrededor del score previo (ej.: 20 → [S-20, S+20])">
          Δ
          <input type="number" min={1} step={1} value={aiAspirationDelta} onChange={(e) => onChangeAiAspirationDelta(Math.max(1, Number(e.target.value) || 1))} style={{ width: 64, marginLeft: 6 }} />
        </label>
      </div>
    </div>
  );
}

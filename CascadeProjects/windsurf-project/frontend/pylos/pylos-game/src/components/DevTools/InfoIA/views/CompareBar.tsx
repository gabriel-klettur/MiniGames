
export type CompareChip = { id: string; name: string; color: string };

type CompareBarProps = {
  compareSets: CompareChip[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  addLabel?: string;
  clearLabel?: string;
};

export default function CompareBar({ compareSets, onAdd, onRemove, onClear, addLabel = 'Agregar CSV o JSON para comparar', clearLabel = 'Limpiar' }: CompareBarProps) {
  return (
    <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
      <button className="btn-ghost" onClick={onAdd} title={addLabel}>{addLabel}</button>
      {compareSets.map((s) => (
        <span key={s.id} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0b1220', border: '1px solid #1f2937', padding: '4px 8px', borderRadius: 999 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
          <span className="mono" title={s.name} style={{ maxWidth: 260 }}>
            {s.name}
          </span>
          <button className="chip-btn btn-danger" onClick={() => onRemove(s.id)} title="Quitar">✕</button>
        </span>
      ))}
      {compareSets.length > 0 && (
        <button className="btn-ghost" onClick={onClear} title="Quitar todas las comparaciones">{clearLabel}</button>
      )}
    </div>
  );
}

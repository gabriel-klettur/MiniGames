export type CompareSet = { id: string; name: string; color: string };

export function DatasetTabs(props: {
  activeId: string;
  sets: CompareSet[];
  onSelect: (id: string) => void;
}) {
  const { activeId, sets, onSelect } = props;
  return (
    <div className="segmented infoia__dataset-tabs" role="tablist" aria-label="Seleccionar dataset para la tabla">
      <button
        className={activeId === 'local' ? 'active' : ''}
        role="tab"
        aria-selected={activeId === 'local'}
        onClick={() => onSelect('local')}
        title="Mostrar datos locales"
      >Local</button>
      {sets.map((s) => (
        <button
          key={s.id}
          className={activeId === s.id ? 'active' : ''}
          role="tab"
          aria-selected={activeId === s.id}
          onClick={() => onSelect(s.id)}
          title={s.name}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
          <span className="ellipsis" style={{ maxWidth: 160 }}>{s.name}</span>
        </button>
      ))}
    </div>
  );
}

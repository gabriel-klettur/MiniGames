export function ActionsBar(props: {
  running: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefault: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportBook: () => void;
  onPublishBooks?: (minSupportPct: number) => void;
  onClearBooks?: () => void;
  onAddCompare: () => void;
  onClearAll: () => void;
  canClearLocal: boolean;
  activeTableSourceId: string;
}) {
  const {
    running, loading, onStart, onStop, onDefault,
    onExportJSON, onExportCSV, onExportBook,
    onPublishBooks, onClearBooks,
    onAddCompare, onClearAll, canClearLocal, activeTableSourceId,
  } = props;

  return (
    <div className="infoia__actions">
      {!running ? (
        <button className="primary" onClick={onStart} disabled={loading} title="Iniciar simulaciones">Iniciar</button>
      ) : (
        <button className="btn-stop" onClick={onStop} title="Detener simulación en curso">Detener</button>
      )}
      <button
        className="btn-accent"
        onClick={onDefault}
        title="Restablecer todos los parámetros a valores por defecto"
        disabled={running}
      >Default</button>
      <button className="btn-ghost" onClick={onExportJSON}>Exportar JSON</button>
      <button className="btn-ghost" onClick={onExportCSV}>Exportar CSV</button>
      <button className="btn-ghost" onClick={onExportBook} title="Generar libro de aperturas (book.json) a partir de las simulaciones">Exportar Book</button>
      {import.meta.env.DEV && (
        <>
          <label className="label" htmlFor="infoia-publish-support" title="Soporte mínimo para incluir jugadas en el book (0–100%)">Soporte (%)</label>
          <input id="infoia-publish-support" className="field-num" type="number" min={0} max={100} defaultValue={55} style={{ width: 80 }} />
          <button
            className="btn-accent"
            onClick={() => {
              const el = document.getElementById('infoia-publish-support') as HTMLInputElement | null;
              const val = el ? Number(el.value) : 55;
              const pct = Number.isFinite(val) ? Math.max(0, Math.min(100, Math.floor(val))) : 55;
              onPublishBooks?.(pct);
            }}
            title="Publicar todos los books en public/books (dev)"
          >Publicar Books</button>
          <button className="btn-warning" onClick={onClearBooks} title="Vaciar la carpeta public/books (dev)">Vaciar Books</button>
        </>
      )}
      <button className="btn-ghost" onClick={onAddCompare} title="Agregar CSV o JSON">Agregar CSV o JSON</button>
      <button className="btn-danger" onClick={onClearAll} disabled={!canClearLocal} title={activeTableSourceId !== 'local' ? 'Solo disponible para datos locales' : 'Borrar todos los registros locales'}>Borrar todo</button>
    </div>
  );
}

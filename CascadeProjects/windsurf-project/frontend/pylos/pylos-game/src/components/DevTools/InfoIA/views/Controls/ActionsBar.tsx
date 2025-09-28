export function ActionsBar(props: {
  running: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefault: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onAddCompare: () => void;
  onClearAll: () => void;
  canClearLocal: boolean;
  activeTableSourceId: string;
}) {
  const {
    running, loading, onStart, onStop, onDefault,
    onExportJSON, onExportCSV,
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
      <button className="btn-ghost" onClick={onAddCompare} title="Agregar CSV o JSON">Agregar CSV o JSON</button>
      <button className="btn-danger" onClick={onClearAll} disabled={!canClearLocal} title={activeTableSourceId !== 'local' ? 'Solo disponible para datos locales' : 'Borrar todos los registros locales'}>Borrar todo</button>
    </div>
  );
}


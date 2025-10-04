import type { ChangeEvent, FC } from 'react';

interface Props {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefaults: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportCSVDetails: () => void;
  onImportFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
}

const HeaderActions: FC<Props> = ({ running, onStart, onStop, onDefaults, onExportJSON, onExportCSV, onExportCSVDetails, onImportFiles, onClearAll }) => (
  <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    <button className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`} onClick={running ? onStop : onStart}>{running ? 'Detener' : 'Iniciar'}</button>
    <button className="btn btn-secondary" onClick={onDefaults}>Default</button>
    <button className="btn btn-secondary" onClick={onExportJSON}>Exportar JSON</button>
    <button className="btn btn-secondary" onClick={onExportCSV}>Exportar CSV</button>
    <button className="btn btn-secondary" onClick={onExportCSVDetails}>Exportar CSV (detalles)</button>
    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
      Agregar CSV y JSON
      <input type="file" accept=".json,application/json,.csv,text/csv" multiple onChange={onImportFiles} style={{ display: 'none' }} />
    </label>
    <button className="btn btn-danger" onClick={onClearAll}>Borrar todo</button>
    <div style={{ marginLeft: 'auto' }}>
      <span className="kpi">Configuraciones Simulación y Métricas</span>
    </div>
  </div>
);

export default HeaderActions;

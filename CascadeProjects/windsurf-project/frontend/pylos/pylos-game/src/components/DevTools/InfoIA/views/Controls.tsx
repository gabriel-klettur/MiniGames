import type { CSSProperties } from 'react';

export type ControlsProps = {
  depth: number;
  onDepthChange: (d: number) => void;

  timeMode: 'auto' | 'manual';
  onTimeModeChange: (m: 'auto' | 'manual') => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;

  pliesLimit: number;
  onPliesLimitChange: (v: number) => void;
  gamesCount: number;
  onGamesCountChange: (v: number) => void;

  mirrorBoard: boolean;
  onMirrorChange: (v: boolean) => void;

  running: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;

  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportBook: () => void;
  onAddCompare: () => void;
  onClearAll: () => void;

  activeTableSourceId: string;
  compareSets: Array<{ id: string; name: string; color: string }>;
  onSelectTableSource: (id: string) => void;
  canClearLocal: boolean;
};

export default function Controls(props: ControlsProps) {
  const rowStyle: CSSProperties = { gap: 12, alignItems: 'center', flexWrap: 'wrap' };
  const actionsStyle: CSSProperties = { display: 'inline-flex', gap: 8, marginLeft: 'auto' };

  return (
    <div className="row infoia__controls" style={rowStyle}>
      <label className="label" htmlFor="infoia-depth">Dificultad</label>
      <select id="infoia-depth" value={props.depth} onChange={(e) => props.onDepthChange(Number(e.target.value))}>
        {[1,2,3,4,5,6,7,8,9,10].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Selector de tabla: Local o archivos agregados */}
      <label className="label">Tabla</label>
      <div className="segmented" role="tablist" aria-label="Seleccionar dataset para la tabla">
        <button
          className={props.activeTableSourceId === 'local' ? 'active' : ''}
          role="tab"
          aria-selected={props.activeTableSourceId === 'local'}
          onClick={() => props.onSelectTableSource('local')}
          title="Mostrar datos locales"
        >Local</button>
        {props.compareSets.map((s) => (
          <button
            key={s.id}
            className={props.activeTableSourceId === s.id ? 'active' : ''}
            role="tab"
            aria-selected={props.activeTableSourceId === s.id}
            onClick={() => props.onSelectTableSource(s.id)}
            title={s.name}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
            <span className="ellipsis" style={{ maxWidth: 160 }}>{s.name}</span>
          </button>
        ))}
      </div>

      <label className="label">Tiempo</label>
      <div className="segmented" role="group" aria-label="Modo de tiempo de simulación">
        <button className={props.timeMode === 'auto' ? 'active' : ''} onClick={() => props.onTimeModeChange('auto')} aria-pressed={props.timeMode === 'auto'}>Auto</button>
        <button className={props.timeMode === 'manual' ? 'active' : ''} onClick={() => props.onTimeModeChange('manual')} aria-pressed={props.timeMode === 'manual'}>Manual</button>
      </div>
      {props.timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label="Selector de tiempo manual">
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={props.timeSeconds}
            onChange={(e) => props.onTimeSecondsChange(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={props.timeSeconds}
          />
          <span className="range-value badge">{props.timeSeconds.toFixed(1)} s</span>
        </div>
      )}

      <label className="label" htmlFor="infoia-plies">Límite jugadas</label>
      <input id="infoia-plies" className="field-num" type="number" min={1} max={400} value={props.pliesLimit} onChange={(e) => props.onPliesLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-count">Partidas</label>
      <input id="infoia-count" className="field-num" type="number" min={1} max={1000} value={props.gamesCount} onChange={(e) => props.onGamesCountChange(Number(e.target.value))} style={{ width: 90 }} />

      {/* Visualizar simulación en el tablero (sin animaciones) */}
      <label className="label" htmlFor="infoia-mirror" title="Mostrar la partida simulada en el tablero (sin animaciones)">Visualizar</label>
      <input
        id="infoia-mirror"
        type="checkbox"
        checked={props.mirrorBoard}
        onChange={(e) => props.onMirrorChange(e.target.checked)}
        aria-checked={props.mirrorBoard}
        title="Mostrar la partida simulada en el tablero (sin animaciones)"
      />

      <div className="infoia__actions" style={actionsStyle}>
        {!props.running ? (
          <button className="primary" onClick={props.onStart} disabled={props.loading} title="Iniciar simulaciones">Iniciar</button>
        ) : (
          <button className="btn-stop" onClick={props.onStop} title="Detener simulación en curso">Detener</button>
        )}
        <button className="btn-ghost" onClick={props.onExportJSON}>Exportar JSON</button>
        <button className="btn-ghost" onClick={props.onExportCSV}>Exportar CSV</button>
        <button className="btn-ghost" onClick={props.onExportBook} title="Generar libro de aperturas (book.json) a partir de las simulaciones">Exportar Book</button>
        <button className="btn-ghost" onClick={props.onAddCompare} title="Agregar CSV o JSON">Agregar CSV o JSON</button>
        <button className="btn-danger" onClick={props.onClearAll} disabled={!props.canClearLocal} title={props.activeTableSourceId !== 'local' ? 'Solo disponible para datos locales' : 'Borrar todos los registros locales'}>Borrar todo</button>
      </div>
    </div>
  );
}

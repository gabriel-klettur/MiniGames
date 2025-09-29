export function DifficultyTime(props: {
  depth: number;
  onDepthChange: (d: number) => void;
  timeMode: 'auto' | 'manual';
  onTimeModeChange: (m: 'auto' | 'manual') => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;
}) {
  const { depth, onDepthChange, timeMode, onTimeModeChange, timeSeconds, onTimeSecondsChange } = props;
  return (
    <>
      <label
        className="label"
        htmlFor="infoia-depth"
        title={
          'Cuántos plies (medias jugadas) mira la IA en el árbol de búsqueda.\n' +
          'Más profundidad = decisiones más precisas, pero más lentas.\n' +
          'Ejemplo: profundidad 7 suele ver combinaciones simples de “doble recuperación”.'
        }
      >
        Dificultad
      </label>
      <select
        id="infoia-depth"
        value={depth}
        onChange={(e) => onDepthChange(Number(e.target.value))}
        title={
          `Profundidad actual: ${depth}. Sube si quieres una IA más fuerte; baja para pruebas rápidas.`
        }
      >
        {[1,2,3,4,5,6,7,8,9,10].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <label className="label" title={'Cómo asignar tiempo por movimiento. Auto usa heurística interna; Manual fija un presupuesto por jugada.'}>Tiempo</label>
      <div className="segmented" role="group" aria-label="Modo de tiempo de simulación">
        <button
          className={timeMode === 'auto' ? 'active' : ''}
          onClick={() => onTimeModeChange('auto')}
          aria-pressed={timeMode === 'auto'}
          title={'Auto: el motor decide cuánto tiempo gastar según la situación. Útil para lotes largos.'}
        >
          Auto
        </button>
        <button
          className={timeMode === 'manual' ? 'active' : ''}
          onClick={() => onTimeModeChange('manual')}
          aria-pressed={timeMode === 'manual'}
          title={'Manual: define un presupuesto fijo por jugada (0–30 s). Ejemplo: 5 s por movimiento.'}
        >
          Manual
        </button>
      </div>
      {timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label="Selector de tiempo manual">
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={timeSeconds}
            onChange={(e) => onTimeSecondsChange(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={timeSeconds}
            title={`Presupuesto por jugada: ${timeSeconds.toFixed(1)} s. Ejemplo: 3.0 = 3 segundos por movimiento.`}
          />
          <span className="range-value badge">{timeSeconds.toFixed(1)} s</span>
        </div>
      )}
    </>
  );
}

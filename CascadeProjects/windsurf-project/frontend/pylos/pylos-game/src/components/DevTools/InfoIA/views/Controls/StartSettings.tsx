export function StartSettings(props: {
  startRandom: boolean;
  onStartRandomChange: (v: boolean) => void;
  seedInput: string;
  onSeedInputChange: (v: string) => void;
  // New: per-player opening book toggle
  bookEnabled?: boolean;
  onBookEnabledChange?: (v: boolean) => void;
  // New: per-player early-random turns count
  earlyRandom?: number;
  onEarlyRandomChange?: (n: number) => void;
}) {
  const { startRandom, onStartRandomChange, seedInput, onSeedInputChange, bookEnabled, onBookEnabledChange, earlyRandom, onEarlyRandomChange } = props;
  return (
    <>
      <label
        className="label"
        htmlFor="infoia-start-rand"
        title={
          'Controla el primer movimiento cuando el tablero está vacío.\n' +
          'Si está activado, se elige un inicio al azar (útil para diversificar partidas).\n' +
          'Ejemplo: con semilla 1234 siempre obtendrás el mismo inicio aleatorio.'
        }
      >
        Inicio
      </label>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <input
          id="infoia-start-rand"
          type="checkbox"
          checked={startRandom}
          onChange={(e) => onStartRandomChange(e.target.checked)}
          aria-checked={startRandom}
          title={
            'Activa un inicio aleatorio sólo cuando el tablero está vacío.\n' +
            'Útil para evitar sesgos de apertura durante pruebas largas.'
          }
        />
        <label htmlFor="infoia-start-rand">Movimiento inicial aleatorio</label>
        {/* Per-player early-random turns */}
        <label className="label" htmlFor="infoia-start-early" style={{ marginLeft: 8 }} title={'Número de primeras jugadas de este jugador que serán 100% aleatorias.'}>N (aleatorio)</label>
        <input
          id="infoia-start-early"
          className="field-num"
          type="number"
          min={0}
          max={10}
          step={1}
          value={Math.max(0, Math.min(10, Number.isFinite(earlyRandom as number) ? Number(earlyRandom) : 2))}
          onChange={(e) => onEarlyRandomChange?.(Math.max(0, Math.min(10, Math.floor(Number(e.target.value))))) }
          style={{ width: 80 }}
          title={'Ej.: 2 ⇒ las dos primeras jugadas de este jugador serán aleatorias.'}
        />
        <label
          className="label"
          htmlFor="infoia-start-seed"
          style={{ marginLeft: 8 }}
          title={
            'Semilla numérica para fijar el resultado del movimiento inicial aleatorio.\n' +
            'Deja vacío para que sea distinto cada vez.\n' +
            'Ejemplo: escribe 42 y obtendrás siempre el mismo primer movimiento cuando "Inicio aleatorio" esté activo.'
          }
        >
          Semilla
        </label>
        <input
          id="infoia-start-seed"
          className="field-num"
          type="number"
          placeholder="p. ej., 1234"
          value={seedInput}
          onChange={(e) => onSeedInputChange(e.target.value)}
          style={{ width: 120 }}
          disabled={!startRandom}
          title={
            'Valor opcional para reproducibilidad del inicio aleatorio.\n' +
            'Funciona sólo si "Movimiento inicial aleatorio" está activado.'
          }
        />
        {typeof bookEnabled === 'boolean' && (
          <>
            <label
              className="label"
              htmlFor="infoia-book"
              style={{ marginLeft: 8 }}
              title={
                'Libro de aperturas por jugador.\n' +
                'Cuando está activo, la IA usará secuencias de inicio preparadas (siempre que haya coincidencia).\n' +
                'Ejemplo: útil para que el jugador fuerte (p. ej., profundidad 7) empiece con una línea sólida.'
              }
            >
              Libro
            </label>
            <input
              id="infoia-book"
              type="checkbox"
              checked={!!bookEnabled}
              onChange={(e) => onBookEnabledChange?.(e.target.checked)}
              aria-checked={!!bookEnabled}
              title={
                'Activa/desactiva el uso de libro de aperturas para este jugador.\n' +
                'No afecta al otro jugador.'
              }
            />
          </>
        )}
      </div>
    </>
  );
}

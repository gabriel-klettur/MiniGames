export function StartSettings(props: {
  startRandom: boolean;
  onStartRandomChange: (v: boolean) => void;
  seedInput: string;
  onSeedInputChange: (v: string) => void;
  // New: per-player early-random turns count
  earlyRandom?: number;
  onEarlyRandomChange?: (n: number) => void;
}) {
  const { startRandom, onStartRandomChange, seedInput, onSeedInputChange, earlyRandom, onEarlyRandomChange } = props;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Fila 1: sólo el inicio aleatorio */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            id="infoia-start-rand"
            type="checkbox"
            checked={startRandom}
            onChange={(e) => onStartRandomChange(e.target.checked)}
            aria-checked={startRandom}
            title={'Activa un inicio aleatorio sólo cuando el tablero está vacío.\nÚtil para evitar sesgos de apertura durante pruebas largas.'}
          />
          <label htmlFor="infoia-start-rand">Movimiento inicial aleatorio</label>
        </div>

        {/* Fila 2: N (aleatorio), Semilla y Libro */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 72px 12px max-content 120px',
            columnGap: 8,
            rowGap: 6,
            alignItems: 'center'
          }}
        >
          {/* N (aleatorio) */}
          <label className="label" htmlFor="infoia-start-early" style={{ justifySelf: 'end' }} title={'Número de primeras jugadas de este jugador que serán 100% aleatorias.'}>N (aleatorio)</label>
          <input
            id="infoia-start-early"
            className="field-num"
            type="number"
            min={0}
            max={10}
            step={1}
            value={Math.max(0, Math.min(10, Number.isFinite(earlyRandom as number) ? Number(earlyRandom) : 2))}
            onChange={(e) => onEarlyRandomChange?.(Math.max(0, Math.min(10, Math.floor(Number(e.target.value))))) }
            style={{ width: 72 }}
            title={'Ej.: 2 ⇒ las dos primeras jugadas de este jugador serán aleatorias.'}
          />

          {/* Semilla */}
          <label className="label" htmlFor="infoia-start-seed" style={{ justifySelf: 'end' }} title={'Semilla numérica para fijar el resultado del movimiento inicial aleatorio.\nDeja vacío para que sea distinto cada vez.\nEjemplo: escribe 42 y obtendrás siempre el mismo primer movimiento cuando "Movimiento inicial aleatorio" esté activo.'}>Semilla</label>
          <input
            id="infoia-start-seed"
            className="field-num"
            type="number"
            placeholder="p. ej., 1234"
            value={seedInput}
            onChange={(e) => onSeedInputChange(e.target.value)}
            style={{ width: 120 }}
            disabled={!startRandom}
            title={'Valor opcional para reproducibilidad del inicio aleatorio.\nFunciona sólo si "Movimiento inicial aleatorio" está activado.'}
          />
        </div>
      </div>
    </>
  );
}

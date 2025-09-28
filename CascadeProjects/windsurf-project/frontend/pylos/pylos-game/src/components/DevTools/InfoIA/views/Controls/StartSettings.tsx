export function StartSettings(props: {
  startRandom: boolean;
  onStartRandomChange: (v: boolean) => void;
  seedInput: string;
  onSeedInputChange: (v: string) => void;
}) {
  const { startRandom, onStartRandomChange, seedInput, onSeedInputChange } = props;
  return (
    <>
      <label className="label" htmlFor="infoia-start-rand" title="Realizar el primer movimiento al azar si el tablero está vacío">Inicio</label>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <input
          id="infoia-start-rand"
          type="checkbox"
          checked={startRandom}
          onChange={(e) => onStartRandomChange(e.target.checked)}
          aria-checked={startRandom}
          title="Movimiento inicial aleatorio"
        />
        <label htmlFor="infoia-start-rand">Movimiento inicial aleatorio</label>
        <label className="label" htmlFor="infoia-start-seed" style={{ marginLeft: 8 }}>Semilla</label>
        <input
          id="infoia-start-seed"
          className="field-num"
          type="number"
          placeholder="p. ej., 1234"
          value={seedInput}
          onChange={(e) => onSeedInputChange(e.target.value)}
          style={{ width: 120 }}
          disabled={!startRandom}
          title="Semilla para reproducibilidad (opcional)"
        />
      </div>
    </>
  );
}

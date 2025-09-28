export function SimulationLimits(props: {
  pliesLimit: number;
  onPliesLimitChange: (v: number) => void;
  gamesCount: number;
  onGamesCountChange: (v: number) => void;
}) {
  const { pliesLimit, onPliesLimitChange, gamesCount, onGamesCountChange } = props;
  return (
    <>
      <label className="label" htmlFor="infoia-plies">Límite jugadas</label>
      <input id="infoia-plies" className="field-num" type="number" min={1} max={400} value={pliesLimit} onChange={(e) => onPliesLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-count">Partidas</label>
      <input id="infoia-count" className="field-num" type="number" min={1} max={1000} value={gamesCount} onChange={(e) => onGamesCountChange(Number(e.target.value))} style={{ width: 90 }} />
    </>
  );
}

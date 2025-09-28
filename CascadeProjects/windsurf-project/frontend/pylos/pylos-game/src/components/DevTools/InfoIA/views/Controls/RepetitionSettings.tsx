export function RepetitionSettings(props: {
  repeatMax: number;
  onRepeatMaxChange: (v: number) => void;
  avoidPenalty: number;
  onAvoidPenaltyChange: (v: number) => void;
}) {
  const { repeatMax, onRepeatMaxChange, avoidPenalty, onAvoidPenaltyChange } = props;
  return (
    <>
      {/* Límite de repetición de posiciones (para cortar bucles) */}
      <label className="label" htmlFor="infoia-repeatmax" title="Umbral para detener una simulación cuando se repite una posición tantas veces">Repetición máx.</label>
      <input
        id="infoia-repeatmax"
        className="field-num"
        type="number"
        min={1}
        max={10}
        value={repeatMax}
        onChange={(e) => onRepeatMaxChange(Number(e.target.value))}
        style={{ width: 90 }}
        title="Umbral de repetición (1–10). Al alcanzarse, la simulación finaliza con motivo 'repetition-limit'."
      />

      {/* Penalización para evitar repetir posiciones en la raíz de la búsqueda */}
      <label className="label" htmlFor="infoia-avoidpen" title="Penalización aplicada a movimientos raíz que llevan a posiciones repetidas">Evitar bucles (penalización)</label>
      <input
        id="infoia-avoidpen"
        className="field-num"
        type="number"
        min={0}
        max={500}
        value={avoidPenalty}
        onChange={(e) => onAvoidPenaltyChange(Number(e.target.value))}
        style={{ width: 110 }}
        title="Penalización [0–500] en unidades de evaluación. Valores mayores desincentivan ciclos."
      />
    </>
  );
}

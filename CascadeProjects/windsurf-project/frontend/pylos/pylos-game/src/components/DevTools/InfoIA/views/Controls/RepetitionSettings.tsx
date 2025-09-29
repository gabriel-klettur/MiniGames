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
      <label
        className="label"
        htmlFor="infoia-repeatmax"
        title={
          'Número de veces que puede repetirse la misma posición antes de terminar la simulación.\n' +
          'Útil para evitar partidas infinitas.\n' +
          'Ejemplo: si pones 3, al detectar la misma posición por 3ª vez se detiene (motivo: repetition-limit).'
        }
      >
        Repetición máx.
      </label>
      <input
        id="infoia-repeatmax"
        className="field-num"
        type="number"
        min={1}
        max={10}
        value={repeatMax}
        onChange={(e) => onRepeatMaxChange(Number(e.target.value))}
        style={{ width: 90 }}
        title={
          'Umbral de repetición (1–10).\n' +
          'Valores más bajos cortan antes (más rápido), valores altos toleran más bucles.'
        }
      />

      {/* Penalización para evitar repetir posiciones en la raíz de la búsqueda */}
      <label
        className="label"
        htmlFor="infoia-avoidpen"
        title={
          'Penalización aplicada a jugadas de la raíz que llevan a posiciones ya vistas.\n' +
          'Cuanto mayor, menos probable que la IA repita.\n' +
          'Ejemplo: 50 desincentiva fuerte repetir; 0 lo desactiva.'
        }
      >
        Evitar bucles (penalización)
      </label>
      <input
        id="infoia-avoidpen"
        className="field-num"
        type="number"
        min={0}
        max={500}
        value={avoidPenalty}
        onChange={(e) => onAvoidPenaltyChange(Number(e.target.value))}
        style={{ width: 110 }}
        title={
          'Rango 0–500 (unidades de evaluación).\n' +
          'Prueba 20–80 para evitar repeticiones sin afectar jugadas claramente ganadoras.'
        }
      />
    </>
  );
}

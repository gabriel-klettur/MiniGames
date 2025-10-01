export function MirrorAndBook(props: {
  mirrorBoard: boolean;
  onMirrorChange: (v: boolean) => void;
  useBook: boolean;
  onUseBookChange: (v: boolean) => void;
}) {
  const { mirrorBoard, onMirrorChange } = props;
  return (
    <>
      {/* Visualizar simulación en el tablero (sin animaciones) */}
      <label className="label" htmlFor="infoia-mirror" title="Mostrar la partida simulada en el tablero (sin animaciones)">Visualizar</label>
      <input
        id="infoia-mirror"
        type="checkbox"
        checked={mirrorBoard}
        onChange={(e) => onMirrorChange(e.target.checked)}
        aria-checked={mirrorBoard}
        title="Mostrar la partida simulada en el tablero (sin animaciones)"
      />
      {/* Nota: el control global de books se ha movido a nivel de jugador. Este toggle se oculta para evitar confusiones. */}
    </>
  );
}


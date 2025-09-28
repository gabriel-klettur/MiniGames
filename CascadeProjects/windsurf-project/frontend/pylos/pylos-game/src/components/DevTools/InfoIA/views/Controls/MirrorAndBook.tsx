export function MirrorAndBook(props: {
  mirrorBoard: boolean;
  onMirrorChange: (v: boolean) => void;
  useBook: boolean;
  onUseBookChange: (v: boolean) => void;
}) {
  const { mirrorBoard, onMirrorChange, useBook, onUseBookChange } = props;
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

      {/* Usar libro de aperturas en simulaciones */}
      <label className="label" htmlFor="infoia-usebook" title="Usar libro de aperturas (si existe) durante la simulación">Utilizar books</label>
      <input
        id="infoia-usebook"
        type="checkbox"
        checked={useBook}
        onChange={(e) => onUseBookChange(e.target.checked)}
        aria-checked={useBook}
        title="Activar/desactivar uso de book en InfoIA"
      />
    </>
  );
}


export interface InfoPanelProps {
  current: 'L' | 'D';
  wallsLeft: { L: number; D: number };
  className?: string;
}

/**
 * InfoPanel — Muestra turno actual y vallas restantes por jugador (3 columnas).
 * Presentacional: no contiene lógica del motor.
 */
export default function InfoPanel({ current, wallsLeft, className }: InfoPanelProps) {
  const commonBox = 'rounded-md border border-white/10 bg-gray-900/50 px-3 py-2';
  const badge = (who: 'L' | 'D') => (
    <span
      className={[
        'inline-flex items-center justify-center w-6 h-6 text-[11px] font-semibold rounded-full',
        who === 'L' ? 'bg-orange-500/90 text-white' : 'bg-amber-900/90 text-white',
      ].join(' ')}
      aria-label={who === 'L' ? 'Jugador L' : 'Jugador D'}
      title={who === 'L' ? 'Jugador L' : 'Jugador D'}
    >
      {who}
    </span>
  );

  return (
    <section className={["w-full", className ?? ""].join(" ").trim()} aria-label="Panel de información de Quoridor">
      <div className="grid grid-cols-3 gap-2">
        {/* Izquierda: L */}
        <div className={[commonBox, 'flex items-center gap-2'].join(' ')}>
          {badge('L')}
          <div className="text-xs leading-tight">
            <div className="text-gray-300">Vallas</div>
            <div className="text-gray-100 font-semibold">{wallsLeft.L}</div>
          </div>
        </div>

        {/* Centro: turno actual */}
        <div className={[commonBox, 'flex items-center justify-center gap-2'].join(' ')}>
          <span className="text-xs text-gray-300">Turno</span>
          {badge(current)}
          <span className="text-xs text-gray-400">{current === 'L' ? 'Claras' : 'Oscuras'}</span>
        </div>

        {/* Derecha: D */}
        <div className={[commonBox, 'flex items-center gap-2 justify-end'].join(' ')}>
          <div className="text-right text-xs leading-tight">
            <div className="text-gray-300">Vallas</div>
            <div className="text-gray-100 font-semibold">{wallsLeft.D}</div>
          </div>
          {badge('D')}
        </div>
      </div>
    </section>
  );
}


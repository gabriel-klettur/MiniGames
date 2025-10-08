import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetGame, setOrientation } from '../../store/gameSlice';
import type { RootState } from '../../store';
import '../../styles/header.css';

export default function HeaderPanel() {
  const dispatch = useAppDispatch();
  const winner = useAppSelector((s: RootState) => s.game.winner);
  const orientation = useAppSelector((s: RootState) => s.game.ui.orientation);

  return (
    <section className="header-bar" aria-label="Encabezado">
      <div className="row header">
        <h2>Squadro v0.71.29.9.2025</h2>
        <div className="header-actions">
          {/* Nueva partida (icono plus) */}
          <button onClick={() => dispatch(resetGame())} aria-label="Nueva partida" title="Nueva partida">
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/></svg>
            <span className="sr-only">Nueva partida</span>
          </button>

          {/* Botón Vs IA (mismo estilo Pylos) */}
          <button
            onClick={() => { /* TODO: abrir popover IA */ }}
            aria-label="Configurar partida Vs IA"
            title="Vs IA (próximamente)"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M13.5 12.5 21 20l-1 1-7.5-7.5L6 20l-1-1 6.5-6.5L4 5 5 4l7.5 6.5L19 4l1 1-6.5 7.5Z"/>
            </svg>
            <span className="header-btn__label">Vs IA</span>
          </button>

          {/* Alternar orientación con un solo botón tipo toggle (Pylos chip style) */}
          <button
            onClick={() => dispatch(setOrientation(orientation === 'classic' ? 'bga' : 'classic'))}
            aria-pressed={orientation === 'bga'}
            aria-label={orientation === 'classic' ? 'Orientación actual: Clásico (clic para cambiar a BGA)' : 'Orientación actual: BGA (clic para cambiar a Clásico)'}
            title={orientation === 'classic' ? 'Cambiar a BGA' : 'Cambiar a Clásico'}
          >
            <span className="header-btn__label">{orientation === 'classic' ? 'Clásico' : 'BGA'}</span>
          </button>

          {/* Ganador como chip informativo (fuera del alcance de botones iguales) */}
          {winner && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              Ganador: <span className="font-semibold">{winner}</span>
            </span>
          )}
        </div>
      </div>
      {/* Popover IA (pendiente) */}
    </section>
  );
}


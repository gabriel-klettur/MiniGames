import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { SymbolIcon } from './Icons';

export default function Board() {
  const { state, dispatch } = useGame();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const ellipseRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<{ w: number; h: number; token: number }>({ w: 0, h: 0, token: 0 });

  useEffect(() => {
    const el = fieldRef.current;
    const ellipse = ellipseRef.current;
    if (!el || !ellipse) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(ellipse);
      const tokenStr = cs.getPropertyValue('--token-size').trim();
      const token = tokenStr.endsWith('px') ? parseFloat(tokenStr) : parseFloat(tokenStr) || 56;
      setSizes({ w: rect.width, h: rect.height, token });
    });
    ro.observe(el);
    ro.observe(ellipse);
    return () => ro.disconnect();
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const onCellClick = (id: string) => {
    if (!state.selectedId) {
      dispatch({ type: 'select', id });
      return;
    }
    // Intentar fusionar la torre seleccionada encima de la torre destino
    dispatch({ type: 'attempt-merge', targetId: id });
  };

  return (
    <div className="board-wrapper">
      <div className="play-area">
        <div className="play-ellipse" ref={ellipseRef}>
          <div className="play-field" ref={fieldRef}>
            {state.towers.map((t) => (
              <button
                key={t.id}
                className={`token ${state.selectedId === t.id ? 'selected' : ''}`}
                style={{
                  // clamp center within bounds using measured sizes
                  left: sizes.w
                    ? clamp(
                        t.pos.x * sizes.w,
                        sizes.token / 2 + 4,           // +4px fudge for 3px borders/outline
                        sizes.w - (sizes.token / 2 + 4)
                      )
                    : `${t.pos.x * 100}%`,
                  top: (() => {
                    if (!sizes.h) return `${t.pos.y * 100}%`;
                    const stackPx = 12 + Math.min(10, t.height - 1) * 6; // must match CSS calc
                    const margin = sizes.token / 2 + stackPx / 2 + 2; // +2px for borders
                    return clamp(t.pos.y * sizes.h, margin, sizes.h - margin);
                  })(),
                  // Ordenar por Y para simular profundidad (más abajo, por encima)
                  zIndex: Math.round(t.pos.y * 1000),
                }}
                onClick={() => onCellClick(t.id)}
                title={`h:${t.height} · top:${t.top}`}
              >
                <div className="token-top">
                  <div className="token-icon">
                    <SymbolIcon type={t.top} />
                  </div>
                </div>
                <div
                  className="token-side"
                  style={{ ['--stack-level' as any]: Math.min(10, t.height - 1) }}
                />
                <div className="token-height">{t.height}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.roundOver && (
        <div className="board-overlay">
          <div className="overlay-card">
            <div>Ronda terminada</div>
            {state.lastMover && <div>Ganador: Jugador {state.lastMover}</div>}
            <button onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
          </div>
        </div>
      )}
      {state.gameOver && (
        <div className="board-overlay">
          <div className="overlay-card">
            <div>Partida terminada</div>
            {state.lastMover && <div>Campeón: Jugador {state.lastMover}</div>}
            <button onClick={() => dispatch({ type: 'reset-game' })}>Reiniciar juego</button>
          </div>
        </div>
      )}
    </div>
  );
}


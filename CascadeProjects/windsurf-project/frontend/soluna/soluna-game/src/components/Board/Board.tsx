import { useRef, useState } from 'react';
import { useGame } from '../../game/store';
import GameOverModal from '../GameOverModal';
import { useBoardSizes } from './hooks/useBoardSizes';
import { useDragAndClick } from './hooks/useDragAndClick';
import { useMergeFlight } from './hooks/useMergeFlight';
import TokenButton from './TokenButton';
import FlightLayer from './FlightLayer';
import { clamp } from './utils';
import useClickOutside from '../../hooks/useClickOutside';
import CellTokenPicker from './CellTokenPicker';
import { SymbolIcon } from '../Icons';

export default function Board({ onNewGame, onNewRound }: { onNewGame?: () => void; onNewRound?: () => void }) {
  const { state, dispatch } = useGame();
  // Local UI state for custom setup symbol picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const { fieldRef, ellipseRef, sizes } = useBoardSizes();
  const selectedTower = state.selectedId ? state.towers.find(t => t.id === state.selectedId) : null;
  // During merge flight (normal mode), hide the source token so it doesn't duplicate
  const towersToRender = state.mergeFx
    ? state.towers.filter(t => t.id !== state.mergeFx!.fromId)
    : state.towers;

  const {
    dragId,
    dropTargetId,
    onCellClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useDragAndClick({ state, dispatch, sizes, fieldRef });

  const { flightRunning, flightPx, flightRef, supportsMotionPath, curvePath } = useMergeFlight({ state, sizes, fieldRef });

  // Close symbol picker on outside click
  useClickOutside([pickerRef], pickerOpen, () => setPickerOpen(false));

  return (
    <div className="board-wrapper">
      <div className="play-area">
        <div className="play-ellipse" ref={ellipseRef}>
          <div
            className={`play-field ${selectedTower ? `has-selection selected-${selectedTower.top}` : ''}`}
            ref={fieldRef}
          >
            {towersToRender.map((t) => (
              <TokenButton
                key={t.id}
                tower={t}
                className={`token ${state.selectedId === t.id ? 'selected' : ''} ${dragId === t.id ? 'dragging' : ''} ${dropTargetId === t.id ? 'droppable-target' : ''} ${selectedTower && selectedTower.id !== t.id && t.height === selectedTower.height ? 'height-match' : ''}`}
                style={{
                  left: sizes.w ? clamp(t.pos.x * sizes.w, 0, sizes.w) : `${t.pos.x * 100}%`,
                  top: sizes.h ? clamp(t.pos.y * sizes.h, 0, sizes.h) : `${t.pos.y * 100}%`,
                  zIndex: dragId === t.id ? 999999 : Math.round(t.pos.y * 1000),
                  ['--stack-level' as any]: Math.min(10, t.height - 1),
                  ['--stack-count' as any]: t.height,
                }}
                onClick={() => onCellClick(t.id)}
                onPointerDown={(e) => handlePointerDown(e, t.id)}
                onPointerMove={(e) => handlePointerMove(e, t.id)}
                onPointerUp={(e) => handlePointerUp(e, t.id)}
                onPointerCancel={(e) => handlePointerCancel(e, t.id)}
              />
            ))}

            <FlightLayer
              mergeFx={state.mergeFx}
              flightPx={flightPx}
              flightRunning={flightRunning}
              flightRef={flightRef}
              supportsMotionPath={supportsMotionPath}
              curvePath={curvePath}
              curveEnabled={sizes.curveEnabled}
              lingerMs={sizes.lingerMs}
              dispatch={dispatch}
            />

            {/* Custom setup overlay: 4x3 grid with white borders */}
            {state.customSetup?.open && (
              <div className="custom-setup-overlay" aria-label="Configurar tablero">
                <div className="custom-grid" role="grid" aria-rowcount={3} aria-colcount={4}>
                  {(state.customSetup.cells || []).map((sym, idx) => (
                    <button
                      key={idx}
                      role="gridcell"
                      className="custom-cell"
                      title={sym ? `Celda ${idx + 1}: ${sym}` : `Elegir ficha (celda ${idx + 1})`}
                      aria-label={sym ? `Celda ${idx + 1}: ${sym}` : `Elegir ficha en celda ${idx + 1}`}
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setPickerAnchor(rect);
                        setPickerIndex(idx);
                        setPickerOpen(true);
                      }}
                    >
                      {sym ? (
                        <div className="cell-figure" aria-hidden="true">
                          <SymbolIcon type={sym} />
                        </div>
                      ) : (
                        <span className="cell-text"></span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Inline popover for symbol picking */}
                {pickerOpen && pickerIndex != null && (
                  <CellTokenPicker
                    anchorRect={pickerAnchor}
                    popRef={pickerRef}
                    onPick={(symbol) => {
                      dispatch({ type: 'set-custom-cell', index: pickerIndex, symbol });
                      setPickerOpen(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm button appears when all 12 cells are selected */}
      {state.customSetup?.open && state.customSetup.cells.every((c) => c != null) && (
        <div className="custom-setup-actions">
          <button
            className="btn btn-success"
            onClick={() => dispatch({ type: 'confirm-custom-setup' })}
            aria-label="Confirmar configuración del tablero"
            title="Confirmar tablero"
          >
            Confirmar tablero
          </button>
        </div>
      )}

      {state.roundOver && !state.gameOver && (
        <GameOverModal
          title="Ronda terminada"
          message={`Ronda terminada — Ganador: Jugador ${state.lastMover ?? ''}. Responsabilidades: Ganador: obtiene 1 estrella y espera a que el rival inicie la siguiente ronda • Perdedor: empieza la siguiente ronda.`}
          buttonLabel="Nueva ronda"
          autoFocus={state.mode !== 'simulation'}
          onConfirm={() => (onNewRound ? onNewRound() : dispatch({ type: 'new-round' }))}
        />
      )}
      {state.gameOver && (
        <GameOverModal
          title="Partida terminada"
          message={`Partida terminada — Campeón: Jugador ${state.lastMover ?? ''}. Responsabilidades: Ganador: Campeón de la partida • Perdedor: puedes reiniciar para comenzar una nueva partida.`}
          buttonLabel="Nueva partida"
          autoFocus={state.mode !== 'simulation'}
          onConfirm={() => (onNewGame ? onNewGame() : dispatch({ type: 'reset-game' }))}
        />
      )}
    </div>
  );
}

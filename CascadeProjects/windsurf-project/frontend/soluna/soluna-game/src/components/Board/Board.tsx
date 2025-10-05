import { useEffect, useRef, useState } from 'react';
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
  // FX: cell-level appear animation when user picks a symbol for a grid cell
  const [cellFxIndex, setCellFxIndex] = useState<number | null>(null);

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

  // Clear spawn FX after animation completes
  useEffect(() => {
    if (!state.spawnFx) return;
    const id = window.setTimeout(() => dispatch({ type: 'clear-spawn-fx' }), 1000);
    return () => window.clearTimeout(id);
  }, [state.spawnFx, dispatch]);

  return (
    <div className="board-wrapper">
      <div className="play-area">
        <div className="play-ellipse" ref={ellipseRef}>
          <div
            className={`play-field ${selectedTower ? `has-selection selected-${selectedTower.top}` : ''}`}
            ref={fieldRef}
          >
            {towersToRender.map((t) => {
              // Read teleport flags from CSS variables on the ellipse (applied by UIUX DevTools)
              const cssBool = (name: string): boolean => {
                const el = ellipseRef.current as HTMLElement | null;
                const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : '1';
                const n = parseFloat(v);
                return Number.isFinite(n) ? n > 0 : v === 'true' || v === '1';
              };
              const teleportRandom = cssBool('--teleport-random');
              const teleportManualConfirm = cssBool('--teleport-manual-confirm');
              const spawn = !!state.spawnFx && state.spawnFx.ids.includes(t.id);
              const spawnKindOk = !state.spawnFx ? false : (state.spawnFx.kind === 'random' ? teleportRandom : teleportManualConfirm);
              return (
              <TokenButton
                key={t.id}
                tower={t}
                className={`token ${state.selectedId === t.id ? 'selected' : ''} ${dragId === t.id ? 'dragging' : ''} ${dropTargetId === t.id ? 'droppable-target' : ''} ${selectedTower && selectedTower.id !== t.id && t.height === selectedTower.height ? 'height-match' : ''} ${(spawn && spawnKindOk) ? 'spawn-teleport' : ''}`}
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
              );
            })}

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
                        <div className={`cell-figure ${cellFxIndex === idx ? 'cell-teleport' : ''}`} aria-hidden="true">
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
                      // trigger local FX on the cell just set if enabled via CSS var
                      const el = ellipseRef.current as HTMLElement | null;
                      const v = el ? getComputedStyle(el).getPropertyValue('--teleport-manual-pick').trim() : '1';
                      const n = parseFloat(v);
                      const enabled = (Number.isFinite(n) ? n > 0 : v === 'true' || v === '1');
                      if (enabled) setCellFxIndex(pickerIndex);
                      window.setTimeout(() => setCellFxIndex((i) => (i === pickerIndex ? null : i)), 1000);
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

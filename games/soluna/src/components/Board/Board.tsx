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
import { SymbolIcon } from '../Icons';
import type { SymbolType, MergeFx } from '../../game/types';
import CountPickerPopover from './CountPickerPopover';
import DebugOverlay from './DebugOverlay';
import StackDebugOverlay from './StackDebugOverlay';

export default function Board({ onNewGame, onNewRound }: { onNewGame?: () => void; onNewRound?: () => void }) {
  const { state, dispatch } = useGame();
  // Fast counts-based setup: number picker state
  const [countPickerOpen, setCountPickerOpen] = useState(false);
  const [countSymbol, setCountSymbol] = useState<SymbolType | null>(null);
  const countPickerRef = useRef<HTMLDivElement | null>(null);

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

  // Última traza persistida (hasta el próximo movimiento)
  const [lastTrace, setLastTrace] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    stackCount?: number;
    symbol?: SymbolType;
  } | null>(null);
  useEffect(() => {
    if (flightPx && state.mergeFx) {
      const symbol = state.mergeFx.sourceStack[state.mergeFx.sourceStack.length - 1];
      setLastTrace({ start: flightPx.start, end: flightPx.end, stackCount: state.mergeFx.sourceStack.length, symbol });
    }
  }, [flightPx, state.mergeFx]);

  // Snapshot persistente del último mergeFx para mantener stacking overlays tras CLEAR
  const [lastMergeFx, setLastMergeFx] = useState<MergeFx | null>(null);
  useEffect(() => {
    if (state.mergeFx) setLastMergeFx(state.mergeFx);
  }, [state.mergeFx]);

  // Debug flag: read from localStorage and listen to UI events
  const [debug, setDebug] = useState<boolean>(() => {
    try { return window.localStorage.getItem('soluna:ui:anim-debug') === '1'; } catch { return false; }
  });
  useEffect(() => {
    const onChange = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { value?: boolean } | undefined;
        if (detail && typeof detail.value === 'boolean') { setDebug(detail.value); return; }
      } catch {}
      try { setDebug(window.localStorage.getItem('soluna:ui:anim-debug') === '1'); } catch {}
    };
    window.addEventListener('soluna:ui:anim-debug-changed', onChange as any);
    return () => window.removeEventListener('soluna:ui:anim-debug-changed', onChange as any);
  }, []);

  // Close number picker on outside click
  useClickOutside([countPickerRef], countPickerOpen, () => setCountPickerOpen(false));

  // Clear spawn FX after animation completes
  useEffect(() => {
    if (!state.spawnFx) return;
    const id = window.setTimeout(() => dispatch({ type: 'clear-spawn-fx' }), 1000);
    return () => window.clearTimeout(id);
  }, [state.spawnFx, dispatch]);

  // Re-render when UI/UX config changes (so we re-read CSS vars like --stack-indicator-visible)
  const [, forceRender] = useState({});
  useEffect(() => {
    const onCfg = () => forceRender({});
    window.addEventListener('soluna:ui:cfg-updated', onCfg as any);
    return () => window.removeEventListener('soluna:ui:cfg-updated', onCfg as any);
  }, []);

  return (
    <div className="board-wrapper">
      <div className="play-area">
        <div className="play-ellipse" ref={ellipseRef}>
          <div
            className={`play-field ${selectedTower ? `has-selection selected-${selectedTower.top}` : ''} ${debug ? 'debug-flight-slow' : ''}`}
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
              const stackIndicatorVisible = (() => {
                const fromCss = cssBool('--stack-indicator-visible');
                try {
                  const raw = window.localStorage.getItem('soluna:ui:cfg');
                  if (raw) {
                    const cfgAny = JSON.parse(raw) as any;
                    if (typeof cfgAny?.stackIndicatorVisible === 'boolean') return cfgAny.stackIndicatorVisible;
                  }
                } catch {}
                return fromCss;
              })();
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
                showHeight={stackIndicatorVisible}
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
              lingerMs={sizes.lingerMs}
              dispatch={dispatch}
              debug={debug}
              tokenSize={sizes.token}
            />

            {/* Debug overlay: muestra trayectorias y puntos clave */}
            {debug && (
              <StackDebugOverlay
                sizes={sizes}
                mergeFx={state.mergeFx}
                lastMergeFx={lastMergeFx}
                fieldRef={fieldRef}
                tokenSize={sizes.token}
              />
            )}
            
            {/* Debug overlay: trayectorias (curva) y panel */}
            {debug && (
              <DebugOverlay
                sizes={sizes}
                flightPx={flightPx}
                lastTrace={lastTrace}
                mergeFx={state.mergeFx}
                fieldRef={fieldRef}
                motionPath={curvePath}
              />
            )}

            {/* Custom setup overlay: fast 4-column counts UI */}
            {state.customSetup?.open && (
              <div className="custom-setup-overlay" aria-label="Configurar tablero (rápido por cantidades)">
                {(() => {
                  const counts = state.customSetup?.counts || {};
                  const order: SymbolType[] = ['sol', 'luna', 'estrella', 'fugaz'];
                  const getCount = (k: SymbolType) => Math.max(0, counts[k] ?? 0);
                  const total = order.reduce((acc, k) => acc + getCount(k), 0);
                  const remaining = 12 - total;
                  return (
                    <div className="custom-counts-panel" role="group" aria-label="Selecciona cantidades por ficha">
                      <div className="counts-header" aria-live="polite">
                        <span>Total seleccionado: {total} / 12</span>
                        {remaining !== 0 && <span className="counts-remaining">Restantes: {remaining}</span>}
                      </div>
                      <div className="counts-grid">
                        {order.map((sym) => (
                          <button
                            key={sym}
                            className="count-card"
                            title={`Elegir cantidad de ${sym}`}
                            aria-label={`Elegir cantidad de ${sym}`}
                            onClick={() => { setCountSymbol(sym); setCountPickerOpen(true); }}
                          >
                            <div className="count-figure" aria-hidden="true">
                              <SymbolIcon type={sym} />
                            </div>
                            <div className="count-value" aria-hidden="true">{getCount(sym)}</div>
                          </button>
                        ))}
                      </div>
                      {/* Fallback: keep cell picker accessible (optional). Hidden by default to reduce clicks. */}
                    </div>
                  );
                })()}
                {/* Centered popover for number picking 0–6 */}
                {countPickerOpen && (
                  <div ref={countPickerRef}>
                    <CountPickerPopover
                      onPick={(n) => {
                        if (!countSymbol) return;
                        const next: Partial<Record<SymbolType, number>> = { [countSymbol]: n } as any;
                        dispatch({ type: 'set-custom-counts', counts: next as any });
                        // Close and reset selection to reflect the updated counters immediately
                        setCountPickerOpen(false);
                        setCountSymbol(null);
                      }}
                      onClose={() => setCountPickerOpen(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm button: enabled when counts sum to 12 OR all 12 cells picked (fallback) */}
      {state.customSetup?.open && (() => {
        const counts = state.customSetup?.counts || {};
        const order: SymbolType[] = ['sol', 'luna', 'estrella', 'fugaz'];
        const sum = order.reduce((acc, k) => acc + Math.max(0, counts[k] ?? 0), 0);
        const readyByCounts = sum === 12;
        const readyByCells = state.customSetup.cells.every((c) => c != null);
        return readyByCounts || readyByCells;
      })() && (
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

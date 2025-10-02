import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { canMerge } from '../game/rules';
import { SymbolIcon } from './Icons';
import GameOverModal from './GameOverModal';

export default function Board() {
  const { state, dispatch } = useGame();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const ellipseRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<{ w: number; h: number; token: number; stackStep: number; maxDiscs: number; mergeFactor: number; dropHighlight: boolean; freeMove: boolean }>({ w: 0, h: 0, token: 0, stackStep: 18, maxDiscs: 10, mergeFactor: 0.6, dropHighlight: true, freeMove: true });
  const [dragId, setDragId] = useState<string | null>(null);
  const dragStartRef = useRef<{ id: string; pos: { x: number; y: number } } | null>(null);
  const movedDuringDragRef = useRef(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const selectedTower = state.selectedId ? state.towers.find(t => t.id === state.selectedId) : null;
  // Long-press to start dragging
  const LONG_PRESS_MS = 220;
  const pressTimerRef = useRef<number | null>(null);
  const pressingRef = useRef<{ id: string } | null>(null);
  useEffect(() => {
    const el = fieldRef.current;
    const ellipse = ellipseRef.current;
    if (!el || !ellipse) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(ellipse);
      const tokenStr = cs.getPropertyValue('--token-size').trim();
      const token = tokenStr.endsWith('px') ? parseFloat(tokenStr) : parseFloat(tokenStr) || 56;
      const stepStr = cs.getPropertyValue('--stack-step').trim();
      const stackStep = stepStr.endsWith('px') ? parseFloat(stepStr) : parseFloat(stepStr) || 18;
      const maxDiscs = parseInt(cs.getPropertyValue('--max-discs').trim() || '10', 10) || 10;
      const mergeFactor = parseFloat(cs.getPropertyValue('--merge-threshold-factor').trim() || '0.6') || 0.6;
      const dropHighlight = (parseFloat(cs.getPropertyValue('--drop-highlight').trim() || '1') || 0) > 0;
      const freeMove = (parseFloat(cs.getPropertyValue('--free-move').trim() || '1') || 0) > 0;
      setSizes({ w: rect.width, h: rect.height, token, stackStep, maxDiscs, mergeFactor, dropHighlight, freeMove });
    });
    ro.observe(el);
    ro.observe(ellipse);
    return () => ro.disconnect();
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const onCellClick = (id: string) => {
    // ignore clicks when dragging or just dragged
    if (dragId || movedDuringDragRef.current) return;
    // If nothing selected, select this one
    if (!state.selectedId) {
      dispatch({ type: 'select', id });
      return;
    }
    // If clicking again the same selected token, keep it selected (no toggle off)
    if (state.selectedId === id) {
      return;
    }
    // If symbols are the same, try click-to-merge; otherwise switch focus/selection to the clicked token
    const source = state.towers.find(t => t.id === state.selectedId);
    const target = state.towers.find(t => t.id === id);
    if (!source || !target) return;
    if (canMerge(source, target)) {
      dispatch({ type: 'attempt-merge', targetId: id });
    } else {
      dispatch({ type: 'select', id });
    }
  };

  // Helpers to convert pointer to normalized [0..1] inside play-field
  const pointToNormalized = (clientX: number, clientY: number) => {
    const el = fieldRef.current;
    if (!el) return { x: 0.5, y: 0.5 };
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    // Mark selection immediately on press ONLY if nothing is selected yet.
    // If another token is selected, keep it for potential click-to-merge on click.
    if (!state.selectedId) {
      dispatch({ type: 'select', id });
    }
    movedDuringDragRef.current = false;
    pressingRef.current = { id };
    // clear any previous timer
    if (pressTimerRef.current != null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    // Start long-press timer to enable dragging
    pressTimerRef.current = window.setTimeout(() => {
      // Start drag only if still pressing same id and not already dragging
      if (pressingRef.current?.id === id && !dragId) {
        // If another token was selected, switch selection to this one as we begin dragging
        if (state.selectedId !== id) {
          dispatch({ type: 'select', id });
        }
        setDragId(id);
        const t = state.towers.find(tt => tt.id === id);
        if (t) dragStartRef.current = { id, pos: { x: t.pos.x, y: t.pos.y } };
      }
    }, LONG_PRESS_MS);
    // Do not prevent default here to allow the subsequent click to fire on quick taps
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    // Only move if we are actively dragging (after long press)
    if (dragId !== id) return;
    const pos = pointToNormalized(e.clientX, e.clientY);
    // Enforce strict non-overlap while dragging by sending a normalized minD
    const minWH = Math.max(1, Math.min(sizes.w, sizes.h));
    const minD = Math.max(0.06, (sizes.token * 1.1) / minWH);
    dispatch({ type: 'move-tower', id, pos, minD });
    // compute nearest valid target while dragging
    const field = fieldRef.current;
    if (field) {
      const rect = field.getBoundingClientRect();
      const srcPx = { x: pos.x * rect.width, y: pos.y * rect.height };
      let best: { id: string; d: number } | null = null;
      for (const t of state.towers) {
        if (t.id === id) continue;
        const dx = t.pos.x * rect.width - srcPx.x;
        const dy = t.pos.y * rect.height - srcPx.y;
        const d = Math.hypot(dx, dy);
        if (!best || d < best.d) best = { id: t.id, d };
      }
      const threshold = sizes.token * sizes.mergeFactor;
      if (sizes.dropHighlight && best && best.d <= threshold) {
        const srcT = state.towers.find(t => t.id === id);
        const dstT = state.towers.find(t => t.id === best!.id);
        if (srcT && dstT && canMerge(srcT, dstT)) setDropTargetId(dstT.id);
        else setDropTargetId(null);
      } else {
        setDropTargetId(null);
      }
    }
    movedDuringDragRef.current = true;
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerUp = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    el.releasePointerCapture?.(e.pointerId);
    // Clear any pending long-press
    if (pressTimerRef.current != null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressingRef.current = null;

    const wasDragging = dragId === id;
    if (!wasDragging) {
      // Simple tap/click: keep selection as set on pointerDown
      setDropTargetId(null);
      movedDuringDragRef.current = false;
      return;
    }

    setDragId(null);
    // On drop, try to merge if near a valid target
    const field = fieldRef.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const src = state.towers.find(t => t.id === id);
    if (!src) return;
    const srcPx = { x: src.pos.x * rect.width, y: src.pos.y * rect.height };
    let best: { id: string; d: number } | null = null;
    for (const t of state.towers) {
      if (t.id === id) continue;
      const dx = t.pos.x * rect.width - srcPx.x;
      const dy = t.pos.y * rect.height - srcPx.y;
      const d = Math.hypot(dx, dy);
      if (!best || d < best.d) best = { id: t.id, d };
    }
    // Threshold to consider 'dropping onto' another: CSS-configured merge factor
    const threshold = sizes.token * sizes.mergeFactor;
    if (best && best.d <= threshold) {
      const dst = state.towers.find(t => t.id === best!.id);
      if (dst) {
        if (canMerge(src, dst)) {
          // attempt merge (source on top of target)
          dispatch({ type: 'attempt-merge', targetId: dst.id });
          dragStartRef.current = null;
          setDropTargetId(null);
          // keep moved flag true briefly to suppress the click that follows pointerup
          setTimeout(() => { movedDuringDragRef.current = false; }, 0);
          return;
        } else {
          // Snap around the target at a minimum radius so it never stays overlapped
          const minWH = Math.max(1, Math.min(rect.width, rect.height));
          const rNorm = Math.max(0.06, (sizes.token * 1.1) / minWH);
          const dstPx = { x: dst.pos.x * rect.width, y: dst.pos.y * rect.height };
          let vx = srcPx.x - dstPx.x;
          let vy = srcPx.y - dstPx.y;
          const vlen = Math.hypot(vx, vy);
          if (vlen < 1e-6) { vx = 1; vy = 0; }
          else { vx /= vlen; vy /= vlen; }
          const newPos = {
            x: clamp(dst.pos.x + (vx * rNorm), 0, 1),
            y: clamp(dst.pos.y + (vy * rNorm), 0, 1),
          };
          dispatch({ type: 'move-tower', id, pos: newPos });
          // Resolve any residual overlap globally to ensure nothing remains overlapped
          dispatch({ type: 'resolve-all-overlaps', minD: rNorm });
          dragStartRef.current = null;
          setDropTargetId(null);
          setTimeout(() => { movedDuringDragRef.current = false; }, 0);
          return;
        }
      }
    }
    // Free move: keep last position; otherwise revert to start
    const start = dragStartRef.current;
    if (!sizes.freeMove && start && start.id === id) {
      dispatch({ type: 'move-tower', id, pos: start.pos });
    }
    // After dropping without merge, resolve overlaps globally using normalized min distance
    if (field) {
      const minWH = Math.max(1, Math.min(rect.width, rect.height));
      const minD = Math.max(0.06, (sizes.token * 1.1) / minWH);
      dispatch({ type: 'resolve-all-overlaps', minD });
    }
    dragStartRef.current = null;
    setDropTargetId(null);
    // keep moved flag true briefly to suppress the click that follows pointerup
    setTimeout(() => { movedDuringDragRef.current = false; }, 0);
  };

  const handlePointerCancel = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    el.releasePointerCapture?.(e.pointerId);
    if (pressTimerRef.current != null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressingRef.current = null;
    if (dragId === id) {
      setDragId(null);
    }
    setDropTargetId(null);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="board-wrapper">
      <div className="play-area">
        <div className="play-ellipse" ref={ellipseRef}>
          <div
            className={`play-field ${selectedTower ? `has-selection selected-${selectedTower.top}` : ''}`}
            ref={fieldRef}
          >
            {state.towers.map((t) => (
              <button
                key={t.id}
                className={`token ${state.selectedId === t.id ? 'selected' : ''} ${dragId === t.id ? 'dragging' : ''} ${dropTargetId === t.id ? 'droppable-target' : ''} ${selectedTower && selectedTower.id !== t.id && t.height === selectedTower.height ? 'height-match' : ''}`}
                data-symbol={t.top}
                data-height={t.height}
                style={{
                  // Allow placing tokens anywhere within play-field bounds (center can reach edges)
                  left: sizes.w
                    ? clamp(t.pos.x * sizes.w, 0, sizes.w)
                    : `${t.pos.x * 100}%`,
                  top: sizes.h
                    ? clamp(t.pos.y * sizes.h, 0, sizes.h)
                    : `${t.pos.y * 100}%`,
                  // Ordenar por Y para simular profundidad (más abajo, por encima)
                  zIndex: dragId === t.id ? 999999 : Math.round(t.pos.y * 1000),
                  ['--stack-level' as any]: Math.min(10, t.height - 1),
                  ['--stack-count' as any]: t.height,
                }}
                onClick={() => onCellClick(t.id)}
                onPointerDown={(e) => handlePointerDown(e, t.id)}
                onPointerMove={(e) => handlePointerMove(e, t.id)}
                onPointerUp={(e) => handlePointerUp(e, t.id)}
                onPointerCancel={(e) => handlePointerCancel(e, t.id)}
                title={`h:${t.height} · top:${t.top}`}
              >
                {/* Render stacked images for all discs below the top */}
                <div className="token-stack" aria-hidden="true">
                  {(() => {
                    const below = t.stack.slice(0, Math.max(0, t.stack.length - 1)); // base -> one below top
                    const count = below.length;
                    // Render from just-below-top (i=1) downwards to base (i=count)
                    return below.slice().reverse().map((sym, i) => (
                      <div
                        key={i}
                        className="token-disc-img"
                        style={{ ['--i' as any]: i + 1, zIndex: (count - i) }}
                      >
                        <SymbolIcon type={sym} />
                      </div>
                    ));
                  })()}
                </div>
                {/* Top-most disc image */}
                <SymbolIcon type={t.top} />
                <div className="token-height">{t.height}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.roundOver && !state.gameOver && (
        <GameOverModal
          title="Ronda terminada"
          message={`Ronda terminada — Ganador: Jugador ${state.lastMover ?? ''}. Responsabilidades: Ganador: obtiene 1 estrella y espera a que el rival inicie la siguiente ronda • Perdedor: empieza la siguiente ronda.`}
          buttonLabel="Nueva ronda"
          onConfirm={() => dispatch({ type: 'new-round' })}
        />
      )}

      {state.gameOver && (
        <GameOverModal
          title="Partida terminada"
          message={`Partida terminada — Campeón: Jugador ${state.lastMover ?? ''}. Responsabilidades: Ganador: Campeón de la partida • Perdedor: puedes reiniciar para comenzar una nueva partida.`}
          buttonLabel="Nueva partida"
          onConfirm={() => dispatch({ type: 'reset-game' })}
        />
      )}
    </div>
  );
}


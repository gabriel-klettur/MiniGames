import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { canMerge } from '../game/rules';
import { SymbolIcon } from './Icons';

export default function Board() {
  const { state, dispatch } = useGame();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const ellipseRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<{ w: number; h: number; token: number; stackStep: number; maxDiscs: number; mergeFactor: number; dropHighlight: boolean; freeMove: boolean }>({ w: 0, h: 0, token: 0, stackStep: 18, maxDiscs: 10, mergeFactor: 0.6, dropHighlight: true, freeMove: true });
  const [dragId, setDragId] = useState<string | null>(null);
  const dragStartRef = useRef<{ id: string; pos: { x: number; y: number } } | null>(null);
  const movedDuringDragRef = useRef(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

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
    if (dragId || movedDuringDragRef.current) return; // ignore clicks when dragging or just dragged
    if (!state.selectedId) {
      dispatch({ type: 'select', id });
      return;
    }
    // Intentar fusionar la torre seleccionada encima de la torre destino
    dispatch({ type: 'attempt-merge', targetId: id });
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
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragId(id);
    const t = state.towers.find(tt => tt.id === id);
    if (t) dragStartRef.current = { id, pos: { x: t.pos.x, y: t.pos.y } };
    movedDuringDragRef.current = false;
    dispatch({ type: 'select', id });
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (dragId !== id) return;
    const pos = pointToNormalized(e.clientX, e.clientY);
    dispatch({ type: 'move-tower', id, pos });
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
    if (dragId !== id) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
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
    // Threshold to consider 'dropping onto' another: ~0.6 token diameter
    const threshold = sizes.token * 0.6;
    if (best && best.d <= threshold) {
      const dst = state.towers.find(t => t.id === best!.id);
      if (dst && canMerge(src, dst)) {
        // attempt merge (source on top of target)
        dispatch({ type: 'attempt-merge', targetId: dst.id });
        dragStartRef.current = null;
        setDropTargetId(null);
        return;
      }
    }
    // Free move: keep last position; otherwise revert to start
    const start = dragStartRef.current;
    if (!sizes.freeMove && start && start.id === id) {
      dispatch({ type: 'move-tower', id, pos: start.pos });
    }
    dragStartRef.current = null;
    setDropTargetId(null);
    // keep moved flag true briefly to suppress the click that follows pointerup
    setTimeout(() => { movedDuringDragRef.current = false; }, 0);
  };

  const handlePointerCancel = (e: React.PointerEvent, id: string) => {
    if (dragId !== id) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragId(null);
    setDropTargetId(null);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="board-wrapper">
      <div className="play-area">
        <div className="play-ellipse" ref={ellipseRef}>
          <div className="play-field" ref={fieldRef}>
            {state.towers.map((t) => (
              <button
                key={t.id}
                className={`token ${state.selectedId === t.id ? 'selected' : ''} ${dragId === t.id ? 'dragging' : ''} ${dropTargetId === t.id ? 'droppable-target' : ''}`}
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
                    const stackPx = 12 + Math.min(10, t.height - 1) * sizes.stackStep; // must match CSS calc
                    const margin = sizes.token / 2 + stackPx / 2 + 2; // +2px for borders
                    return clamp(t.pos.y * sizes.h, margin, sizes.h - margin);
                  })(),
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
                <div className="token-base" aria-hidden="true" />
                <div className="token-stack" aria-hidden="true">
                  {Array.from({ length: Math.min(sizes.maxDiscs, t.height - 1) }).map((_, i) => (
                    <span key={i} className="token-disc" style={{ ['--i' as any]: i + 1 }} />
                  ))}
                </div>
                <div className="token-top">
                  <div className="token-icon">
                    <SymbolIcon type={t.top} />
                  </div>
                </div>
                <div className="token-height">{t.height}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.roundOver && (
        <div className="board-overlay">
          <div className="overlay-card card">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Ronda terminada</div>
            {state.lastMover && <div style={{ marginBottom: 10 }}>Ganador: Jugador {state.lastMover}</div>}
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
          </div>
        </div>
      )}
      {state.gameOver && (
        <div className="board-overlay">
          <div className="overlay-card card">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Partida terminada</div>
            {state.lastMover && <div style={{ marginBottom: 10 }}>Campeón: Jugador {state.lastMover}</div>}
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'reset-game' })}>Reiniciar juego</button>
          </div>
        </div>
      )}
    </div>
  );
}


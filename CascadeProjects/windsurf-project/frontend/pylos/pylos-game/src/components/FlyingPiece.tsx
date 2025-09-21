import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PointSize {
  left: number; // absolute (fixed) left in px
  top: number;  // absolute (fixed) top in px
  width: number;
  height: number;
}

export interface FlyingPieceProps {
  from: PointSize;
  to: PointSize;
  imgSrc: string;
  durationMs?: number;
  onDone?: () => void;
}

/**
 * FlyingPiece: renders an image that animates from `from` rect to `to` rect
 * using a transform-only CSS transition to minimize layout/repaint work
 * (critical for Safari iOS where animating left/top on fixed can flicker).
 * Pointer events are disabled.
 */
export default function FlyingPiece({ from, to, imgSrc, durationMs = 420, onDone }: FlyingPieceProps) {
  // We animate only the transform of the outer container.
  // Inner box keeps the base (from) size and we scale to reach `to`.
  const [running, setRunning] = useState(false);
  const [transform, setTransform] = useState<string>(
    `translate3d(${from.left}px, ${from.top}px, 0) scale(${1}, ${1})`
  );
  const ref = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    // Reset completion guard for a new animation.
    doneRef.current = false;
    // Ensure we start without transition applied
    setRunning(false);

    // Compute target transform from the current `from` base size.
    const scaleX = to.width / from.width;
    const scaleY = to.height / from.height;

    // Start from the origin rect (no scale).
    setTransform(`translate3d(${from.left}px, ${from.top}px, 0) scale(1, 1)`);

    // Kick off the transition on next frame so initial styles apply.
    const id = requestAnimationFrame(() => {
      setRunning(true);
      setTransform(`translate3d(${to.left}px, ${to.top}px, 0) scale(${scaleX}, ${scaleY})`);
    });
    return () => cancelAnimationFrame(id);
    // Re-run when any rect prop changes.
  }, [from.left, from.top, from.width, from.height, to.left, to.top, to.width, to.height]);

  const node = (
    <div
      ref={ref}
      className="flying-piece"
      style={{
        position: 'fixed',
        // anchor at origin; we will move/scale with transform
        left: 0,
        top: 0,
        // explicit size so the transformed box is visible (avoid 0x0 with contain:size)
        width: from.width,
        height: from.height,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        // animate transform only with a GPU-friendly 3D translate
        transform,
        transformOrigin: 'top left',
        pointerEvents: 'none',
        zIndex: 9999,
        transition: running ? `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
      }}
      onTransitionEnd={() => {
        // This event fires once per transitioned property; guard to call once
        if (doneRef.current) return;
        doneRef.current = true;
        onDone?.();
      }}
    >
      {/* Inner box keeps the base size; outer container scales it to the target */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 6px 16px rgba(0,0,0,0.35)', // mild drop shadow for depth
        }}
      >
        <img
          src={imgSrc}
          alt="flying piece"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            borderRadius: '50%',
            // Match exact size of board piece using the same CSS variable scaling
            transform: 'scale(var(--piece-scale)) translateZ(0)',
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
          draggable={false}
        />
      </div>
    </div>
  );

  return createPortal(node, document.body);
}


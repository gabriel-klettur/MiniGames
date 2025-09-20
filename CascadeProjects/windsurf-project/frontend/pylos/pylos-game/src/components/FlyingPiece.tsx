import { useEffect, useRef, useState } from 'react';

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
 * using CSS transitions with position: fixed. Pointer events are disabled.
 */
export default function FlyingPiece({ from, to, imgSrc, durationMs = 420, onDone }: FlyingPieceProps) {
  const [style, setStyle] = useState<PointSize>(from);
  const [running, setRunning] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    // Kick off the transition on next animation frame to ensure initial styles apply
    const id = requestAnimationFrame(() => {
      setRunning(true);
      setStyle(to);
    });
    return () => cancelAnimationFrame(id);
  }, [to.left, to.top, to.width, to.height]);

  return (
    <div
      ref={ref}
      className="flying-piece"
      style={{
        position: 'fixed',
        left: style.left,
        top: style.top,
        width: style.width,
        height: style.height,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: running ? `left ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1), top ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1), width ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1), height ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
        borderRadius: '50%',
        overflow: 'hidden',
        // mild drop shadow for depth
        boxShadow: '0 6px 16px rgba(0,0,0,0.35)'
      }}
      onTransitionEnd={() => {
        // This event fires once per transitioned property; guard to call once
        if (doneRef.current) return;
        doneRef.current = true;
        onDone?.();
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
          transform: 'scale(var(--piece-scale))',
          transformOrigin: 'center center',
        }}
        draggable={false}
      />
    </div>
  );
}

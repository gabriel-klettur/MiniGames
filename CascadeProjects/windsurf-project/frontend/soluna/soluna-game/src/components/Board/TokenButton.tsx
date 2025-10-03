import React from 'react';
import type { CSSProperties } from 'react';
import type { Tower } from '../../game/types';
import { SymbolIcon } from '../Icons';
import TokenStack from './TokenStack';

interface TokenButtonProps {
  tower: Tower;
  className: string;
  style: CSSProperties;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

export default function TokenButton({
  tower: t,
  className,
  style,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: TokenButtonProps) {
  return (
    <button
      className={className}
      data-symbol={t.top}
      data-height={t.height}
      data-id={t.id}
      style={style}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      title={`h:${t.height} · top:${t.top}`}
    >
      <div className="token-inner">
        <TokenStack stack={t.stack} />
        <SymbolIcon type={t.top} />
        <div className="token-height">{t.height}</div>
      </div>
    </button>
  );
}

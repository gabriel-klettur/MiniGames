import React, { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { loadCfgLS } from '../../DevTools/UIUX/model/config';

export interface VsAiPopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  selectedSide: 1 | 2 | null;
  onSelectSide: (side: 1 | 2) => void;
  onPickDifficulty: (d: number) => void;
}

export const VsAiPopover: React.FC<VsAiPopoverProps> = ({
  anchorRect,
  popRef,
  selectedSide,
  onSelectSide,
  onPickDifficulty,
}) => {
  // Local state from UI/UX config (persisted in LS and broadcast via event)
  const [showDifficultyInPopovers, setShowDifficultyInPopovers] = useState<boolean>(() => {
    const cfg = loadCfgLS();
    return cfg.showDifficultyInPopovers ?? true;
  });
  const [defaultDifficulty, setDefaultDifficulty] = useState<number>(() => {
    const cfg = loadCfgLS();
    const d = cfg.defaultDifficulty ?? 10;
    return Math.min(30, Math.max(1, d));
  });

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (!detail) return;
        if (typeof detail.showDifficultyInPopovers === 'boolean') {
          setShowDifficultyInPopovers(detail.showDifficultyInPopovers);
        }
        if (typeof detail.defaultDifficulty === 'number') {
          const d = detail.defaultDifficulty;
          setDefaultDifficulty(Math.min(30, Math.max(1, d)));
        }
      } catch {}
    };
    window.addEventListener('soluna:ui:cfg-updated', handler as EventListener);
    return () => window.removeEventListener('soluna:ui:cfg-updated', handler as EventListener);
  }, []);

  return (
    <div
      id="vsai-popover"
      ref={popRef}
      className="popover vsai-popover"
      role="dialog"
      aria-label="Configurar partida vs IA"
      style={{
        position: 'fixed',
        top: anchorRect ? anchorRect.bottom + 8 : 8,
        right: 8,
      }}
    >
      <div className="vsai-section" aria-label="Seleccionar lado">
        <div className="vsai-title">VS</div>
        <div className="vsai-options" role="listbox" aria-label="Lado enemigo">
          <button
            className={selectedSide === 1 ? 'active' : ''}
            onClick={() => onSelectSide(1)}
            aria-selected={selectedSide === 1}
          >
            <span>Jugador 1</span>
          </button>
          <button
            className={selectedSide === 2 ? 'active' : ''}
            onClick={() => onSelectSide(2)}
            aria-selected={selectedSide === 2}
          >
            <span>Jugador 2</span>
          </button>
        </div>
      </div>
      <div className="vsai-section" aria-label="Seleccionar dificultad">
        <div className="vsai-title">Dificultad</div>
        {showDifficultyInPopovers ? (
          <>
            <div className="vsai-diffs" role="listbox" aria-label="Nivel de dificultad">
              {[10,11,12,13,14,15,16,17,18,19].map((d) => (
                <button
                  key={d}
                  onClick={() => onPickDifficulty(d)}
                  disabled={!selectedSide}
                  title={selectedSide ? `Comenzar vs IA (nivel ${d})` : 'Elige un lado primero'}
                >{d}</button>
              ))}
            </div>
            <div className="vsai-hint">El juego comienza tras elegir dificultad.</div>
          </>
        ) : (
          <>
            <div className="vsai-hint">Se usará la dificultad por defecto configurada en DevTools.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>Nivel:</strong> {defaultDifficulty}</span>
              <button
                className="btn btn-primary"
                onClick={() => onPickDifficulty(defaultDifficulty)}
                disabled={!selectedSide}
                title={selectedSide ? `Comenzar vs IA (nivel ${defaultDifficulty})` : 'Elige un lado primero'}
              >Comenzar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VsAiPopover;

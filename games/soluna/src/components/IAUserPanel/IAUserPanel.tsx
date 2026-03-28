import { useEffect, useLayoutEffect, useState } from 'react';
import type { IAUserPanelProps } from './IAUserPanel.types';
import './IAUserPanel.css';
import DepthSelect from './DepthSelect';
import PlayerToggleButton from './PlayerToggleButton';
import RobotIcon from './RobotIcon';
import { loadCfgLS } from '../DevTools/UIUX/model/config';

/**
 * IAUserPanel (Soluna): Controles principales de IA para el usuario (Mover IA,
 * dificultad) colocados bajo el Header. La configuración de tiempo se deja
 * para un panel avanzado (DevTools IAPanel) si se desea.
 */
export default function IAUserPanel(props: IAUserPanelProps) {
  const {
    depth,
    onChangeDepth,
    onAIMove,
    disabled = false,
    aiControlP1 = false,
    aiControlP2 = false,
    onToggleAiControlP1,
    onToggleAiControlP2,
    busy = false,
  } = props;

  // Read difficulty UI visibility and default value from UI/UX config
  const [showDifficultyInPopovers, setShowDifficultyInPopovers] = useState<boolean>(() => {
    const cfg = loadCfgLS();
    return cfg.showDifficultyInPopovers ?? true;
  });
  const [defaultDifficulty, setDefaultDifficulty] = useState<number>(() => {
    const cfg = loadCfgLS();
    const d = cfg.defaultDifficulty ?? 10;
    return Math.min(30, Math.max(1, d));
  });

  // Subscribe to UI/UX cfg changes
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

  // When difficulty controls are hidden, ensure depth equals defaultDifficulty
  // useLayoutEffect ensures this syncs immediately after DOM mutations, reducing test flakiness.
  useLayoutEffect(() => {
    if (!showDifficultyInPopovers && typeof defaultDifficulty === 'number') {
      if (depth !== defaultDifficulty) {
        onChangeDepth(defaultDifficulty);
      }
    }
  }, [showDifficultyInPopovers, defaultDifficulty, depth, onChangeDepth]);

  // Also enforce on initial mount based on LS, in case state hydration/order differs in tests
  useLayoutEffect(() => {
    try {
      const cfg = loadCfgLS();
      const visible = cfg.showDifficultyInPopovers ?? true;
      const d = Math.min(30, Math.max(1, cfg.defaultDifficulty ?? 10));
      if (!visible && depth !== d) {
        onChangeDepth(d);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel small iauser-panel" aria-label="Controles de IA (usuario)">
      <div className="row actions iauser-inline" aria-label="Dificultad y acciones de IA">
        {showDifficultyInPopovers && (
          <DepthSelect depth={depth} onChangeDepth={onChangeDepth} />
        )}
        <div className="iauser-right">
          {/* Toggle IA controla P1 */}
          <PlayerToggleButton label="P1" active={aiControlP1} onClick={onToggleAiControlP1} />
          {/* Toggle IA controla P2 */}
          <PlayerToggleButton label="P2" active={aiControlP2} onClick={onToggleAiControlP2} />
          {/* Acción principal: Mover IA */}
          <button
            className={["ia-move-btn", busy ? "is-busy" : ""].join(" ")}
            onClick={onAIMove}
            disabled={disabled || busy}
            aria-pressed={busy}
          >
            <RobotIcon className="robot-icon" size={18} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

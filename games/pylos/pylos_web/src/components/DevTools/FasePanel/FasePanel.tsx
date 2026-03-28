import type { GameState } from '../../../game/types';
import { useI18n } from '../../../i18n';

export interface FasePanelProps {
  state: GameState;
  gameOverText?: string;
}

/**
 * FasePanel: muestra la fase actual y una breve descripción contextual.
 * Se usa dentro del Sidebar y se controla con el toggle "Dev".
 */
function FasePanel({ state, gameOverText }: FasePanelProps) {
  const { t } = useI18n();
  const { phase, recovery } = state;

  const info: string = (() => {
    if (gameOverText) return gameOverText;
    if (phase === 'recover') {
      const remaining = recovery?.remaining ?? 0;
      const minReq = recovery?.minRequired ?? 0;
      const minReqText = minReq > 0 ? t.fasePanel.recoverAtLeast : t.fasePanel.recoverUpTo;
      return t.fasePanel.recover.replace('{minReq}', minReqText).replace('{remaining}', String(remaining));
    }
    if (phase === 'selectMoveDest') return t.fasePanel.selectMoveDest;
    return t.fasePanel.defaultInfo;
  })();

  return (
    <div className="panel small" aria-label={t.fasePanel.title}>
      <div className="row"><strong>{t.fasePanel.phase}:</strong> {phase}</div>
      <div className="row info">{info}</div>
    </div>
  );
}

export default FasePanel;

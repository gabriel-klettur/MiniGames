import { useI18n } from '../../../i18n';

export interface RulesPanelProps {
  className?: string;
}

/**
 * RulesPanel: panel pequeño y reutilizable que muestra las reglas clave del juego.
 * Presentacional puro; no maneja estado.
 */
function RulesPanel({ className }: RulesPanelProps) {
  const { t } = useI18n();
  return (
    <div className={["panel", "small", className ?? ""].join(" ").trim()}>
      <p>{t.rulesPanel.title}</p>
      <ul>
        <li>{t.rulesPanel.rule1}</li>
        <li>{t.rulesPanel.rule2}</li>
        <li>{t.rulesPanel.rule3}</li>
        <li>{t.rulesPanel.rule4}</li>
      </ul>
    </div>
  );
}

export default RulesPanel;

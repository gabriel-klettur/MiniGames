export interface RulesPanelProps {
  className?: string;
}

/**
 * RulesPanel: panel pequeño y reutilizable que muestra las reglas clave del juego.
 * Presentacional puro; no maneja estado.
 */
function RulesPanel({ className }: RulesPanelProps) {
  return (
    <div className={["panel", "small", className ?? ""].join(" ").trim()}>
      <p>Reglas clave:</p>
      <ul>
        <li>Coloca en casillas soportadas (2x2 abajo).</li>
        <li>Para mover, solo subir niveles y pieza debe estar libre.</li>
        <li>Formar cuadrado propio permite recuperar 1–2 piezas libres.</li>
        <li>También puntúan las líneas (4 abajo, 3 en segundo nivel).</li>
      </ul>
    </div>
  );
}

export default RulesPanel;

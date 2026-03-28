export interface RulesPanelProps {
  className?: string;
}

/**
 * RulesPanel — Muestra un resumen de las reglas de Quoridor. Presentacional puro.
 */
export default function RulesPanel({ className }: RulesPanelProps) {
  return (
    <div className={["rounded-lg", "border", "border-white/10", "bg-gray-900/50", "p-4", className ?? ""].join(" ").trim()}>
      <h3 className="text-base font-semibold mb-2">Reglas (resumen)</h3>
      <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
        <li>Tablero de 9×9 casillas.</li>
        <li>Objetivo: alcanzar la fila opuesta a tu punto de partida.</li>
        <li>Movimiento: 1 casilla ortogonal (arriba, abajo, izquierda, derecha).</li>
        <li>Salto: si los peones se enfrentan sin valla entre ellos, puedes saltar al otro lado.</li>
        <li>Vallas: se colocan entre pares de casillas y bloquean dos aristas.</li>
        <li>Siempre debe existir un camino hacia la meta para ambos jugadores.</li>
        <li>Las vallas no se mueven ni se retiran tras colocarlas.</li>
      </ul>
    </div>
  );
}


import Button from '../../../ui/Button';

export type TabKey = 'repeats' | 'sim' | 'charts' | 'books';

export default function HeaderTabs({ activeTab, onChangeTab }: { activeTab: TabKey; onChangeTab: (t: TabKey) => void }) {
  const labels: Record<TabKey, string> = { repeats: 'Repeats', sim: 'Sim', charts: 'Charts', books: 'Books' };
  const tips: Record<TabKey, string> = {
    repeats: 'Repeats — Vista para detectar jugadas y patrones repetidos. Ejemplo: detectar que la IA repite P3 en apertura y ajustar heurística/ordenación.',
    sim: 'Sim — Configura partidas automáticas, límites y opciones del motor. Ejemplo: 20 partidas con profundidad=5 y quiescence activado.',
    charts: 'Charts — Compara datasets por duración, NPS, depth, etc. Ejemplo: comparar build A vs build B en 100 partidas.',
    books: 'Books — Espacio para futuras aperturas/guías. Ejemplo: listas de líneas fuertes iniciales para evaluar.',
  };
  return (
    <div className="flex items-center gap-1" role="tablist" aria-label="Pestañas InfoIA">
      {(['repeats','sim','charts','books'] as TabKey[]).map((t) => (
        <Button
          key={t}
          size="sm"
          variant={activeTab === t ? 'primary' : 'neutral'}
          pressed={activeTab === t}
          onClick={() => onChangeTab(t)}
          aria-selected={activeTab === t}
          role="tab"
          title={tips[t]}
        >
          {labels[t]}
        </Button>
      ))}
    </div>
  );
}

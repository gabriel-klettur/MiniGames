import Button from '../../../ui/Button';

export type TabKey = 'repeats' | 'sim' | 'charts' | 'books';

export default function HeaderTabs({ activeTab, onChangeTab }: { activeTab: TabKey; onChangeTab: (t: TabKey) => void }) {
  const labels: Record<TabKey, string> = { repeats: 'Repeats', sim: 'Sim', charts: 'Charts', books: 'Books' };
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
          title={labels[t]}
        >
          {labels[t]}
        </Button>
      ))}
    </div>
  );
}

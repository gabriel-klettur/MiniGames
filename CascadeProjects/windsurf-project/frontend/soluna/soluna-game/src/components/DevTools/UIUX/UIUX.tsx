import { useUIUXConfig } from './hooks/useUIUXConfig';
import { Tabs, type TabItem } from './components/Tabs';
import { AnimationsTab } from './tabs/AnimationsTab';
import { PiecesTab } from './tabs/PiecesTab';
import { IndicatorsTab } from './tabs/IndicatorsTab';

export default function UIUX() {
  const { cfg, onNum, reset, logMerges, setLogMerges } = useUIUXConfig();

  const tabs: TabItem[] = [
    {
      id: 'animaciones',
      label: 'Animaciones',
      render: () => <AnimationsTab cfg={cfg} onNum={onNum} />,
    },
    {
      id: 'fichas',
      label: 'Fichas',
      render: () => (
        <>
          <PiecesTab cfg={cfg} onNum={onNum} />
        </>
      ),
    },
    {
      id: 'indicadores',
      label: 'Indicadores',
      render: () => <IndicatorsTab logMerges={logMerges} onToggleLog={setLogMerges} />,
      rightAddon: (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={reset}
          title="Restablecer valores por defecto"
          aria-label="Restablecer valores por defecto"
        >
          Default
        </button>
      ),
    },
  ];

  return (
    <section style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 'none', flex: '1 1 auto' }}>      
      <div style={{ width: '100%' }}>
        <Tabs items={tabs} initialId="animaciones" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={reset}>Restablecer</button>
      </div>
    </section>
  );
}


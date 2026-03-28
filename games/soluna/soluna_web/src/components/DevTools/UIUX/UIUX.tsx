import { useUIUXConfig } from './hooks/useUIUXConfig';
import { Tabs, type TabItem } from './components/Tabs';
import { AnimationsTab } from './tabs/AnimationsTab';
import { PiecesTab } from './tabs/PiecesTab';
import { DifficultyTab } from './tabs/DifficultyTab';

export default function UIUX() {
  const { cfg, onNum } = useUIUXConfig();

  const tabs: TabItem[] = [
    {
      id: 'animaciones',
      label: 'Animaciones',
      render: () => <AnimationsTab cfg={cfg} onNum={onNum} />,
      tooltip: 'Ajustes de vuelo y efectos de animación (aterrizaje y teletransporte)'
    },
    {
      id: 'fichas',
      label: 'Fichas',
      render: () => (
        <>
          <PiecesTab cfg={cfg} onNum={onNum} />
        </>
      ),
      tooltip: 'Parámetros de apilado y colisión de fichas'
    },
    {
      id: 'dificultad',
      label: 'Dificultad',
      render: () => <DifficultyTab cfg={cfg} onNum={onNum} />,
      tooltip: 'Control de dificultad por defecto y visibilidad en los popovers'
    },
  ];

  return (
    <section style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 'none', flex: '1 1 auto' }}>      
      <div style={{ width: '100%' }}>
        <Tabs items={tabs} initialId="animaciones" />
      </div>
    </section>
  );
}


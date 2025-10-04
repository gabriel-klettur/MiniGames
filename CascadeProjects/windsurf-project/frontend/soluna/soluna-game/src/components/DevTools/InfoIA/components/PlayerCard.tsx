import type { FC } from 'react';
import DifficultyTime from '../views/Controls/DifficultyTime';
import StartSettings from '../views/Controls/StartSettings';
import BookSettings from '../views/Controls/BookSettings';
import HeuristicSettings from '../views/Controls/HeuristicSettings';
import PersistenceSettings from '../views/Controls/PersistenceSettings';
import RepetitionSettings from '../views/Controls/RepetitionSettings';
import AntiStallSettings from '../views/Controls/AntiStallSettings';
import Card from './ui/Card';
import Section from './ui/Section';
import type { PlayerControlsProps } from '../types';

const PlayerCard: FC<PlayerControlsProps> = ({ title, depth, onChangeDepth, timeMode, onChangeTimeMode, timeSeconds, onChangeTimeSeconds }) => {
  return (
    <Card title={title}>
      <Section title="Dificultad y tiempo">
        <DifficultyTime
          depth={depth}
          onDepthChange={onChangeDepth}
          timeMode={timeMode}
          onTimeModeChange={onChangeTimeMode}
          timeSeconds={timeSeconds}
          onTimeSecondsChange={onChangeTimeSeconds}
        />
      </Section>
      <Section title="Inicio y semilla"><StartSettings /></Section>
      <Section title="Libro (opcional)"><BookSettings /></Section>
      <Section title="Heurística (diagnóstico)"><HeuristicSettings /></Section>
      <Section title="Repetición y penalización"><RepetitionSettings /></Section>
      <Section title="Persistencia y filtros"><PersistenceSettings /></Section>
      <Section title="Anti-estancamiento"><AntiStallSettings /></Section>
    </Card>
  );
};

export default PlayerCard;

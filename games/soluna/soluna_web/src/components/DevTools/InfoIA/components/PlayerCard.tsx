import type { FC } from 'react';
import DifficultyTime from '../views/Controls/DifficultyTime';
import Card from './ui/Card';
import Section from './ui/Section';
import type { PlayerControlsProps } from '../types';
import PlayerEngineOptions from '../views/Controls/PlayerEngineOptions';

const PlayerCard: FC<PlayerControlsProps> = ({ title, depth, onChangeDepth, timeMode, onChangeTimeMode, timeSeconds, onChangeTimeSeconds, ...engine }) => {
  return (
    <Card
      title={(
        <>
          <span>{title}</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {/* Presets dropdown — extensible para más presets en el futuro */}
            {engine.presetOptions && engine.onChangePreset && (
              <label
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title={(() => {
                  const sel = engine.presetOptions?.find(o => o.key === (engine.presetSelectedKey || ''));
                  if (!sel || !sel.description) return 'Selecciona una configuración por defecto para este jugador';
                  return sel.description;
                })()}
              >
                <span className="kpi kpi--muted">Preset</span>
                <select
                  value={engine.presetSelectedKey || ''}
                  onChange={(e) => engine.onChangePreset && engine.onChangePreset(e.target.value)}
                  aria-label="Preset de IA por jugador"
                >
                  <option value="">(ninguno)</option>
                  {engine.presetOptions.map((opt) => (
                    <option key={opt.key} value={opt.key} title={opt.description || ''}>{opt.label}</option>
                  ))}
                </select>
                <span aria-hidden="true" style={{ opacity: 0.85 }}>ℹ️</span>
              </label>
            )}
          </div>
        </>
      )}
    >
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
      <Section title="Motor IA (por jugador)">
        <PlayerEngineOptions
          disabled={typeof engine.onToggleEnableTT !== 'function'}
          enableTT={engine.enableTT}
          onToggleEnableTT={engine.onToggleEnableTT}
          failSoft={engine.failSoft}
          onToggleFailSoft={engine.onToggleFailSoft}
          preferHashMove={engine.preferHashMove}
          onTogglePreferHashMove={engine.onTogglePreferHashMove}
          enableKillers={engine.enableKillers}
          onToggleEnableKillers={engine.onToggleEnableKillers}
          enableHistory={engine.enableHistory}
          onToggleEnableHistory={engine.onToggleEnableHistory}
          enablePVS={engine.enablePVS}
          onToggleEnablePVS={engine.onToggleEnablePVS}
          enableAspiration={engine.enableAspiration}
          onToggleEnableAspiration={engine.onToggleEnableAspiration}
          aspirationDelta={engine.aspirationDelta}
          onChangeAspirationDelta={engine.onChangeAspirationDelta}
          enableQuiescence={engine.enableQuiescence}
          onToggleEnableQuiescence={engine.onToggleEnableQuiescence}
          quiescenceDepth={engine.quiescenceDepth}
          onChangeQuiescenceDepth={engine.onChangeQuiescenceDepth}
          quiescenceHighTowerThreshold={engine.quiescenceHighTowerThreshold}
          onChangeQuiescenceHighTowerThreshold={engine.onChangeQuiescenceHighTowerThreshold}
          enableLMR={engine.enableLMR}
          onToggleEnableLMR={engine.onToggleEnableLMR}
          lmrMinDepth={engine.lmrMinDepth}
          onChangeLmrMinDepth={engine.onChangeLmrMinDepth}
          lmrLateMoveIdx={engine.lmrLateMoveIdx}
          onChangeLmrLateMoveIdx={engine.onChangeLmrLateMoveIdx}
          lmrReduction={engine.lmrReduction}
          onChangeLmrReduction={engine.onChangeLmrReduction}
          enableFutility={engine.enableFutility}
          onToggleEnableFutility={engine.onToggleEnableFutility}
          futilityMargin={engine.futilityMargin}
          onChangeFutilityMargin={engine.onChangeFutilityMargin}
          enableLMP={engine.enableLMP}
          onToggleEnableLMP={engine.onToggleEnableLMP}
          lmpDepthThreshold={engine.lmpDepthThreshold}
          onChangeLmpDepthThreshold={engine.onChangeLmpDepthThreshold}
          lmpLateMoveIdx={engine.lmpLateMoveIdx}
          onChangeLmpLateMoveIdx={engine.onChangeLmpLateMoveIdx}
          enableNullMove={engine.enableNullMove}
          onToggleEnableNullMove={engine.onToggleEnableNullMove}
          nullMoveReduction={engine.nullMoveReduction}
          onChangeNullMoveReduction={engine.onChangeNullMoveReduction}
          nullMoveMinDepth={engine.nullMoveMinDepth}
          onChangeNullMoveMinDepth={engine.onChangeNullMoveMinDepth}
        />
      </Section>
    </Card>
  );
};

export default PlayerCard;

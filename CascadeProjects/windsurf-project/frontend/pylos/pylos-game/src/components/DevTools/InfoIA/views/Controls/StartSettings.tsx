import { useI18n } from '../../../../../i18n';

export function StartSettings(props: {
  startRandom: boolean;
  onStartRandomChange: (v: boolean) => void;
  seedInput: string;
  onSeedInputChange: (v: string) => void;
  earlyRandom?: number;
  onEarlyRandomChange?: (n: number) => void;
}) {
  const { t } = useI18n();
  const { startRandom, onStartRandomChange, seedInput, onSeedInputChange, earlyRandom, onEarlyRandomChange } = props;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            id="infoia-start-rand"
            type="checkbox"
            checked={startRandom}
            onChange={(e) => onStartRandomChange(e.target.checked)}
            aria-checked={startRandom}
            title={t.infoIA.randomFirstMoveTitle}
          />
          <label htmlFor="infoia-start-rand">{t.infoIA.randomFirstMove}</label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 72px 12px max-content 120px',
            columnGap: 8,
            rowGap: 6,
            alignItems: 'center'
          }}
        >
          <label className="label" htmlFor="infoia-start-early" style={{ justifySelf: 'end' }} title={t.infoIA.nRandomTitle}>{t.infoIA.nRandom}</label>
          <input
            id="infoia-start-early"
            className="field-num"
            type="number"
            min={0}
            max={10}
            step={1}
            value={Math.max(0, Math.min(10, Number.isFinite(earlyRandom as number) ? Number(earlyRandom) : 2))}
            onChange={(e) => onEarlyRandomChange?.(Math.max(0, Math.min(10, Math.floor(Number(e.target.value))))) }
            style={{ width: 72 }}
            title={t.infoIA.nRandomExample}
          />

          <label className="label" htmlFor="infoia-start-seed" style={{ justifySelf: 'end' }} title={t.infoIA.seedTitle}>{t.infoIA.seed}</label>
          <input
            id="infoia-start-seed"
            className="field-num"
            type="number"
            placeholder={t.infoIA.seedPlaceholder}
            value={seedInput}
            onChange={(e) => onSeedInputChange(e.target.value)}
            style={{ width: 120 }}
            disabled={!startRandom}
            title={t.infoIA.seedInputTitle}
          />
        </div>
      </div>
    </>
  );
}

import { useI18n } from '../../../../../i18n';

export function PersistenceSettings(props: {
  noProgressLimit: number;
  onNoProgressLimitChange: (v: number) => void;
  avoidStepFactor: number;
  onAvoidStepFactorChange: (v: number) => void;
  persistAntiLoopsEnabled: boolean;
  onPersistAntiLoopsEnabledChange: (v: boolean) => void;
  halfLifeDays: number;
  onHalfLifeDaysChange: (v: number) => void;
  persistCap: number;
  onPersistCapChange: (v: number) => void;
}) {
  const { t } = useI18n();
  const {
    noProgressLimit, onNoProgressLimitChange,
    avoidStepFactor, onAvoidStepFactorChange,
    persistAntiLoopsEnabled, onPersistAntiLoopsEnabledChange,
    halfLifeDays, onHalfLifeDaysChange,
    persistCap, onPersistCapChange,
  } = props;

  return (
    <>
      <label className="label" htmlFor="infoia-noprog" title={t.infoIA.noProgressPliesTitle}>{t.infoIA.noProgressPlies}</label>
      <input id="infoia-noprog" className="field-num" type="number" min={10} max={400} value={noProgressLimit} onChange={(e) => onNoProgressLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-avoidstep" title={t.infoIA.penaltyFactorTitle}>{t.infoIA.penaltyFactor}</label>
      <input id="infoia-avoidstep" className="field-num" type="number" min={0} max={2} step={0.1} value={avoidStepFactor} onChange={(e) => onAvoidStepFactorChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-persist" title={t.infoIA.persistAntiLoopsTitle}>{t.infoIA.persistAntiLoops}</label>
      <input id="infoia-persist" type="checkbox" checked={persistAntiLoopsEnabled} onChange={(e) => onPersistAntiLoopsEnabledChange(e.target.checked)} aria-checked={persistAntiLoopsEnabled} />

      <label className="label" htmlFor="infoia-halflife" title={t.infoIA.halfLifeDaysTitle}>{t.infoIA.halfLifeDays}</label>
      <input id="infoia-halflife" className="field-num" type="number" min={1} max={90} value={halfLifeDays} onChange={(e) => onHalfLifeDaysChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-cap" title={t.infoIA.persistCapTitle}>{t.infoIA.persistCap}</label>
      <input id="infoia-cap" className="field-num" type="number" min={50} max={2000} value={persistCap} onChange={(e) => onPersistCapChange(Number(e.target.value))} style={{ width: 100 }} />
    </>
  );
}

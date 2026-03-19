import { useI18n } from '../../../../../i18n';

export function RepetitionSettings(props: {
  repeatMax: number;
  onRepeatMaxChange: (v: number) => void;
  avoidPenalty: number;
  onAvoidPenaltyChange: (v: number) => void;
}) {
  const { t } = useI18n();
  const { repeatMax, onRepeatMaxChange, avoidPenalty, onAvoidPenaltyChange } = props;
  return (
    <>
      <label className="label" htmlFor="infoia-repeatmax" title={t.infoIA.repeatMaxTitle}>{t.infoIA.repeatMax}</label>
      <input id="infoia-repeatmax" className="field-num" type="number" min={1} max={10} value={repeatMax} onChange={(e) => onRepeatMaxChange(Number(e.target.value))} style={{ width: 90 }} title={t.infoIA.repeatMaxInputTitle} />

      <label className="label" htmlFor="infoia-avoidpen" title={t.infoIA.avoidLoopsTitle}>{t.infoIA.avoidLoops}</label>
      <input id="infoia-avoidpen" className="field-num" type="number" min={0} max={500} value={avoidPenalty} onChange={(e) => onAvoidPenaltyChange(Number(e.target.value))} style={{ width: 110 }} title={t.infoIA.avoidLoopsInputTitle} />
    </>
  );
}

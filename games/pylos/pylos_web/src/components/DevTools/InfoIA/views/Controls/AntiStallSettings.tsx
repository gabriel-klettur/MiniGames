import { useI18n } from '../../../../../i18n';

export function AntiStallSettings(props: {
  noveltyBonus: number;
  onNoveltyBonusChange: (v: number) => void;
  drawBias: number;
  onDrawBiasChange: (v: number) => void;
  timeRiskEnabled: boolean;
  onTimeRiskEnabledChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const {
    noveltyBonus, onNoveltyBonusChange,
    drawBias, onDrawBiasChange,
    timeRiskEnabled, onTimeRiskEnabledChange,
  } = props;

  return (
    <>
      <label className="label" htmlFor="infoia-novbonus" title={t.infoIA.noveltyBonusTitle}>{t.infoIA.noveltyBonus}</label>
      <input id="infoia-novbonus" className="field-num" type="number" min={0} max={50} value={noveltyBonus} onChange={(e) => onNoveltyBonusChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-drawbias" title={t.infoIA.drawBiasTitle}>{t.infoIA.drawBias}</label>
      <input id="infoia-drawbias" className="field-num" type="number" min={0} max={50} value={drawBias} onChange={(e) => onDrawBiasChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-timerisk" title={t.infoIA.timeRiskSensitiveTitle}>{t.infoIA.timeRiskSensitive}</label>
      <input id="infoia-timerisk" type="checkbox" checked={timeRiskEnabled} onChange={(e) => onTimeRiskEnabledChange(e.target.checked)} aria-checked={timeRiskEnabled} />
    </>
  );
}

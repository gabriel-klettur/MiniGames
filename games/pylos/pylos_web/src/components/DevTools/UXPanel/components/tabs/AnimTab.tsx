import { useI18n } from '../../../../../i18n';

export interface AnimTabProps {
  appearMs: number;
  flashMs: number;
  flyMs: number;
  autoFillDelayMs: number;
  onChangeAppearMs: (v: number) => void;
  onChangeFlashMs: (v: number) => void;
  onChangeFlyMs: (v: number) => void;
  onChangeAutoFillDelayMs: (v: number) => void;
}

export default function AnimTab(props: AnimTabProps) {
  const { t } = useI18n();
  const { appearMs, flashMs, flyMs, autoFillDelayMs, onChangeAppearMs, onChangeFlashMs, onChangeFlyMs, onChangeAutoFillDelayMs } = props;
  return (
    <div role="tabpanel" id="panel-anim" aria-labelledby="tab-anim" className="tabs__panel">
      <div className="row">
        <h4 style={{ margin: '4px 0' }}>{t.uxPanel.animationSpeed}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label className="label">{t.uxPanel.pieceAppear}</label>
          <input type="number" min={50} max={4000} step={10} value={Number.isFinite(appearMs) ? appearMs : 280} onChange={(e) => onChangeAppearMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.cellFlash}</label>
          <input type="number" min={50} max={5000} step={10} value={Number.isFinite(flashMs) ? flashMs : 900} onChange={(e) => onChangeFlashMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.pieceFly}</label>
          <input type="number" min={50} max={6000} step={10} value={Number.isFinite(flyMs) ? flyMs : 1500} onChange={(e) => onChangeFlyMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.autoPlacePause}</label>
          <input type="number" min={0} max={5000} step={10} value={Number.isFinite(autoFillDelayMs) ? autoFillDelayMs : 250} onChange={(e) => onChangeAutoFillDelayMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />
        </div>
      </div>
    </div>
  );
}

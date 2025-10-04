import { CheckboxRow } from '../components/Rows';

export function IndicatorsTab({ logMerges, onToggleLog }: { logMerges: boolean; onToggleLog: (checked: boolean) => void }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <CheckboxRow
        label="Registrar fusiones en consola"
        checked={logMerges}
        onChange={(e) => onToggleLog(e.target.checked)}
      />
    </div>
  );
}

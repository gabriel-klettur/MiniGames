import type { AIAdvancedConfig } from '../../types';

export interface BookSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function BookSettings({ iaConfig, onChangeIaConfig }: BookSettingsProps) {
  return (
    <>
      <label>Libro de aperturas</label>
      <div>
        <input id="ia-book" type="checkbox" checked={iaConfig.bookEnabled} onChange={(e) => onChangeIaConfig({ bookEnabled: e.target.checked })} />
        <label htmlFor="ia-book" style={{ marginLeft: 6 }}>Activado</label>
      </div>

      <label>URL del libro</label>
      <div>
        <input
          id="ia-book-url"
          type="text"
          value={iaConfig.bookUrl}
          onChange={(e) => onChangeIaConfig({ bookUrl: e.target.value })}
          placeholder="/aperturas_book.json"
          style={{ width: 260 }}
        />
      </div>
    </>
  );
}


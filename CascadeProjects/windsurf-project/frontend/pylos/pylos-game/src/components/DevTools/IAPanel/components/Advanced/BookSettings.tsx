import type { AIAdvancedConfig } from '../../types';

export interface BookSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function BookSettings({ iaConfig, onChangeIaConfig }: BookSettingsProps) {
  const mode = iaConfig.bookMode ?? 'auto';
  const phase = iaConfig.bookPhase ?? 'aperturas';
  const basePath = iaConfig.bookBasePath ?? '/books';
  return (
    <>
      <label>Libro de aperturas</label>
      <div>
        <input id="ia-book" type="checkbox" checked={iaConfig.bookEnabled} onChange={(e) => onChangeIaConfig({ bookEnabled: e.target.checked })} />
        <label htmlFor="ia-book" style={{ marginLeft: 6 }}>Activado</label>
      </div>

      <label>Modo</label>
      <div>
        <select
          id="ia-book-mode"
          value={mode}
          onChange={(e) => onChangeIaConfig({ bookMode: e.target.value as any })}
        >
          <option value="auto">Automático (según profundidad)</option>
          <option value="manual">Manual (URL)</option>
        </select>
      </div>

      {mode === 'auto' && (
        <>
          <label>Fase</label>
          <div>
            <select
              id="ia-book-phase"
              value={phase}
              onChange={(e) => onChangeIaConfig({ bookPhase: e.target.value as any })}
            >
              <option value="aperturas">Aperturas</option>
              <option value="medio">Medio juego</option>
              <option value="cierres">Cierres</option>
            </select>
          </div>
          <label>Ruta base</label>
          <div>
            <input
              id="ia-book-base"
              type="text"
              value={basePath}
              onChange={(e) => onChangeIaConfig({ bookBasePath: e.target.value })}
              placeholder="/books"
              style={{ width: 260 }}
            />
          </div>
        </>
      )}

      {mode === 'manual' && (
        <>
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
      )}
    </>
  );
}


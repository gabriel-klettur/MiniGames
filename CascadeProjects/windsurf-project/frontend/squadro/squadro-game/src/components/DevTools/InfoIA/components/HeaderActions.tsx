import React, { useRef } from 'react';
import Button from '../../../ui/Button';

interface HeaderActionsProps {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefaults: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportCSVDetails: () => void;
  onExportJSONL?: () => void;
  onImportFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
}

export default function HeaderActions(props: HeaderActionsProps) {
  const { running, onStart, onStop, onDefaults, onExportJSON, onExportCSV, onExportCSVDetails, onExportJSONL, onImportFiles, onClearAll } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="infoia__actions flex items-center flex-wrap gap-2">
      {!running ? (
        <Button size="sm" variant="primary" onClick={onStart} title="Iniciar simulación — Ejecuta N partidas según los límites actuales. Ejemplo: con Partidas=10 y Presets configurados por jugador, correrá 10 partidas y guardará estadísticas y detalles por jugada." aria-label="Iniciar simulación">
          <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
            <path d="M8 5v14l11-7-11-7Z" fill="currentColor"/>
          </svg>
          Start
        </Button>
      ) : (
        <Button size="sm" variant="danger" onClick={onStop} title="Detener simulación — Interrumpe la ejecución en curso tras finalizar la jugada actual. Útil para cortar pruebas largas sin perder los resultados ya acumulados." aria-label="Detener simulación">
          <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
            <path d="M6 6h12v12H6z" fill="currentColor"/>
          </svg>
          Stop
        </Button>
      )}
      <Button size="sm" variant="neutral" onClick={onDefaults} title="Restaurar valores por defecto — Reestablece profundidad, tiempos y toggles de motor a sus valores iniciales. Ejemplo: vuelve a profundidad=3, tiempo=Auto y heurísticas base.">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M4 4v6h6M20 20a8 8 0 1 1-5.657-13.657L16 8" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Defaults
      </Button>
      <Button size="sm" variant="neutral" onClick={onExportJSON} title="Exportar resultados JSON — Exporta el dataset agregado de partidas (cabecera y detalles por jugada) en formato JSON. Ejemplo: útil para cargar y comparar en otra sesión o equipo.">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Export JSON
      </Button>
      {onExportJSONL && (
        <Button size="sm" variant="neutral" onClick={onExportJSONL} title="Exportar JSONL — Exporta líneas por partida y por jugada en formato NDJSON (JSON Lines) para entrenamiento y análisis incremental.">
          <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          Export JSONL
        </Button>
      )}
      <Button size="sm" variant="neutral" onClick={onExportCSV} title="Exportar CSV — Exporta un CSV resumido (una fila por partida) con duración, ganador, profundidad, etc. Ejemplo: rápido para análisis en hoja de cálculo.">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M4 9h16M9 4v16" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Export CSV
      </Button>
      <Button size="sm" variant="neutral" onClick={onExportCSVDetails} title="Exportar CSV (detallado) — Exporta un CSV con una fila por jugada incluyendo profundidad alcanzada, nodos, NPS, score y tiempos. Ejemplo: ideal para analizar rendimiento por iteración.">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M4 9h16M9 4v16M13 13h5" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Export CSV+
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        multiple
        onChange={onImportFiles}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <Button
        size="sm"
        variant="neutral"
        onClick={() => { try { fileInputRef.current?.click(); } catch {} }}
        title="Importar datasets JSON — Carga datasets exportados previamente para comparación en la pestaña Charts. Ejemplo: compara el rendimiento entre commits/configuraciones distintas."
        aria-label="Importar archivos JSON"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Importar
      </Button>
      <Button size="sm" variant="outline" onClick={onClearAll} title="Borrar resultados — Elimina los registros locales guardados en IndexedDB. Ejemplo: limpia el historial antes de un nuevo experimento para evitar mezclar datasets.">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M6 7h12M9 7v10m6-10v10M10 4h4l1 2H9l1-2Z" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Limpiar
      </Button>
    </div>
  );
}

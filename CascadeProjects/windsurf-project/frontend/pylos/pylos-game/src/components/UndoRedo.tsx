import React from 'react';

export interface UndoRedoProps {
  canUndo: boolean;
  onUndo: () => void;
  showFinishRecovery: boolean;
  onFinishRecovery: () => void;
}

/**
 * UndoRedo — Presentational component for board action buttons (Undo and Finish Recovery).
 * Mirrors the markup and accessibility attributes used previously in App.tsx.
 */
const UndoRedo: React.FC<UndoRedoProps> = ({ canUndo, onUndo, showFinishRecovery, onFinishRecovery }) => {
  return (
    <div className="panel board-actions" role="group" aria-label="Acciones del tablero">
      <div className="row actions">
        <button
          className="undo-btn"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Deshacer última jugada"
          title="Deshacer"
        >
          <svg className="header-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M11 5 4 12l7 7v-4h5a4 4 0 0 0 0-8h-5V5z" />
          </svg>
          <span className="sr-only">Deshacer</span>
        </button>
        {showFinishRecovery && (
          <div style={{ marginLeft: 'auto', display: 'inline-flex' }}>
            <button
              className="finish-recovery"
              onClick={onFinishRecovery}
              aria-label="Terminar recuperación"
              title="Terminar recuperación"
            >
              <svg className="header-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                {/* Bola tachada: usa currentColor para heredar el blanco del botón */}
                <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.12" />
                <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth={1.8} />
                <path d="M5 19 L19 5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UndoRedo;


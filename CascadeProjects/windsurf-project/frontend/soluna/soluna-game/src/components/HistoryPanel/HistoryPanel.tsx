import React from 'react';
import type { MoveEntry, FinishedGameRecord } from '../../hooks/useSolunaHistory';
import MoveLog from './MoveLog';
import StoredGames from './StoredGames';

export interface HistoryPanelProps {
  visible: boolean;
  moves: MoveEntry[];
  className?: string;
  finishedGames?: FinishedGameRecord[];
  onDownload?: () => void;
  onClear?: () => void;
}

/**
 * HistoryPanel — contenedor del historial actual y partidas archivadas.
 * Es una envoltura ligera con flag de visibilidad para mantener limpio App.tsx.
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({ visible, moves, className, finishedGames = [], onDownload, onClear }) => {
  if (!visible) return null;
  return (
    <div className={className}>
      <MoveLog moves={moves} onDownload={onDownload} onClear={onClear} hasArchive={finishedGames.length > 0} />
      {finishedGames.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <StoredGames games={finishedGames} />
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;

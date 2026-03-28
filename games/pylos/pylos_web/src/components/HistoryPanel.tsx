import React from 'react';
import MoveLog from './MoveLog';
import type { MoveEntry, FinishedGameRecord } from '../hooks/usePersistence';
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
 * HistoryPanel — thin presentational wrapper around MoveLog with a visibility flag.
 * Keeps App.tsx cleaner by moving the conditional rendering here.
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

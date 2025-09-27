import React from 'react';
import MoveLog from './MoveLog';
import type { MoveEntry } from '../hooks/usePersistence';

export interface HistoryPanelProps {
  visible: boolean;
  moves: MoveEntry[];
  className?: string;
}

/**
 * HistoryPanel — thin presentational wrapper around MoveLog with a visibility flag.
 * Keeps App.tsx cleaner by moving the conditional rendering here.
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({ visible, moves, className }) => {
  if (!visible) return null;
  return (
    <div className={className}>
      <MoveLog moves={moves} />
    </div>
  );
};

export default HistoryPanel;

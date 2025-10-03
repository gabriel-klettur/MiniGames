import React from 'react';
import RobotIcon from './RobotIcon';

interface PlayerToggleButtonProps {
  label: 'P1' | 'P2';
  active: boolean;
  onClick?: () => void;
}

const PlayerToggleButton: React.FC<PlayerToggleButtonProps> = ({ label, active, onClick }) => {
  const badgeClass = label === 'P1' ? 'p1' : 'p2';
  return (
    <button onClick={onClick} aria-pressed={active} aria-label={label} className="ia-toggle-btn">
      <span className={`ia-badge ${badgeClass}`} aria-hidden="true">{label}</span>
      <RobotIcon className={[
        'robot-icon',
        active ? 'active' : 'inactive',
      ].join(' ')} size={14} aria-hidden />
    </button>
  );
};

export default PlayerToggleButton;

import React from 'react';
import styles from '../AssetsPopover.module.css';

export interface ToggleButtonProps {
  label: string;
  title?: string;
  pressed?: boolean;
  onClick: () => void;
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  title,
  pressed,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      title={title}
      className={[styles.toggleButton, className].filter(Boolean).join(' ')}
    >
      {label}
    </button>
  );
};

export default ToggleButton;

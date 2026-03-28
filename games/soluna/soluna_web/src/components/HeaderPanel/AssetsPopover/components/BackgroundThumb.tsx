import React from 'react';
import styles from '../AssetsPopover.module.css';

export interface BackgroundThumbProps {
  url: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}

export const BackgroundThumb: React.FC<BackgroundThumbProps> = ({ url, name, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-selected={selected}
      title={name}
      className={[styles.bgThumb, selected ? styles.bgThumbSelected : ''].join(' ').trim()}
      style={{ backgroundImage: `url('${url}')` }}
    />
  );
};

export default BackgroundThumb;

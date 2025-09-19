import React from 'react';

export interface StatusBarProps {
  text: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ text }) => {
  return <div className="status">{text}</div>;
};

export default React.memo(StatusBar);

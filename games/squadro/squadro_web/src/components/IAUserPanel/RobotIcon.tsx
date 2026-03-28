import React from 'react';

interface RobotIconProps {
  className?: string;
  size?: number;
  "aria-hidden"?: boolean | "true" | "false";
}

const RobotIcon: React.FC<RobotIconProps> = ({ className, size = 14, ...rest }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...rest}
  >
    <path fill="currentColor" d="M11 2h2v3h-2z"/>
    <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
    <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
    <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
    <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
  </svg>
);

export default RobotIcon;

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// Simple emoji-based icons that are compatible with React 19
export const Calendar: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Calendar"
  >
    📅
  </span>
);

export const Clock: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Clock"
  >
    🕒
  </span>
);

export const Bell: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Bell"
  >
    🔔
  </span>
);

export const User: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="User"
  >
    👤
  </span>
);

export const FileText: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="File Text"
  >
    📝
  </span>
);

export const AlertCircle: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Alert Circle"
  >
    ⚠️
  </span>
);

export const X: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Close"
  >
    ❌
  </span>
);

export const Filter: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Filter"
  >
    🗂️
  </span>
);

export const ChevronLeft: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Chevron Left"
  >
    ◀️
  </span>
);

export const ChevronRight: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Chevron Right"
  >
    ▶️
  </span>
);

export const Home: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Home"
  >
    🏠
  </span>
);

export const Settings: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Settings"
  >
    ⚙️
  </span>
);

export const LogOut: React.FC<IconProps> = ({ size = 24, className = '', color = 'currentColor' }) => (
  <span 
    className={className} 
    style={{ fontSize: `${size}px`, color, display: 'inline-flex', alignItems: 'center' }}
    role="img" 
    aria-label="Log Out"
  >
    🚪
  </span>
);

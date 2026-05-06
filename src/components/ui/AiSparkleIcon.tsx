import React from 'react';

interface AiSparkleIconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Premium AI Sparkle icon with a + accent.
 * Designed to match the Car Safety SaaS brand — 
 * a four-pointed star/sparkle with a small plus at top-right.
 */
const AiSparkleIcon: React.FC<AiSparkleIconProps> = ({
  className = '',
  size = 24,
  color = 'currentColor',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    {/* Main 4-pointed sparkle */}
    <path
      d="M12 2C12 2 14.5 8.5 12 12C9.5 8.5 12 2 12 2Z"
      fill={color}
      opacity="0.15"
    />
    <path
      d="M12 3.5
         C12.35 5.8 13.8 9.2 15.5 11
         C17.2 12.8 20 13.65 21.5 13.5
         C20 13.85 17.2 14.7 15.5 16.5
         C13.8 18.3 12.35 21.2 12 23
         C11.65 21.2 10.2 18.3 8.5 16.5
         C6.8 14.7 4 13.85 2.5 13.5
         C4 13.65 6.8 12.8 8.5 11
         C10.2 9.2 11.65 5.8 12 3.5Z"
      fill={color}
      stroke={color}
      strokeWidth="0.5"
      strokeLinejoin="round"
    />

    {/* Small plus (+) accent — top-right */}
    <line x1="19" y1="3" x2="19" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="17" y1="5" x2="21" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default AiSparkleIcon;

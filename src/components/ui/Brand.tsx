import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  variant?: 'flat' | 'gradient' | 'symbol';
  showBackground?: boolean;
}

/**
 * CarxAI Premium Logo Mark
 */
export const Logo: React.FC<LogoProps> = ({ 
  size = 32, 
  className = "", 
  variant = 'flat',
  showBackground = true
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0080FF"/>
            <stop offset="100%" stopColor="#005BB5"/>
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#002A66" floodOpacity="0.25"/>
          </filter>
        </defs>
      )}

      {showBackground && (
        <rect 
          width="512" 
          height="512" 
          rx="115" 
          fill={variant === 'gradient' ? "url(#brandGrad)" : "#0070E0"}
        />
      )}
      
      <g filter={variant === 'gradient' ? "url(#softShadow)" : undefined}>
        <path 
          d="M 410 185 A 160 160 0 1 0 410 327" 
          stroke="#FFFFFF" 
          strokeWidth="125" 
          strokeLinecap="round" 
          fill="none"
        />
        <circle cx="256" cy="256" r="95" fill="#FFFFFF"/>
      </g>
    </svg>
  );
};

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  light?: boolean;
}

/**
 * CarxAI Refined Wordmark
 * 
 * Consistent geometry, tight kerning, and premium Inter-based typography.
 */
export const Wordmark: React.FC<WordmarkProps> = ({ 
  size = 'md', 
  className = "",
  light = false 
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl'
  };

  return (
    <span className={`font-sans font-bold tracking-[-0.05em] select-none ${sizeClasses[size]} ${light ? 'text-white' : 'text-on-surface'} ${className}`}>
      car<span className="text-[#0070E0]">x</span>ai
    </span>
  );
};

interface LockupProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  light?: boolean;
  variant?: 'flat' | 'gradient';
}

/**
 * Combined Logo + Wordmark Branding
 */
export const BrandLockup: React.FC<LockupProps> = ({ 
  size = 'md', 
  className = "",
  light = false,
  variant = 'flat'
}) => {
  const logoSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`rounded-[25%] overflow-hidden shadow-lg shadow-navy/10`}>
        <Logo size={logoSizes[size]} variant={variant} />
      </div>
      <Wordmark size={size} light={light} />
    </div>
  );
};

export default Logo;

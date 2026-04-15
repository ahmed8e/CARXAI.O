import React, { useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface InteractiveMenuItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

export interface InteractiveMenuProps {
  items: InteractiveMenuItem[];
  accentColor?: string;
}

const defaultAccentColor = 'var(--component-active-color-default)';

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Find active index based on current path
  const activeIndex = useMemo(() => {
    const index = items.findIndex(item => {
        if (item.to === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(item.to);
    });
    return index !== -1 ? index : 0;
  }, [items, location.pathname]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeTextElement = textRefs.current[activeIndex];
      const activeItemElement = itemRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    // Small delay to ensure refs are populated after route change
    const timer = setTimeout(setLineWidth, 50);

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
      clearTimeout(timer);
    };
  }, [activeIndex, items]);

  const navStyle = useMemo(() => {
      const activeColor = accentColor || defaultAccentColor;
      return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]); 

  return (
    <nav
      className="menu"
      role="navigation"
      style={navStyle}
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
            ref={(el) => { itemRefs.current[index] = el; }}
          >
            <div className="menu__icon">
              <IconComponent className="icon" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <strong
              className={`menu__text ${isActive ? 'active' : ''}`}
              ref={(el) => { textRefs.current[index] = el; }}
            >
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};

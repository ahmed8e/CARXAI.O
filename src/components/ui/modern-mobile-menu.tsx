import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';

type IconComponentType = React.ElementType<{ className?: string }>;
export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  to?: string;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
}

const defaultItems: InteractiveMenuItem[] = [
    { label: 'home', icon: Home, to: '/dashboard' },
    { label: 'strategy', icon: Briefcase, to: '/dashboard/strategy' },
    { label: 'period', icon: Calendar, to: '/dashboard/calendar' },
    { label: 'security', icon: Shield, to: '/dashboard/security' },
    { label: 'settings', icon: Settings, to: '/my-account' },
];

const defaultAccentColor = 'var(--component-active-color-default)';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor }) => {
  const location = useLocation();

  const finalItems = useMemo(() => {
     const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
     if (!isValid) {
        return defaultItems;
     }
     return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Sync active state with route
  useEffect(() => {
    const currentIndex = finalItems.findIndex(item => {
      if (!item.to) return false;
      if (item.to === "/dashboard") return location.pathname === "/dashboard";
      return location.pathname.startsWith(item.to);
    });
    if (currentIndex !== -1) setActiveIndex(currentIndex);
  }, [location.pathname, finalItems]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

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
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;

        const IconComponent = item.icon;

        return (
          <Link
            key={item.label}
            to={item.to || '#'}
            className={`menu__item ${isActive ? 'active' : ''}`}
            ref={(el) => { itemRefs.current[index] = el; }}
            style={{ '--lineWidth': '0px' } as React.CSSProperties} 
          >
            <div className="menu__icon">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`menu__text ${isActive ? 'active' : ''}`}
              ref={(el) => { textRefs.current[index] = el; }}
            >
              {item.label}
            </strong>
          </Link>
        );
      })}
    </nav>
  );
};

export {InteractiveMenu}

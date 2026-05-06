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

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items }) => {
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

  return (
    <nav
      className="menu"
      role="navigation"
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.label}
            to={item.to || '#'}
            className={`menu__item ${isActive ? 'active' : ''}`}
          >
            <div className="menu__icon">
              <IconComponent className="icon" />
            </div>
            <strong className={`menu__text ${isActive ? 'active' : ''}`}>
              {item.label}
            </strong>
          </Link>
        );
      })}
    </nav>
  );
};

export {InteractiveMenu}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CircuitBoard, 
  MapPin, 
  Car, 
  Settings 
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  id: number;
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const items: NavItem[] = [
  { id: 0, icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { id: 1, icon: CircuitBoard, label: "AI Mechanic", path: "/dashboard/ai-mechanic" },
  { id: 2, icon: Car, label: "Vehicles", path: "/dashboard/vehicles" },
  { id: 3, icon: MapPin, label: "Help Map", path: "/dashboard/map" },
  { id: 4, icon: Settings, label: "Settings", path: "/my-account" },
];

export function FuturisticNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  // Sync active state with route
  useEffect(() => {
    const currentIndex = items.findIndex(item => {
      if (item.path === "/dashboard") return location.pathname === "/dashboard";
      return location.pathname.startsWith(item.path);
    });
    setActive(currentIndex);
  }, [location.pathname]);

  const handleNavigate = (path: string, index: number) => {
    setActive(index);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4 pointer-events-none">
      <div className="relative flex items-center justify-between gap-1 bg-white/95 backdrop-blur-2xl rounded-[24px] px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-200/60 pointer-events-auto overflow-hidden">
        
        {/* Subtle Active Indicator Pillar (Simplified from flashy glow) */}
        <motion.div
          layoutId="active-indicator"
          className="absolute w-12 h-1 bg-[#0070E0] rounded-full bottom-1"
          animate={{
            left: `calc(${(active * (100 / items.length)) + (100 / items.length / 2)}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 35 }}
        />

        {items.map((item, index) => {
          const isActive = index === active;
          const Icon = item.icon;

          return (
            <motion.div key={item.id} className="relative flex flex-col items-center flex-1 group">
              <motion.button
                onClick={() => handleNavigate(item.path, index)}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                }}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-2xl transition-all relative z-10",
                  isActive 
                    ? "text-[#0070E0]" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.button>

              {/* Minimal Text Label (Only shows on active or hover) */}
              <AnimatePresence>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute -bottom-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#0070E0] pointer-events-none"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

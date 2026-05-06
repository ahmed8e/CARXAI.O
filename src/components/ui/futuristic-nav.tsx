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

  // Detect if we are in the chat screen to apply "Secondary" styling
  const isChat = location.pathname.includes("/dashboard/ai-mechanic");

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
    <motion.div 
      initial={false}
      animate={{ 
        y: isChat ? 8 : 0,
        scale: isChat ? 0.94 : 1,
        opacity: isChat ? 0.9 : 1
      }}
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[60] w-full max-w-[320px] px-4 pointer-events-none"
    >
      <div className={cn(
        "relative flex items-center justify-between gap-1 bg-white/95 backdrop-blur-2xl rounded-[22px] px-2 transition-all duration-500 pointer-events-auto overflow-hidden",
        isChat 
          ? "py-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-slate-200/30" 
          : "py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-slate-200/50 border"
      )}>
        
        {/* Subtle Active Indicator Pillar */}
        <motion.div
          layoutId="active-indicator"
          className={cn(
            "absolute bg-[#0070E0] rounded-full bottom-1",
            isChat ? "w-8 h-[1.5px]" : "w-10 h-0.5"
          )}
          animate={{
            left: `calc(${(active * (100 / items.length)) + (100 / items.length / 2)}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 40 }}
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
                  scale: isActive ? (isChat ? 1.05 : 1.1) : 1,
                }}
                className={cn(
                  "flex items-center justify-center rounded-xl transition-all relative z-10",
                  isChat ? "w-8 h-8" : "w-10 h-10",
                  isActive 
                    ? "text-[#0070E0]" 
                    : isChat ? "text-slate-300 hover:text-slate-400" : "text-slate-400 hover:text-slate-500"
                )}
              >
                <Icon size={isChat ? 18 : 20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.button>

              {/* Minimal Text Label - Hidden in Chat Mode */}
              <AnimatePresence>
                {isActive && !isChat && (
                  <motion.span 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute -bottom-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-[#0070E0] pointer-events-none"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

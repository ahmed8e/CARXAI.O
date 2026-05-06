"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Car, 
  Wrench,
  ShieldCheck,
  Settings 
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  id: number;
  icon: any;
  label: string;
  path: string;
}

const items: NavItem[] = [
  { id: 0, icon: Car, label: "Garage", path: "/dashboard/vehicles" },
  { id: 1, icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { id: 2, icon: Wrench, label: "Maintenance", path: "/dashboard/maintenance" },
  { id: 3, icon: ShieldCheck, label: "Price Check", path: "/dashboard/avoid-overpaying" },
  { id: 4, icon: Settings, label: "Settings", path: "/my-account" },
];

export function FuturisticNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(1);

  // Sync active state with route
  useEffect(() => {
    const currentIndex = items.findIndex(item => {
      if (item.path === "/dashboard") return location.pathname === "/dashboard";
      return location.pathname.startsWith(item.path);
    });
    if (currentIndex !== -1) setActive(currentIndex);
  }, [location.pathname]);

  const handleNavigate = (path: string, index: number) => {
    setActive(index);
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none flex justify-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white/40 backdrop-blur-3xl border border-white/40 rounded-[32px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto overflow-hidden"
      >
        <div className="relative flex items-center justify-between gap-1">
          {items.map((item, index) => {
            const isActive = index === active;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path, index)}
                className="relative flex flex-col items-center flex-1 py-1.5 group outline-none"
              >
                {/* Active Indicator Pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-blue-500/10 border border-blue-500/10 rounded-2xl z-0"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    animate={{ 
                      y: isActive ? -1 : 0,
                      scale: isActive ? 1.1 : 1
                    }}
                    className={cn(
                      "transition-colors duration-300",
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest mt-1.5 transition-colors duration-300",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {item.label}
                  </span>
                </div>

                {/* Subtle active glow point */}
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

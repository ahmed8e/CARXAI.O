"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Alert01Icon,
  DashboardSquare01Icon,
  BatteryCharging01Icon,
  FuelStationIcon,
  ActivityIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router-dom";

const SYMPTOMS = [
  {
    id: "shakes-braking",
    label: "Car shakes when braking",
    icon: ActivityIcon,
    image: "/symptoms/Car shakes when braking.webp",
    description: "Is it warped rotors or something else? Learn the signs.",
    slug: "/guides/symptoms/car-shakes-when-braking",
  },
  {
    id: "smell-gas",
    label: "Why does my car smell like gas?",
    icon: FuelStationIcon,
    image: "/symptoms/smell-gas.webp",
    description: "A critical safety check for fuel leaks and more.",
    slug: "/guides/symptoms/car-smells-like-gas",
  },
  {
    id: "wont-crank",
    label: "Car won’t crank",
    icon: Settings01Icon,
    image: "/symptoms/wont-crank.webp",
    description: "Nothing happens when you turn the key? Start here.",
    slug: "/guides/starting-battery/car-wont-crank",
  },
  {
    id: "abs-light",
    label: "ABS light is on",
    icon: Alert01Icon,
    image: "/symptoms/ABS light is on.webp",
    description: "Understanding anti-lock system failure and safety.",
    slug: "/guides/warning-lights/abs-light",
  },
  {
    id: "oil-light",
    label: "Oil light on dashboard",
    icon: DashboardSquare01Icon,
    image: "/symptoms/oil-light.webp",
    description: "Why you should stop driving immediately.",
    slug: "/guides/warning-lights/oil-light-in-car",
  },
  {
    id: "lights-work-no-start",
    label: "Car won’t start but lights work",
    icon: BatteryCharging01Icon,
    image: "/symptoms/lights-work-no-start.webp",
    description: "Differentiating battery issues from starter failure.",
    slug: "/guides/starting-battery/wont-start-but-lights-come-on",
  },
];

const AUTO_PLAY_INTERVAL = 4000;
const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function SymptomCarousel() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const currentIndex =
    ((step % SYMPTOMS.length) + SYMPTOMS.length) % SYMPTOMS.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + SYMPTOMS.length) % SYMPTOMS.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  const handleCardClick = (slug: string) => {
    navigate(slug);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = SYMPTOMS.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2.5rem] lg:rounded-[4rem] flex flex-col lg:flex-row min-h-[600px] lg:aspect-video border border-slate-200/60 shadow-2xl bg-white">
        
        {/* Left Sidebar: Navigation Chips */}
        <div className="w-full lg:w-[40%] min-h-[350px] md:min-h-[450px] lg:h-full relative z-30 flex flex-col items-start justify-center overflow-hidden px-8 md:px-16 lg:pl-16 bg-[#0070E0]">
          {/* Gradient Fades for Scrolling Effect */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0070E0] to-transparent z-40" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0070E0] to-transparent z-40" />
          
          <div className="relative w-full h-full flex items-center justify-center lg:justify-start z-20">
            {SYMPTOMS.map((symptom, index) => {
              const isActive = index === currentIndex;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(
                -(SYMPTOMS.length / 2),
                SYMPTOMS.length / 2,
                distance
              );

              return (
                <motion.div
                  key={symptom.id}
                  style={{
                    height: ITEM_HEIGHT,
                    width: "fit-content",
                  }}
                  animate={{
                    y: wrappedDistance * ITEM_HEIGHT,
                    opacity: 1 - Math.abs(wrappedDistance) * 0.3,
                    scale: isActive ? 1 : 0.9,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                  className="absolute flex items-center justify-start"
                >
                  <button
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      "relative flex items-center gap-4 px-6 md:px-8 py-3.5 rounded-full transition-all duration-500 text-left group border whitespace-nowrap",
                      isActive
                        ? "bg-white text-[#0070E0] border-white z-10 shadow-lg"
                        : "bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center transition-colors duration-500",
                        isActive ? "text-[#0070E0]" : "text-white/40"
                      )}
                    >
                      <HugeiconsIcon
                        icon={symptom.icon}
                        size={18}
                        strokeWidth={2}
                      />
                    </div>

                    <span className="font-bold text-xs md:text-sm tracking-tight uppercase">
                      {symptom.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Interactive Visual Cards */}
        <div className="flex-1 min-h-[500px] md:min-h-[600px] lg:h-full relative bg-slate-50 flex items-center justify-center py-16 px-6 overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-100">
          <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
            {SYMPTOMS.map((symptom, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <motion.div
                  key={symptom.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -120 : isNext ? 120 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.85 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                    rotate: isPrev ? -5 : isNext ? 5 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className={cn(
                    "absolute inset-0 rounded-[2.5rem] overflow-hidden border-8 border-white bg-white shadow-2xl cursor-pointer group/card",
                    isActive && "ring-1 ring-slate-200"
                  )}
                  onClick={() => isActive && handleCardClick(symptom.slug)}
                >
                  <img
                    src={symptom.image}
                    alt={symptom.label}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-1000",
                      isActive
                        ? "grayscale-0 blur-0 scale-100"
                        : "grayscale blur-[4px] brightness-75 scale-110"
                    )}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 p-8 pt-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end pointer-events-none"
                      >
                        <div className="bg-[#0070E0] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-lg mb-3">
                          Guide {index + 1}
                        </div>
                        <h3 className="text-white font-bold text-2xl leading-tight mb-2 tracking-tight">
                          {symptom.label}
                        </h3>
                        <p className="text-white/80 font-medium text-sm leading-relaxed drop-shadow-sm">
                          {symptom.description}
                        </p>
                        
                        <div className="mt-6 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/card:translate-y-0">
                          Read Full Guide <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">→</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Top Badge */}
                  <div
                    className={cn(
                      "absolute top-8 left-8 flex items-center gap-2.5 transition-opacity duration-500",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]" />
                    <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em]">
                      Diagnostic Library
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SymptomCarousel;

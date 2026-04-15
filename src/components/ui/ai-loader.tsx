import { cn } from "@/lib/utils";

interface AILoaderProps {
  className?: string;
  text?: string;
}

export const AILoader = ({ className, text = "Generating" }: AILoaderProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="relative group">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-navy/20 blur-2xl animate-pulse-slow" />
        
        {/* Loader Core */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="loader-wrapper relative w-24 h-24 flex items-center justify-center">
            {/* Spinning Automotive Tech Ring */}
            <div className="absolute inset-0 border-[3px] border-navy/10 rounded-full" />
            <div className="absolute inset-0 border-[3px] border-t-navy border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-fast shadow-[0_0_15px_rgba(0,112,224,0.5)]" />
            <div className="absolute inset-4 border border-navy-light/30 rounded-full animate-pulse" />
            
            {/* Inner Scanning Bar */}
            <div className="loader w-12 h-1 bg-navy/40 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-navy animate-scan shadow-[0_0_10px_#0070E0]" />
            </div>
          </div>

          {/* Sequential Text Animation */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-navy/5 rounded-full border border-navy/10">
            <div className="flex">
              {text.split("").map((letter, i) => (
                <span
                  key={i}
                  className="loader-letter text-[11px] font-black uppercase tracking-widest text-navy"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {letter}
                </span>
              ))}
            </div>
            {/* Animated Dots */}
            <div className="flex gap-0.5 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-navy/40 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-navy/40 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-navy/40 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Review {
  name: string;
  car: string;
  rating: number;
  text: string;
  image?: string;
  date: string;
}

interface ReviewsSliderProps {
  reviews: Review[];
}

export default function ReviewsSlider({ reviews }: ReviewsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentIndex]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = reviews.length - 1;
      if (nextIndex >= reviews.length) nextIndex = 0;
      return nextIndex;
    });
  };

  // On desktop we show 2, on mobile we show 1
  const visibleReviews = isMobile 
    ? [reviews[currentIndex]] 
    : [reviews[currentIndex], reviews[(currentIndex + 1) % reviews.length]];

  return (
    <div 
      className="relative max-w-6xl mx-auto px-6 overflow-visible"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-20 flex items-center justify-between w-[calc(100%+32px)] md:w-[calc(100%+96px)] pointer-events-none">
        <button
          onClick={() => { paginate(-1); setIsAutoPlaying(false); }}
          className="w-12 h-12 rounded-full bg-white border border-overlay shadow-lg flex items-center justify-center text-muted hover:text-navy hover:border-navy/20 transition-all pointer-events-auto active:scale-90"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => { paginate(1); setIsAutoPlaying(false); }}
          className="w-12 h-12 rounded-full bg-white border border-overlay shadow-lg flex items-center justify-center text-muted hover:text-navy hover:border-navy/20 transition-all pointer-events-auto active:scale-90"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slider Content */}
      <div className="relative min-h-[400px] flex items-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 50) paginate(-1);
              else if (info.offset.x < -50) paginate(1);
              setIsAutoPlaying(false);
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 cursor-grab active:cursor-grabbing"
          >
            {visibleReviews.map((rev, idx) => (
              <ReviewCard key={`${currentIndex}-${idx}`} review={rev} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-3 mt-12">
        {reviews.slice(0, isMobile ? reviews.length : Math.ceil(reviews.length / 1)).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === i ? 'w-8 bg-navy' : 'w-2 bg-navy/10 hover:bg-navy/30'}`}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const initial = review.name.charAt(0);
  const isLongText = review.text.length > 120;
  const displayText = isExpanded ? review.text : review.text.slice(0, 120) + (isLongText ? '...' : '');

  return (
    <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 md:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:border-navy/20 transition-all duration-500 flex flex-col h-full relative group overflow-hidden">
      {/* Top Section: User & Rating */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-navy/[0.04] border border-navy/10 flex items-center justify-center text-navy font-display font-black text-xl shadow-inner group-hover:bg-navy group-hover:text-white transition-all duration-300">
            {review.image ? (
              <img src={review.image} alt={review.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div>
            <h4 className="font-display font-black text-slate-900 leading-tight">{review.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-navy/60">{review.car}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.date}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-0.5 text-orange-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="flex-grow">
        <p className="text-slate-600 font-medium leading-relaxed italic">
          "{displayText}"
        </p>
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-[11px] font-black uppercase tracking-widest text-navy hover:text-navy/80 transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Subtle Bottom Accent */}
      <div className="absolute bottom-0 left-10 right-10 h-1 bg-gradient-to-r from-transparent via-navy/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

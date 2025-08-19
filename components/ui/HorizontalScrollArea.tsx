"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HorizontalScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  showButtons?: boolean; // Option to hide buttons if not needed
}

export const HorizontalScrollArea = ({
  children,
  className,
  buttonClassName,
  showButtons = true,
}: HorizontalScrollAreaProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      handleScroll(); // Initial check
      el.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll);
      return () => {
        el.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [handleScroll, children]); // Re-run effect if children change (e.g., new items loaded)

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8; // Scroll 80% of visible width
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className={cn("flex gap-4 overflow-x-auto pb-4 no-scrollbar", className)}
      >
        {children}
      </div>
      {showButtons && (canScrollLeft || canScrollRight) && (
        <div className={cn("mt-4 hidden items-center justify-center md:flex", buttonClassName)}>
          <Button variant="ghost" size="icon" onClick={() => scroll('left')} disabled={!canScrollLeft} aria-label="Scroll left">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="w-24 h-1 mx-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <Button variant="ghost" size="icon" onClick={() => scroll('right')} disabled={!canScrollRight} aria-label="Scroll right">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
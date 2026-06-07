import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TabScrollerProps {
  children: React.ReactNode;
  className?: string;
}

export function TabScroller({ children, className = "" }: TabScrollerProps) {
  const ref        = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", sync); ro.disconnect(); };
  }, [sync]);

  function scroll(dir: "left" | "right") {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        aria-hidden={!canLeft}
        className={`shrink-0 w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 ${
          canLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Scrollable track — no visible scrollbar */}
      <div
        ref={ref}
        className="flex-1 flex gap-1 overflow-x-auto mx-1"
        style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
      >
        {children}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        aria-hidden={!canRight}
        className={`shrink-0 w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 ${
          canRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

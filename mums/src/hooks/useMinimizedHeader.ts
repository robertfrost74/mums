"use client";

import { useEffect, useState } from "react";

export function useMinimizedHeader(options?: { minimizeAt?: number }) {
  const minimizeAt = options?.minimizeAt ?? 60;
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setMinimized(y > minimizeAt);
          ticking = false;
        });
        ticking = true;
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [minimizeAt]);

  return { minimized };
}
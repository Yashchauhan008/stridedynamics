"use client";

import { useEffect } from "react";

/** Publishes the scroll position as --sy on <html> so CSS can drive parallax. */
export default function ScrollVars() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const set = () => { document.documentElement.style.setProperty("--sy", String(Math.min(window.scrollY, 1600))); raf = 0; };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(set); };
    set();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}

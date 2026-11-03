"use client";

import { useEffect } from "react";

/** Publishes the scroll position as --sy on the hero so CSS can drive its parallax. */
export default function ScrollVars() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;
    // only write while the hero is still on screen, and only on the hero (not <html>) so the whole page isn't restyled each scroll
    const set = () => { raf = 0; const y = window.scrollY; if (y < window.innerHeight * 1.2) hero.style.setProperty("--sy", String(y)); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(set); };
    set();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}

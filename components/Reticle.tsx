"use client";

import { useEffect, useRef } from "react";

/** Targeting reticle that eases toward the cursor inside its parent (hidden on touch). */
export default function Reticle() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current!;
    const parent = node.parentElement!;
    if (window.matchMedia("(hover: none)").matches) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, inside = false;
    const move = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!inside) { x = tx; y = ty; inside = true; node.classList.add("on"); }
    };
    const leave = () => { inside = false; node.classList.remove("on"); };
    const tick = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      node.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(tick);
    };
    parent.addEventListener("pointermove", move);
    parent.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); parent.removeEventListener("pointermove", move); parent.removeEventListener("pointerleave", leave); };
  }, []);

  return (
    <div ref={el} className="reticle" aria-hidden="true">
      <svg viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="22" />
        <path d="M40 4v18M40 58v18M4 40h18M58 40h18" />
        <circle className="pip" cx="40" cy="40" r="2.5" />
      </svg>
      <span>TRACKING</span>
    </div>
  );
}

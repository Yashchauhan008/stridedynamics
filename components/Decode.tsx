"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/_-+";

/** Text that "decodes" from noise into the real string once, on mount. */
export default function Decode({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [shown, setShown] = useState(text);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current!;
    el.style.minWidth = el.offsetWidth + "px"; // hold width so the layout doesn't jump
    let frame = 0;
    const total = 26;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        frame++;
        const reveal = Math.floor((frame / total) * text.length);
        setShown(
          text
            .split("")
            .map((c, i) => (c === " " || i < reveal ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join("")
        );
        if (frame >= total) { clearInterval(timer); setShown(text); }
      }, 38);
    }, delay);
    return () => { clearTimeout(start); clearInterval(timer); };
  }, [text, delay]);

  return (
    <span ref={box} className={className} style={{ display: "inline-block" }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

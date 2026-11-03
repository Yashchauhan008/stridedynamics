"use client";

import { Fragment, useEffect, useRef, type ElementType } from "react";

/** Headline whose words rise out of a mask one after another when scrolled into view. */
export default function RevealText({
  text,
  as: Tag = "h2",
  className = "",
  hl,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  hl?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const start = hl ? text.indexOf(hl) : -1;
  const parts = text.split(" ");
  const starts = parts.reduce<number[]>((acc, w, i) => (i === 0 ? [0] : [...acc, acc[i - 1] + parts[i - 1].length + 1]), []);
  const words = parts.map((w, i) => {
    const on = start >= 0 && starts[i] >= start && starts[i] < start + (hl as string).length;
    return (
      <Fragment key={i}>
        <span className="w" aria-hidden="true">
          <span className={`wi ${on ? "hl" : ""}`} style={{ ["--i" as string]: i, ["--d" as string]: `${delay}ms` }}>{w}</span>
        </span>{" "}
      </Fragment>
    );
  });

  return (
    <Tag ref={ref} className={`rt ${className}`} aria-label={text}>
      {words}
    </Tag>
  );
}

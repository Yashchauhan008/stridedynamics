"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const LINKS = [
  { key: "simulation", label: "Simulation", href: "/#simulation" },
  { key: "how", label: "How it works", href: "/#how" },
  { key: "features", label: "Features", href: "/#features" },
  { key: "technology", label: "Technology", href: "/#technology" },
  { key: "careers", label: "Careers", href: "/careers" },
];
const MAIL = "info@stridedynamics.com";

/** Floating "island" navigation: scroll-spy highlight that slides between links. */
export default function Nav() {
  const path = usePathname();
  const [spy, setSpy] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; }, [open]);
  const list = useRef<HTMLUListElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  const active = path.startsWith("/careers") ? "careers" : path === "/" ? spy : null;

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      if (y < 200) setSpy(null);
      // hide while scrolling down, reveal on any scroll up (or near the top)
      if (Math.abs(y - last) > 6) {
        setHidden(y > 140 && y > last && !openRef.current);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    let io: IntersectionObserver | undefined;
    if (path === "/") {
      io = new IntersectionObserver(
        (es) => es.forEach((e) => e.isIntersecting && setSpy(e.target.id)),
        { rootMargin: "-40% 0px -55% 0px" }
      );
      LINKS.forEach((l) => {
        const el = document.getElementById(l.key);
        if (el) io!.observe(el);
      });
    }
    return () => { window.removeEventListener("scroll", onScroll); io?.disconnect(); };
  }, [path]);

  // slide the highlight pill under the active link
  useLayoutEffect(() => {
    const p = pill.current, ul = list.current;
    if (!p || !ul) return;
    const place = () => {
      const a = ul.querySelector<HTMLElement>(`[data-key="${active}"]`);
      if (!a) { p.style.opacity = "0"; return; }
      p.style.opacity = "1";
      p.style.left = a.offsetLeft + "px";
      p.style.width = a.offsetWidth + "px";
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  return (
    <header className={`island ${scrolled ? "scrolled" : ""} ${open ? "open" : ""} ${hidden ? "hide" : ""}`}>
      <Link href="/" className="brand" aria-label="Stride Dynamics home" onClick={() => setOpen(false)}>
        <Image src="/images/logo.png" alt="Stride Dynamics" width={150} height={44} priority />
      </Link>

      <nav aria-label="Primary" className="menu">
        <ul ref={list}>
          <span ref={pill} className="pill" aria-hidden="true" />
          {LINKS.map((l) => (
            <li key={l.key}>
              <Link href={l.href} data-key={l.key} className={`lnk ${active === l.key ? "on" : ""}`} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <a className="cta" href={`mailto:${MAIL}?subject=Request%20Demonstration`}>
        <span className="long">Request Demonstration</span>
        <span className="short">Request Demo</span>
      </a>
      <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <i /><i />
      </button>
    </header>
  );
}

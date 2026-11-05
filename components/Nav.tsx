"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/careers", label: "Careers" },
];

/**
 * Top bar modelled on the original site: transparent, full width, logo left,
 * "Home" / "Careers" on the right, current page in the accent colour.
 * Hides while scrolling down, comes back on any scroll up.
 */
export default function Nav() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      if (Math.abs(y - last.current) > 6) {
        setHidden(y > 140 && y > last.current);
        last.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`topbar ${scrolled ? "scrolled" : ""} ${hidden ? "hide" : ""}`}>
      <div className="topbar-in">
        <Link href="/" className="brand" aria-label="Stride Dynamics home">
          <Image src="/images/logo.png" alt="Stride Dynamics" width={150} height={44} priority />
        </Link>
        <nav aria-label="Primary">
          <ul>
            {LINKS.map((l) => {
              const on = l.href === "/" ? path === "/" : path.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

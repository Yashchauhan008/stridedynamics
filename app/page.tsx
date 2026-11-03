import Image from "next/image";
import Link from "next/link";
import FlightScene from "@/components/FlightScene";
import Reveal from "@/components/Reveal";
import RevealText from "@/components/RevealText";
import ScrollVars from "@/components/ScrollVars";
import { Header, Footer, MAIL } from "@/components/Chrome";

const FEATURES = [
  {
    title: "GNSS-Denied Ops",
    span: "wide",
    chips: [] as string[],
    text: "AI-powered vision-based navigation for operations in EW-congested areas.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="6" />
        <path d="M24 6v8M24 34v8M6 24h8M34 24h8" />
        <path className="strike" d="M8 8l32 32" />
      </svg>
    ),
  },
  {
    title: "Plug-and-Play",
    span: "narrow",
    chips: ["MAVLink", "NMEA", "PX4", "ArduPilot"],
    text: "Compatible with MAVLink and NMEA supporting firmware (PX4, ArduPilot).",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M17 8v10M31 8v10" />
        <path d="M12 18h24v8a12 12 0 0 1-24 0z" />
        <path d="M24 38v6" />
      </svg>
    ),
  },
  {
    title: "Platform Agnostic",
    span: "narrow",
    chips: ["Rotary", "Hybrid VTOL", "Fixed-wing"],
    text: "Designed to work across rotary, hybrid VTOL or fixed-wing UAVs.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="6" width="14" height="14" rx="2" />
        <rect x="28" y="6" width="14" height="14" rx="2" />
        <rect x="17" y="28" width="14" height="14" rx="2" />
        <path d="M13 20v4h22v-4M24 24v4" />
      </svg>
    ),
  },
  {
    title: "Integrated Unit",
    span: "wide",
    chips: [] as string[],
    text: "SWaP optimised. A fully integrated module with sensors and compute.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="8" y="14" width="32" height="20" rx="3" />
        <circle cx="17" cy="24" r="3" />
        <circle cx="31" cy="24" r="3" />
        <path d="M14 10v4M24 10v4M34 10v4M14 34v4M24 34v4M34 34v4" />
      </svg>
    ),
  },
];

const FLOW = [
  {
    n: "01",
    title: "GNSS is jammed",
    text: "In EW-congested areas, satellite navigation signals can be denied.",
    tone: "bad",
  },
  {
    n: "02",
    title: "Inertial drift builds",
    text: "Without an outside reference, dead-reckoning error keeps growing over time.",
    tone: "bad",
  },
  {
    n: "03",
    title: "Stride VPS holds position",
    text: "Vision-based navigation recognises the terrain below and keeps error bounded.",
    tone: "ok",
  },
];

export default function Home() {
  return (
    <>
      <ScrollVars />
      <Header />
      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <div className="hero-bg"><Image src="/images/terrain.png" alt="" fill priority sizes="100vw" className="hero-terrain" aria-hidden="true" /></div>
          <div className="hero-copy">
            <p className="eyebrow">Visual Positioning System</p>
            <RevealText as="h1" text="Navigate the modern battlefield" delay={150} />
            <p className="lead">
              AI-powered vision-based navigation that keeps UAVs on course where GNSS is denied, jammed or EW-congested.
            </p>
            <div className="cta-row">
              <a className="btn solid" href={`mailto:${MAIL}?subject=Request%20Demonstration`}>
                Request Demonstration
              </a>
              <a className="btn ghost" href="#simulation">See it in action</a>
            </div>
            <ul className="hero-tags" aria-label="Highlights">
              <li>GNSS-denied ops</li>
              <li>Plug-and-play</li>
              <li>Platform agnostic</li>
              <li>Integrated unit</li>
            </ul>
          </div>
          <a className="scroll-cue" href="#simulation" aria-label="Scroll to simulation"><span /></a>
        </section>

        {/* ---------- marquee ---------- */}
        <div className="marquee" aria-hidden="true">
          <div className="track">
            {[0, 1].map((k) => (
              <ul key={k}>
                {["GNSS-denied ops", "Plug-and-play", "Platform agnostic", "Integrated unit", "MAVLink", "NMEA", "PX4", "ArduPilot", "Rotary", "Hybrid VTOL", "Fixed-wing"].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* ---------- LIVE SIMULATION ---------- */}
        <section id="simulation" className="sim">
          <div className="sim-head">
            <p className="eyebrow">See it in action</p>
            <RevealText text="Follow one mission, step by step." />
          </div>
          <FlightScene />
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="section">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <RevealText text="When GNSS goes dark, navigation shouldn't." />
          </Reveal>
          <ol className="flow">
            {FLOW.map((f, i) => (
              <li key={f.n} className={f.tone}>
                <Reveal delay={i * 160} className="step">
                  <span className="dotn">{f.n}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- vision ---------- */}
        <section id="vision" className="section vision">
          <Image src="/images/terrain.png" alt="" width={1920} height={1080} className="terrain" aria-hidden="true" />
          <Reveal className="vision-inner">
            <p className="eyebrow">The vision</p>
            <RevealText as="p" className="statement" text="We are building the next generation of aerial robotics solutions from India." hl="aerial robotics solutions" />
            <p className="sub">
              Our vision is to enable resilience and autonomy for UAVs, and to make field-reliable robotics systems a global standard.
            </p>
          </Reveal>
        </section>

        {/* ---------- features ---------- */}
        <section id="features" className="section">
          <Reveal>
            <p className="eyebrow">Built for the field</p>
            <RevealText text="Four things that matter on a mission." />
          </Reveal>
          <div className="features">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90} className={`feature ${f.span} f${i + 1}`}>
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {f.chips.length > 0 && (
                  <ul className="chips">
                    {f.chips.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                )}
                {f.title === "GNSS-Denied Ops" && (
                  <svg className="feat-art" viewBox="0 0 240 240" aria-hidden="true">
                    <circle className="r1" cx="120" cy="120" r="110" />
                    <circle className="r2" cx="120" cy="120" r="78" />
                    <circle className="r3" cx="120" cy="120" r="46" />
                    <circle cx="120" cy="120" r="7" className="core" />
                    <path className="cut" d="M40 40L200 200" />
                  </svg>
                )}
                {f.title === "Integrated Unit" && (
                  <Image className="feat-img" src="/images/module.png" alt="" width={900} height={600} sizes="400px" aria-hidden="true" />
                )}
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- technology ---------- */}
        <section id="technology" className="section tech">
          <Reveal>
            <p className="eyebrow">The technology</p>
            <RevealText text="One integrated module. Any compatible UAV." />
          </Reveal>

          <div className="tech-grid">
            <Reveal className="panel light wipe">
              <Image src="/images/module.png" alt="Stride Dynamics VPS module" width={1800} height={1200} sizes="(max-width: 900px) 100vw, 50vw" />
              <p className="panel-cap">Stride VPS module</p>
            </Reveal>
            <Reveal delay={150} className="panel light wipe">
              <Image src="/images/cad.jpg" alt="CAD drawing of the VPS module mounted on a multirotor frame" width={1559} height={1169} sizes="(max-width: 900px) 100vw, 50vw" />
              <p className="panel-cap">Module mounted on a multirotor airframe (CAD)</p>
            </Reveal>
          </div>

          {/* integration diagram */}
          <Reveal className="integrate">
            <h3>Plugs into your existing stack</h3>
            <div className="diagram" role="img" aria-label="Stride VPS module connects to a flight controller over MAVLink or NMEA">
              <div className="node strong">
                <small>Stride</small>
                <b>VPS module</b>
                <span>sensors + compute</span>
              </div>
              <div className="wire" aria-hidden="true">
                <i /><span>MAVLink · NMEA</span>
              </div>
              <div className="node">
                <small>Flight controller</small>
                <b>PX4 · ArduPilot</b>
                <span>supporting firmware</span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- careers + contact ---------- */}
        <section id="contact" className="section cta">
          <Reveal className="cta-box">
            <div>
              <p className="eyebrow">Get in touch</p>
              <RevealText text="See it navigate without GNSS." />
              <p className="sub">Request a demonstration or talk to the team about integrating Stride VPS.</p>
            </div>
            <div className="cta-actions">
              <a className="btn solid" href={`mailto:${MAIL}?subject=Request%20Demonstration`}>Request Demonstration</a>
              <Link className="btn ghost" href="/careers">Careers</Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import FlightScene from "@/components/FlightScene";
import Reveal from "@/components/Reveal";
import Decode from "@/components/Decode";
import Reticle from "@/components/Reticle";
import { Header, Footer, MAIL } from "@/components/Chrome";

const FEATURES = [
  {
    title: "GNSS-Denied Ops",
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
      <Header />
      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <Image src="/images/terrain.png" alt="" fill priority sizes="100vw" className="hero-terrain" aria-hidden="true" />
          <div className="scan" aria-hidden="true" />
          <div className="frame" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="status" aria-hidden="true">
            <span className="dot" /> System online <em>Vision nav ready</em> <em>GNSS denied</em>
          </div>
          <Reticle />
          <div className="hero-copy">
            <p className="eyebrow"><Decode text="Visual Positioning System" /></p>
            <h1>
              Navigate the modern <Decode text="battlefield" className="hl" delay={250} />
            </h1>
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

        {/* ---------- LIVE SIMULATION ---------- */}
        <section id="simulation" className="sim">
          <div className="sim-head">
            <p className="eyebrow">See it in action</p>
            <h2>Follow one mission, step by step.</h2>
          </div>
          <FlightScene />
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="section">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2>When GNSS goes dark, navigation shouldn&apos;t.</h2>
          </Reveal>
          <ol className="flow">
            {FLOW.map((f, i) => (
              <li key={f.n}>
                <Reveal delay={i * 120} className={`flow-card ${f.tone}`}>
                  <span className="flow-n">{f.n}</span>
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
            <p className="statement">
              We are building the next generation of <mark>aerial robotics solutions</mark> from India.
            </p>
            <p className="sub">
              Our vision is to enable resilience and autonomy for UAVs, and to make field-reliable robotics systems a global standard.
            </p>
          </Reveal>
        </section>

        {/* ---------- features ---------- */}
        <section id="features" className="section">
          <Reveal>
            <p className="eyebrow">Built for the field</p>
            <h2>Four things that matter on a mission.</h2>
          </Reveal>
          <div className="features">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90} className="feature">
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- technology ---------- */}
        <section id="technology" className="section tech">
          <Reveal>
            <p className="eyebrow">The technology</p>
            <h2>One integrated module. Any compatible UAV.</h2>
          </Reveal>

          <div className="tech-grid">
            <Reveal className="panel light">
              <Image src="/images/module.png" alt="Stride Dynamics VPS module" width={1800} height={1200} sizes="(max-width: 900px) 100vw, 50vw" />
              <p className="panel-cap">Stride VPS module</p>
            </Reveal>
            <Reveal delay={120} className="panel light">
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
            <ul className="chips" aria-label="Supported airframes">
              <li>Rotary</li>
              <li>Hybrid VTOL</li>
              <li>Fixed-wing</li>
            </ul>
          </Reveal>
        </section>

        {/* ---------- careers + contact ---------- */}
        <section id="contact" className="section cta">
          <Reveal className="cta-box">
            <div>
              <p className="eyebrow">Get in touch</p>
              <h2>See it navigate without GNSS.</h2>
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

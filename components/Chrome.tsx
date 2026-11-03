import Image from "next/image";
import Link from "next/link";

export const MAIL = "info@stridedynamics.com";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Stride Dynamics home">
        <Image src="/images/logo.png" alt="Stride Dynamics" width={180} height={52} priority />
      </Link>
      <nav aria-label="Primary">
        <Link href="/#simulation">Simulation</Link>
        <Link href="/#how">How it works</Link>
        <Link href="/#features">Features</Link>
        <Link href="/#technology">Technology</Link>
        <Link href="/careers">Careers</Link>
      </nav>
      <a className="btn outline" href={`mailto:${MAIL}?subject=Request%20Demonstration`}>
        Request Demonstration
      </a>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Image src="/images/logo.png" alt="Stride Dynamics" width={150} height={44} className="foot-logo" />
        <p>Stride Dynamics Private Limited</p>
        <p>Rajkot, India</p>
      </div>
      <div>
        <h4>Contact</h4>
        <a href={`mailto:${MAIL}`}>{MAIL}</a>
        <a href="https://www.linkedin.com/company/stride-dynamics/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
      <div>
        <h4>Company</h4>
        <Link href="/careers">Careers</Link>
        <Link href="/#technology">Technology</Link>
      </div>
      <p className="copy">© 2026 by Stride Dynamics Pvt. Ltd. | All Rights Reserved</p>
    </footer>
  );
}

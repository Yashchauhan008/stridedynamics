import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";

export const MAIL = "info@stridedynamics.com";

export function Header() {
  return <Nav />;
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

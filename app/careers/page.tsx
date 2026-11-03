import type { Metadata } from "next";
import { Header, Footer, MAIL } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "Careers | Stride Dynamics",
  description: "Open positions at Stride Dynamics.",
};

export default function Careers() {
  return (
    <>
      <Header />
      <main className="section careers">
        <p className="eyebrow">Careers</p>
        <h1 className="h2">Build aerial robotics from India.</h1>
        <div className="empty">
          <b>0</b>
          <p>open positions right now.</p>
        </div>
        <p className="sub">
          Interested anyway? Write to <a href={`mailto:${MAIL}`}>{MAIL}</a> and tell us what you would like to build.
        </p>
      </main>
      <Footer />
    </>
  );
}

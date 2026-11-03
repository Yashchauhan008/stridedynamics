import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visual Positioning System | Stride Dynamics",
  description:
    "Advanced Visual Positioning System for UAVs to enable navigation in GNSS-Denied environments.",
  metadataBase: new URL("https://www.stridedynamics.com"),
  openGraph: {
    title: "Visual Positioning System | Stride Dynamics",
    description:
      "AI-powered vision-based navigation for UAVs operating in GNSS-denied, EW-congested environments.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

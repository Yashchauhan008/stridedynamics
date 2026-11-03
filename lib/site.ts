/**
 * Public origin used for canonical URLs, Open Graph images, sitemap and robots.
 * Set NEXT_PUBLIC_SITE_URL in the host's env (e.g. Vercel) when the final domain is live,
 * e.g. https://www.stridedynamics.com — no code change needed.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://stridedynamics.yashchauhan.pro").replace(/\/$/, "");

export const SITE = {
  name: "Stride Dynamics",
  legalName: "Stride Dynamics Private Limited",
  title: "Visual Positioning System | Stride Dynamics",
  description:
    "AI-powered vision-based navigation for UAVs in GNSS-denied, EW-congested environments. Plug-and-play with MAVLink, NMEA, PX4 and ArduPilot.",
  email: "info@stridedynamics.com",
  linkedin: "https://www.linkedin.com/company/stride-dynamics/",
  ogImage: "/og.png",
};

import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";

// Fraunces : serif douce et un peu bancale (axe SOFT), comme une ardoise de café écrite à la main.
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["SOFT", "WONK", "opsz"], style: ["normal", "italic"] });
// Figtree : texte rond et chaleureux, très lisible sur téléphone.
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Le Carnet Café",
  description: "Les cafés qu'on teste à trois, notés ensemble.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5EDE1" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1411" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

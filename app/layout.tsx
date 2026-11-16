import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", axes: ["opsz"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const num = JetBrains_Mono({ subsets: ["latin"], variable: "--font-num", weight: ["500", "700"] });

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
    { media: "(prefers-color-scheme: light)", color: "#1D5A41" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1512" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${num.variable}`}>
      <body>{children}</body>
    </html>
  );
}

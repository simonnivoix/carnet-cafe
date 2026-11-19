import type { NextConfig } from "next";
import { mkdirSync, writeFileSync } from "node:fs";

// Site statique publié sur GitHub Pages : https://simonnivoix.github.io/carnet-cafe/
const basePath = process.env.NODE_ENV === "production" ? "/carnet-cafe" : "";

// Numéro de version de chaque build : gravé dans le code ET publié dans /version.json.
// Au chargement (et au retour sur l'onglet), la page compare les deux et se recharge si une version plus récente est en ligne
// (GitHub Pages laisse le navigateur garder la page 10 min en cache). Voir lib/update.ts.
const build = process.env.NODE_ENV !== "production" ? "dev" : process.env.GITHUB_SHA?.slice(0, 12) ?? new Date().toISOString().replace(/\D/g, "").slice(0, 14);
mkdirSync("public", { recursive: true });
writeFileSync("public/version.json", JSON.stringify({ build }) + "\n");

const config: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  turbopack: { root: process.cwd() },
  env: { NEXT_PUBLIC_BUILD: build, NEXT_PUBLIC_BASE_PATH: basePath },
};

export default config;

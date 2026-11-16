import type { NextConfig } from "next";

// Site statique publié sur GitHub Pages : https://simonnivoix.github.io/carnet-cafe/
const config: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/carnet-cafe" : "",
  trailingSlash: true,
  turbopack: { root: process.cwd() },
};

export default config;

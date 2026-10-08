import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static site for GitHub Pages: `npm run build` writes plain HTML to ./out.
  output: "export",
  // GitHub Pages serves project sites under /<repo-name>; the deploy workflow
  // sets this. Empty when running locally.
  basePath: process.env.PAGES_BASE_PATH || "",
};

export default nextConfig;

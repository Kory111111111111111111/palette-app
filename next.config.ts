import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Remove basePath and assetPrefix for GitHub Pages
  // GitHub Pages will serve from the root of your repository
};

export default nextConfig;

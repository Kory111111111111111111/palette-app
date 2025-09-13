import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/palette-app' : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Ensure proper static export configuration
  distDir: 'out',
  // Add basePath for GitHub Pages deployment
  basePath,
  assetPrefix: basePath,
  // Ensure proper asset loading
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;

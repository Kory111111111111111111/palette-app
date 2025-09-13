import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Ensure proper static export configuration
  distDir: 'out',
  // Disable server-side features that don't work with static export
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;

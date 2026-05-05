import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes: true, // TODO: habilitar após refactoring dos links
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

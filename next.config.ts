import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "grippy.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.grippy.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

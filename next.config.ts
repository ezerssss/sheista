import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "userpic.codeforces.org" },
      { protocol: "https", hostname: "userpic.codeforces.com" },
    ],
  },
};

export default nextConfig;

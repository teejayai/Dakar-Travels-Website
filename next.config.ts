import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local decorative SVGs (landmarks, icons) served via next/image
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;

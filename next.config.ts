import type { NextConfig } from "next";

/** Static export powers both the web deploy and the Expo WebView bundle. */
const nextConfig: NextConfig = {
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
  // Optional: allow `next dev` from LAN devices (edit for your network).
  allowedDevOrigins: ['192.168.29.198'],
};

export default nextConfig;

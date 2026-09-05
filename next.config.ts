import type { NextConfig } from "next";

/** Static export powers both the web deploy and the Expo WebView bundle. */
const nextConfig: NextConfig = {
  output: "export",
  // Type errors must fail the build. This was previously disabled, which let a
  // real defect ship: `setName` was undefined in the Instruments screen, so the
  // rename field silently rejected every keystroke in production.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  devIndicators: false,
  // Optional: allow `next dev` from LAN devices (edit for your network).
  allowedDevOrigins: ['192.168.29.198'],
};

export default nextConfig;

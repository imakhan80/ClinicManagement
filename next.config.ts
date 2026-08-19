import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets the dev server be reached via the sandbox's LAN-forwarded address
  // (browser automation can't resolve `localhost` back to this host).
  allowedDevOrigins: ["172.27.0.1"],
};

export default nextConfig;

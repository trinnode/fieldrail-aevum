import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@fieldrail/chain-config",
    "@fieldrail/contracts-client",
    "@fieldrail/shared-types",
  ],
};

export default nextConfig;

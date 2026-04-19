import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@raiseready/auth", "@raiseready/db", "@raiseready/config"],
};

export default config;

import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "node:path";

function getPagesBasePath() {
  const explicitBasePath = process.env.PAGES_BASE_PATH?.trim();

  if (explicitBasePath) {
    if (explicitBasePath === "/") {
      return "";
    }

    return explicitBasePath.startsWith("/")
      ? explicitBasePath.replace(/\/+$/, "")
      : `/${explicitBasePath.replace(/\/+$/, "")}`;
  }

  return "";
}

const pagesBasePath = getPagesBasePath();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  basePath: pagesBasePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: pagesBasePath,
  },
};

export default function configureNext(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    webpack(config) {
      // Webpack's gzip cache uses 100 MiB buffers per stream. Avoid those
      // transient allocations during local rebuilds; retain the disk cache.
      if (config.cache && typeof config.cache === "object") {
        config.cache.compression = false;
      }
      return config;
    },
  };
}

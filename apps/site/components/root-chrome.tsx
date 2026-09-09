"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  PrivateFeatureAccessProvider,
  PrivateFeatureGate,
  PrivateFeaturePageFallback,
} from "@/components/private-feature-access";
import { SiteShell } from "@/components/site-shell";
import { WebMcpTools } from "@/components/webmcp-tools";
import { normalizeBasePath } from "@/lib/utils/site-path";

type RootChromeProps = {
  children: ReactNode;
};

const PRIVATE_FEATURE_ROUTES = [
  "/category/fitness",
];

function normalizeAppPathname(pathname: string | null) {
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
  let normalizedPathname = pathname || "/";

  if (
    basePath &&
    (normalizedPathname === basePath || normalizedPathname.startsWith(`${basePath}/`))
  ) {
    normalizedPathname = normalizedPathname.slice(basePath.length) || "/";
  }

  return normalizedPathname;
}

function isPrivateFeatureRoute(pathname: string | null) {
  const normalizedPathname = normalizeAppPathname(pathname);

  return PRIVATE_FEATURE_ROUTES.some(
    (route) => normalizedPathname === route || normalizedPathname.startsWith(`${route}/`)
  );
}

export function RootChrome({ children }: RootChromeProps) {
  const pathname = usePathname();
  const normalizedPathname = normalizeAppPathname(pathname);
  const isPrivateRoute = isPrivateFeatureRoute(pathname);

  return (
    <PrivateFeatureAccessProvider>
      <WebMcpTools />
      <SiteShell currentPathname={normalizedPathname}>
        {isPrivateRoute ? (
          <PrivateFeatureGate
            fallback={<PrivateFeaturePageFallback />}
            loadingFallback={<PrivateFeaturePageFallback />}
          >
            {children}
          </PrivateFeatureGate>
        ) : (
          children
        )}
      </SiteShell>
    </PrivateFeatureAccessProvider>
  );
}

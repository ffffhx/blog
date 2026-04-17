import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";
import { SITE } from "@/lib/content/config";
import { withBasePath } from "@/lib/utils/site-path";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  icons: {
    icon: withBasePath("/images/favicon.svg"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

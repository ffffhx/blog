import Link from "next/link";

import { CATEGORY_DEFINITIONS, SITE } from "@/lib/content/config";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: `/category/${CATEGORY_DEFINITIONS.tech.slug}`, label: CATEGORY_DEFINITIONS.tech.label },
  {
    href: `/category/${CATEGORY_DEFINITIONS.fitness.slug}`,
    label: CATEGORY_DEFINITIONS.fitness.label,
  },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-900/10 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-1">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-slate-950"
          >
            {SITE.title}
          </Link>
          <p className="text-sm text-slate-600">{SITE.description}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-950 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

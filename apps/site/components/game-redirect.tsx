"use client";

import React, { useEffect } from "react";

import { GAME_ENTRIES } from "@/lib/games";

export function gameRedirectUrl(destination: string, currentUrl: string) {
  const target = new URL(destination);
  const current = new URL(currentUrl);
  for (const key of ["room", "seat"]) {
    const value = current.searchParams.get(key);
    if (value !== null) target.searchParams.set(key, value);
  }
  target.hash = current.hash;
  return target.href;
}

export function GameRedirect({ slug }: { slug: string }) {
  const game = GAME_ENTRIES.find((entry) => entry.slug === slug);
  // Pages is a static host: redirect in the browser, keeping room invitations.
  // Only forward game parameters; never carry the blog's login token across.
  useEffect(() => {
    if (game) window.location.replace(gameRedirectUrl(game.href, window.location.href));
  }, [game]);

  if (!game) throw new Error(`Unknown game: ${slug}`);

  return (
    <main className="space-y-4">
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${game.href}`} />
      </noscript>
      <h1 className="font-display text-3xl text-ink">{game.title}已搬到独立游戏站</h1>
      <p>正在跳转。如果没有自动打开，请点击下面的链接。</p>
      <a className="underline underline-offset-4" href={game.href}>进入{game.title}</a>
    </main>
  );
}

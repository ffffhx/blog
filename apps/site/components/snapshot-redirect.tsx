"use client";
import React, { useEffect, useState } from "react";
import { AGENT_SNAPSHOTS_URL } from "@/lib/standalone-projects";

export function snapshotRedirectUrl(currentUrl: string, share: boolean, siteUrl = AGENT_SNAPSHOTS_URL) {
  const target = new URL(siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`);
  const id = new URL(currentUrl).searchParams.get("id");
  if (share && id && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id)) {
    target.pathname += "share/";
    target.searchParams.set("id", id);
  }
  return target.href;
}

export function SnapshotRedirect({ share = false }: { share?: boolean }) {
  const [href, setHref] = useState(AGENT_SNAPSHOTS_URL);
  useEffect(() => {
    const destination = snapshotRedirectUrl(window.location.href, share);
    setHref(destination);
    window.location.replace(destination);
  }, [share]);
  return (
    <main className="space-y-4">
      <h1 className="font-display text-3xl text-ink">会话快照已迁至 Agent Snapshots</h1>
      <p>正在跳转到独立项目。若未自动打开，请使用下方链接。</p>
      <a className="underline underline-offset-4" href={href}>打开 Agent Snapshots</a>
      <noscript>自动迁移分享地址需要启用 JavaScript。</noscript>
    </main>
  );
}

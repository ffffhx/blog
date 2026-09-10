"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = { title: string; content?: string; contentHtml?: string };
type Export = { markdown: string; filename: string };

export async function copyMarkdown(markdown: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
      return;
    }
  } catch { /* Fall back for browsers that deny the Clipboard API. */ }
  const focused = document.activeElement as HTMLElement | null;
  const textarea = document.createElement("textarea");
  textarea.value = markdown;
  textarea.readOnly = true;
  textarea.style.cssText = "position:fixed;left:-9999px;top:0;font-size:16px";
  document.body.append(textarea);
  try {
    textarea.select();
    if (!document.execCommand("copy")) throw new Error("Copy unavailable");
  } finally {
    textarea.remove();
    focused?.focus({ preventScroll: true });
  }
}

export function ArticleMarkdownActions({ title, content, contentHtml = "" }: Props) {
  const [prepared, setPrepared] = useState<Export | null>(null);
  const [message, setMessage] = useState("");
  const [copying, setCopying] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const manualRef = useRef<HTMLTextAreaElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    setPrepared(null);
    setFailed(false);
    setMessage("");
    setManualCopy(false);
    import("@/lib/content/markdown-export")
      .then(({ createMarkdownExport }) => createMarkdownExport({ title, content, contentHtml }, window.location.href))
      .then((result) => { if (active) setPrepared(result); })
      .catch(() => {
        if (active) { setFailed(true); setMessage("Markdown 准备失败，请重试。"); }
      });
    return () => {
      active = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [title, content, contentHtml, attempt]);

  useEffect(() => {
    if (manualCopy) { manualRef.current?.focus(); manualRef.current?.select(); }
  }, [manualCopy]);

  function announce(text: string) {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setMessage(text);
    resetTimer.current = setTimeout(() => setMessage(""), 4000);
  }

  async function handleCopy() {
    if (!prepared || copying) return;
    setCopying(true);
    setManualCopy(false);
    try {
      await copyMarkdown(prepared.markdown);
      announce("已复制 Markdown");
    } catch {
      setMessage("浏览器未允许自动复制，已选中全文，可手动复制。");
      setManualCopy(true);
    } finally { setCopying(false); }
  }

  function handleDownload() {
    if (!prepared) return;
    try {
      const url = URL.createObjectURL(new Blob([prepared.markdown], { type: "text/markdown;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = prepared.filename;
      document.body.append(link);
      try { link.click(); } finally {
        link.remove();
        // Leave time for the browser to start reading the download.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
      announce("已开始下载 Markdown 文件");
    } catch { setMessage("下载失败，请重试，或复制 Markdown 保存。"); }
  }

  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/30 bg-paper-soft px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-red hover:bg-paper-deep hover:text-red focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red disabled:opacity-50";

  return (
    <section aria-label="导出文章" className="border-y border-ink/15 py-3 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono-ui text-xs tracking-wide text-muted">留一份 Markdown</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleCopy} disabled={!prepared || copying} className={buttonClass}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
            </svg>
            {copying ? "正在复制…" : message === "已复制 Markdown" ? "已复制 Markdown" : "复制 Markdown"}
          </button>
          <button type="button" onClick={handleDownload} disabled={!prepared} className={buttonClass}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </svg>
            下载 Markdown
          </button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="text-xs text-muted empty:hidden [&:not(:empty)]:mt-2">
        {message || (!prepared && !failed ? "正在准备 Markdown…" : "")}
      </p>
      {failed ? <button type="button" onClick={() => setAttempt((value) => value + 1)} className={`${buttonClass} mt-2`}>重试</button> : null}
      {manualCopy && prepared ? (
        <textarea ref={manualRef} aria-label="手动复制 Markdown" value={prepared.markdown} readOnly
          className="mt-3 h-48 w-full rounded-lg border border-ink/30 bg-paper-soft p-3 font-mono text-xs text-ink focus-visible:outline-2 focus-visible:outline-red" />
      ) : null}
    </section>
  );
}

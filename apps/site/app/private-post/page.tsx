"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ArticleLayout } from "@/components/article-layout";
import {
  getAuthHeaders,
  PrivateFeaturePageFallback,
  usePrivateFeatureAccess,
} from "@/components/private-feature-access";
import type { PrivatePostData } from "@/lib/content/types";
import { withBasePath } from "@/lib/utils/site-path";

function PrivatePostContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const access = usePrivateFeatureAccess();

  const [post, setPost] = useState<PrivatePostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("未指定文章标识 (slug)");
      setLoading(false);
      return;
    }

    if (access.status === "loading") {
      return;
    }

    if (access.status !== "allowed") {
      if (slug) {
        const publicUrl = withBasePath(`/post/${encodeURIComponent(slug)}/`);
        fetch(publicUrl, { method: "HEAD" })
          .then((res) => {
            if (res.ok) {
              window.location.replace(publicUrl);
            } else {
              setLoading(false);
            }
          })
          .catch(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
      return;
    }

    if (!access.apiBaseUrl) {
      setError("未配置 Garden API 服务地址");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetch(`${access.apiBaseUrl}/api/private-posts/${encodeURIComponent(slug)}`, {
      credentials: "include",
      cache: "no-store",
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            throw new Error("无权访问该私密文章，请登录作者账号");
          }
          if (res.status === 404) {
            throw new Error(`未找到私密文章「${slug}」，可能未同步至服务端数据目录`);
          }
          throw new Error(`加载文章失败 (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data: PrivatePostData) => {
        if (active) {
          setPost(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "加载文章失败");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [access.apiBaseUrl, access.status, slug]);

  if (access.status === "loading" || (loading && !error)) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="riso-card riso-card--teal animate-pulse space-y-6 p-6 sm:p-10">
          <div className="h-4 w-28 rounded bg-ink/10" />
          <div className="h-10 w-3/4 rounded bg-ink/15" />
          <div className="h-5 w-48 rounded bg-ink/10" />
          <div className="space-y-3 pt-6">
            <div className="h-4 w-full rounded bg-ink/10" />
            <div className="h-4 w-5/6 rounded bg-ink/10" />
            <div className="h-4 w-4/6 rounded bg-ink/10" />
          </div>
        </div>
      </main>
    );
  }

  if (access.status !== "allowed") {
    return (
      <div className="space-y-6">
        {slug ? (
          <div className="mx-auto max-w-xl text-center">
            <Link
              href={`/post/${encodeURIComponent(slug)}/`}
              className="inline-flex items-center gap-2 rounded-full border border-ink/40 bg-paper-soft px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-red hover:text-red hover:bg-paper-deep"
            >
              👉 该文章为公开文章，点击前往公开版页面
            </Link>
          </div>
        ) : null}
        <PrivateFeaturePageFallback />
      </div>
    );
  }

  if (error || !post) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center p-4">
        <section className="w-full rounded-[1.25rem] border border-ink/20 bg-paper-soft p-8 text-center shadow-lg">
          <span className="riso-sticker riso-sticker--terra">Error · 提示</span>
          <h1 className="font-display mt-4 text-2xl font-semibold text-ink">
            无法读取私密文章
          </h1>
          <p className="mt-3 text-sm text-ink-soft">{error || "未知错误"}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold !text-paper-soft transition hover:bg-red"
            >
              返回首页
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <ArticleLayout post={post} privateArticle />;
}

export default function PrivatePostPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <div className="riso-card riso-card--teal animate-pulse p-10">
            <div className="h-6 w-32 rounded bg-ink/10" />
          </div>
        </main>
      }
    >
      <PrivatePostContent />
    </Suspense>
  );
}

import Link from "next/link";

import { PostMeta } from "@/components/post-meta";
import type { PostSummary } from "@/lib/content/types";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group rounded-[2rem] border border-slate-900/10 bg-white/85 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:shadow-[0_32px_96px_-48px_rgba(15,23,42,0.55)]">
      <div className="flex h-full flex-col gap-5">
        <PostMeta
          categories={post.categories}
          dateText={post.dateText}
          readingTimeText={post.readingTimeText}
          tags={post.tags}
        />
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            <Link href={`/post/${post.slug}`} className="hover:text-amber-700">
              {post.title}
            </Link>
          </h2>
          <p className="text-base leading-8 text-slate-700">{post.excerpt}</p>
        </div>
        <div className="mt-auto">
          <Link
            href={`/post/${post.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition group-hover:text-amber-700"
          >
            继续阅读
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { getAllCategories } from "@/lib/content/categories";
import { SITE } from "@/lib/content/config";
import { getAllPosts } from "@/lib/content/posts";

export default function HomePage() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const featuredPosts = posts.slice(0, 8);

  return (
    <main className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 text-white shadow-[0_36px_120px_-64px_rgba(15,23,42,0.8)]">
        <div
          className="grid gap-8 bg-cover bg-center px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] lg:px-12 lg:py-14"
          style={{ backgroundImage: "url('/images/banner.svg')" }}
        >
          <div className="space-y-6 rounded-[1.75rem] bg-slate-950/55 p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">{SITE.subtitle}</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              一个用 React 重新搭起来的长文博客
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
              {SITE.description}
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-white/12 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-white/70">内容分区</p>
            <div className="mt-5 space-y-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="block rounded-[1.5rem] border border-white/15 bg-white/8 px-5 py-4 transition hover:bg-white/16"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold">{category.label}</h2>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-sm text-white/80">
                      {category.posts.length} 篇
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    {category.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Latest Writing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">最新文章</h2>
          </div>
        </div>
        {featuredPosts.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="还没有文章" description="内容会在这里出现。" />
        )}
      </section>
    </main>
  );
}

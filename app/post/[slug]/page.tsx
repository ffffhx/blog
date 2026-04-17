import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/article-body";
import { PostMeta } from "@/components/post-meta";
import { PostToc } from "@/components/post-toc";
import { TOC_MIN_HEADINGS } from "@/lib/content/config";
import { getAllPostSlugs, getPostBySlug } from "@/lib/content/posts";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "未找到文章",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const showToc = post.headings.length >= TOC_MIN_HEADINGS;

  return (
    <main className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="rounded-[2rem] border border-slate-900/10 bg-white/90 p-7 shadow-[0_32px_120px_-68px_rgba(15,23,42,0.65)] sm:p-10">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Post</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {post.title}
            </h1>
          </div>
          <PostMeta
            categories={post.categories}
            dateText={post.dateText}
            readingTimeText={post.readingTimeText}
            tags={post.tags}
          />
        </div>
        <div className="mt-10">
          <ArticleBody html={post.contentHtml} />
        </div>
      </article>
      <div className="xl:sticky xl:top-24 xl:h-fit">
        {showToc ? <PostToc headings={post.headings} /> : null}
      </div>
    </main>
  );
}

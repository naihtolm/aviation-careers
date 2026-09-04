import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug } from "@/features/resources/queries";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-sm text-slate-500">
        <Link href="/resources" className="hover:underline hover:text-slate-900 transition-colors">Resources</Link> / {article.category}
      </p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 mt-2">{article.title}</h1>
      <p className="text-sm text-slate-500 mt-2">
        {article.author_name}
        {article.published_at && <> · {formatDate(article.published_at)}</>}
      </p>

      <div
        className="prose prose-slate prose-headings:font-display prose-a:text-brand-600 max-w-none mt-8"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
}

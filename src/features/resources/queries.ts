// features/resources/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getPublishedArticles() {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, category, author_name, published_at")
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase.from("articles").select("*").eq("slug", slug).maybeSingle();
  return data;
}

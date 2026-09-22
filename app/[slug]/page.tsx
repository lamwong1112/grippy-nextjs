import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getPageSlugs } from "@/lib/graphql";

export const revalidate = 60;

const RESERVED = new Set(["shop", "products", "api", "cart", "_next"]);

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPageSlugs(50);
  return slugs
    .filter((slug) => slug && !RESERVED.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug)) return {};
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page" };
  return {
    title: page.title,
    description: page.excerpt?.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-5xl">
        {page.title}
      </h1>
      <div
        className="prose-wp mt-8"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </article>
  );
}
